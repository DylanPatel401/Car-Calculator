import { AppScenario } from '@/types/domain';

export const CURRENT_SCHEMA_VERSION = 1;

export const createDefaultScenario = (): AppScenario => ({
  version: CURRENT_SCHEMA_VERSION,
  onboardingComplete: false,
  profile: {
    paycheckAmount: 2500,
    payFrequency: 'twiceMonthly',
    sideIncomeMonthly: 0,
    includeSideIncome: false,
    emergencySavings: 10000,
    carSavings: 5000,
    otherSavings: 0,
    reserveTarget: 10000,
    expenseMode: 'quick',
    essentialExpensesQuick: 2500,
    detailedExpenses: {
      housing: 1500,
      groceries: 450,
      utilities: 200,
      phone: 80,
      transportation: 150,
      insurance: 0,
      subscriptions: 50,
      otherRequired: 70,
    },
    discretionarySpending: 400,
    monthlyCarSavingsContribution: 500,
    useEmergencyForDownPayment: false,
    debtAvalancheEnabled: true,
  },
  debts: [],
  vehicle: {
    make: '',
    model: '',
    trim: '',
    year: new Date().getFullYear() - 2,
    condition: 'used',
    price: 30000,
    mileage: 25000,
    mpg: 25,
    annualMiles: 12000,
    fuelPrice: 3.5,
    insuranceMonthly: 180,
    maintenanceMonthly: null,
    registrationAnnual: 240,
    parkingMonthly: 0,
    tollsMonthly: 0,
    otherMonthly: 0,
  },
  loan: {
    taxRate: 7,
    fees: 800,
    tradeInCredit: 0,
    negativeEquity: 0,
    downPayment: 3000,
    apr: 6.5,
    termMonths: 60,
  },
  timing: {
    customPurchaseDate: new Date(Date.now() + 180 * 86400000).toISOString(),
    waitingMonthlyCosts: 0,
  },
});

export function migrateScenario(raw: unknown): AppScenario {
  const fallback = createDefaultScenario();
  if (!raw || typeof raw !== 'object') return fallback;
  const candidate = raw as Partial<AppScenario>;
  if (candidate.version !== CURRENT_SCHEMA_VERSION) return fallback;
  return {
    ...fallback,
    ...candidate,
    profile: { ...fallback.profile, ...candidate.profile, detailedExpenses: { ...fallback.profile.detailedExpenses, ...candidate.profile?.detailedExpenses } },
    vehicle: { ...fallback.vehicle, ...candidate.vehicle },
    loan: { ...fallback.loan, ...candidate.loan },
    timing: { ...fallback.timing, ...candidate.timing },
    debts: Array.isArray(candidate.debts) ? candidate.debts : [],
  };
}

/** Blank finances for a fresh workspace; sample assumptions remain confined to the demo. */
export function createEmptyScenario(): AppScenario {
  const s = createDefaultScenario();
  s.profile = { ...s.profile, paycheckAmount: 0, emergencySavings: 0, carSavings: 0, otherSavings: 0, reserveTarget: 0,
    essentialExpensesQuick: 0, discretionarySpending: 0, monthlyCarSavingsContribution: 0,
    detailedExpenses: { housing: 0, groceries: 0, utilities: 0, phone: 0, transportation: 0, insurance: 0, subscriptions: 0, otherRequired: 0 } };
  return s;
}
