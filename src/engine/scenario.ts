import { calculateLoan } from '@/engine/financing';
import { monthlyIncome, essentialExpenses } from '@/engine/cashflow';
import { projectDebtPayoff } from '@/engine/debt';
import { calculateMonthlyFuelCost } from '@/engine/fuel';
import { maintenanceCost } from '@/engine/maintenance';
import { AppScenario, ScenarioResult } from '@/types/domain';

export function calculateScenario(scenario: AppScenario): ScenarioResult {
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
  const monthlySurplus = trueMonthlyCost === null ? null : income - expenses - minimumDebtPayments
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

  const warnings: string[] = [];
  if (!scenario.vehicle.make.trim() || !scenario.vehicle.model.trim()) warnings.push('Add the vehicle make and model.');
  if (scenario.vehicle.price <= 0) warnings.push('Enter a vehicle price.');
  if (fuelMonthly === null) warnings.push('Enter MPG above zero to calculate fuel cost.');
  if (downPaymentShortfall > 0) warnings.push('Part of the requested down payment cannot be applied. Calculations use the funded purchase amount.');
  if (monthlySurplus !== null && monthlySurplus < 0) warnings.push('This scenario creates a monthly cash-flow shortfall.');
  if (reserveGap < 0) warnings.push('Emergency savings fall below your reserve target.');
  if (!debtWithCar.isPayable) warnings.push('At least one debt does not amortize under these assumptions.');

  return {
    complete: warnings.every((warning) => !warning.startsWith('Add') && !warning.startsWith('Enter')),
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
    debtDelayMonths,
    warnings,
  };
}
