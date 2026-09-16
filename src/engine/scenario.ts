import { scenarioIssues } from '@/engine/validation';
import { calculateLoan } from '@/engine/financing';
import { monthlyIncome, essentialExpenses } from '@/engine/cashflow';
import { projectDebtPayoff } from '@/engine/debt';
import { calculateMonthlyFuelCost } from '@/engine/fuel';
import { maintenanceCost } from '@/engine/maintenance';
import { AppScenario, ScenarioResult } from '@/types/domain';

export function calculateScenario(scenario: AppScenario): ScenarioResult {
  const issues = scenarioIssues(scenario);
  if (issues.some(i => i.code === 'invalid' || i.field === 'vehicle.price')) {
    return { complete: false, status: 'incomplete', issues, warnings: issues.map(i => i.message),
      vehicleName: [scenario.vehicle.year, scenario.vehicle.make, scenario.vehicle.model].join(' '),
      monthlyIncome: null, essentialExpenses: null, minimumDebtPayments: null, maintenanceMonthly: null,
      maintenanceIsEstimate: scenario.vehicle.maintenanceMonthly === null, fuelMonthly: null, trueMonthlyCost: null,
      monthlySurplus: null, cashRemaining: null, emergencyCashRemaining: null, emergencyRunwayMonths: null,
      transportationIncomePercent: null, reserveGap: null, downPaymentApplied: null, downPaymentShortfall: null,
      loan: { taxes: null, amountFinanced: null, monthlyPayment: null, totalInterest: null, totalFinancedCost: null, schedule: [] },
      debtWithoutCar: { months: null, totalInterest: 0, isPayable: false, payoffOrder: [] },
      debtWithCar: { months: null, totalInterest: 0, isPayable: false, payoffOrder: [] }, debtDelayMonths: null };
  }
  const income = monthlyIncome(scenario.profile);
  const expenses = essentialExpenses(scenario.profile);
  const minimumDebtPayments = scenario.debts.reduce((sum, debt) => sum + Math.max(0, debt.minimumPayment), 0);
  const carSavings = Math.max(0, scenario.profile.carSavings);
  const otherSavings = Math.max(0, scenario.profile.otherSavings);
  const emergencySavings = Math.max(0, scenario.profile.emergencySavings);
  const spendableSavings = carSavings + otherSavings;
  const availableDownPaymentCash = spendableSavings
    + (scenario.profile.useEmergencyForDownPayment ? emergencySavings : 0);
  const requestedDownPayment = Math.max(0, scenario.loan.downPayment);
  const balanceBeforeDownPayment = calculateLoan(scenario.vehicle.price, { ...scenario.loan, downPayment: 0 }).amountFinanced;
  const downPaymentApplied = Math.min(requestedDownPayment, availableDownPaymentCash, balanceBeforeDownPayment);
  const downPaymentShortfall = requestedDownPayment - downPaymentApplied;
  const loan = calculateLoan(scenario.vehicle.price, { ...scenario.loan, downPayment: downPaymentApplied });
  const fuelMonthly = calculateMonthlyFuelCost(scenario.vehicle.annualMiles, scenario.vehicle.mpg, scenario.vehicle.fuelPrice);
  const maintenance = maintenanceCost(scenario.vehicle);
  const trueMonthlyCost = fuelMonthly === null ? null : loan.monthlyPayment
    + Math.max(0, scenario.vehicle.insuranceMonthly)
    + fuelMonthly
    + maintenance.amount
    + Math.max(0, scenario.vehicle.registrationAnnual) / 12
    + Math.max(0, scenario.vehicle.parkingMonthly)
    + Math.max(0, scenario.vehicle.tollsMonthly)
    + Math.max(0, scenario.vehicle.otherMonthly);

  const emergencyUsed = scenario.profile.useEmergencyForDownPayment
    ? Math.min(emergencySavings, Math.max(0, downPaymentApplied - spendableSavings))
    : 0;
  const emergencyCashRemaining = emergencySavings - emergencyUsed;
  const spendableCashRemaining = Math.max(0, spendableSavings - downPaymentApplied);
  const cashRemaining = emergencyCashRemaining + spendableCashRemaining;
  const monthlySurplus = trueMonthlyCost === null || issues.some(i => i.field.startsWith('profile.') || i.field.startsWith('debts.')) ? null : income - expenses - minimumDebtPayments
    - trueMonthlyCost - Math.max(0, scenario.profile.discretionarySpending);
  const emergencyRunwayMonths = expenses > 0 ? emergencyCashRemaining / expenses : null;
  const transportationIncomePercent = trueMonthlyCost !== null && income > 0 ? trueMonthlyCost / income * 100 : null;
  const reserveGap = emergencyCashRemaining - Math.max(0, scenario.profile.reserveTarget);
  const availableBeforeCar = Math.max(0, income - expenses - minimumDebtPayments - scenario.profile.discretionarySpending);
  const availableWithCar = monthlySurplus === null ? 0 : Math.max(0, monthlySurplus);
  const debtWithoutCar = projectDebtPayoff(scenario.debts, availableBeforeCar, scenario.profile.debtAvalancheEnabled);
  const debtWithCar = projectDebtPayoff(scenario.debts, availableWithCar, scenario.profile.debtAvalancheEnabled);
  const debtDelayMonths = debtWithoutCar.months !== null && debtWithCar.months !== null
    ? Math.max(0, debtWithCar.months - debtWithoutCar.months)
    : null;

  if (downPaymentShortfall > 0) issues.push({ code: 'funding', field: 'loan.downPayment', message: 'Part of the requested down payment cannot be applied. Calculations use available purchase funds.' });
  if (monthlySurplus !== null && monthlySurplus < 0) issues.push({ code: 'cashflow', field: 'profile', message: 'This scenario creates a monthly cash-flow shortfall.' });
  if (reserveGap < 0) issues.push({ code: 'reserve', field: 'profile.reserveTarget', message: 'Emergency savings fall below your reserve target.' });
  if (!debtWithCar.isPayable) issues.push({ code: 'debt', field: 'debts', message: 'At least one debt does not amortize under these assumptions.' });
  const complete = !issues.some(i => i.code === 'missing' || i.code === 'invalid');

  return {
    complete, issues,
    status: !complete ? 'incomplete' : monthlySurplus !== null && monthlySurplus < 0 ? 'shortfall' : reserveGap < 0 ? 'reserveBelowTarget' : 'withinTarget',
    vehicleName: [scenario.vehicle.year, scenario.vehicle.make, scenario.vehicle.model].filter(Boolean).join(' '),
    monthlyIncome: income,
    essentialExpenses: expenses,
    minimumDebtPayments,
    maintenanceMonthly: maintenance.amount,
    maintenanceIsEstimate: maintenance.isEstimate,
    fuelMonthly,
    trueMonthlyCost,
    monthlySurplus,
    cashRemaining,
    emergencyCashRemaining,
    emergencyRunwayMonths,
    transportationIncomePercent,
    reserveGap,
    downPaymentApplied,
    downPaymentShortfall,
    loan,
    debtWithoutCar,
    debtWithCar,
    debtDelayMonths: monthlySurplus === null ? null : debtDelayMonths,
    warnings: issues.map(i => i.message),
  };
}
