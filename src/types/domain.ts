export type PayFrequency = 'weekly' | 'biweekly' | 'twiceMonthly' | 'monthly';
export type ExpenseMode = 'quick' | 'detailed';
export type DebtType = 'studentLoan' | 'creditCard' | 'personalLoan' | 'autoLoan' | 'other';
export type VehicleCondition = 'new' | 'used';

export interface DetailedExpenses {
  housing: number;
  groceries: number;
  utilities: number;
  phone: number;
  transportation: number;
  insurance: number;
  subscriptions: number;
  otherRequired: number;
}

export interface FinancialProfile {
  paycheckAmount: number;
  payFrequency: PayFrequency;
  sideIncomeMonthly: number;
  includeSideIncome: boolean;
  emergencySavings: number;
  carSavings: number;
  otherSavings: number;
  reserveTarget: number;
  expenseMode: ExpenseMode;
  essentialExpensesQuick: number;
  detailedExpenses: DetailedExpenses;
  discretionarySpending: number;
  monthlyCarSavingsContribution: number;
  useEmergencyForDownPayment: boolean;
  debtAvalancheEnabled: boolean;
}

export interface Debt {
  id: string;
  name: string;
  type: DebtType;
  balance: number;
  apr: number;
  minimumPayment: number;
}

export interface Vehicle {
  make: string;
  model: string;
  trim: string;
  year: number;
  condition: VehicleCondition;
  price: number;
  mileage: number;
  mpg: number;
  annualMiles: number;
  fuelPrice: number;
  insuranceMonthly: number;
  maintenanceMonthly: number | null;
  registrationAnnual: number;
  parkingMonthly: number;
  tollsMonthly: number;
  otherMonthly: number;
}

export interface LoanTerms {
  taxRate: number;
  fees: number;
  tradeInCredit: number;
  negativeEquity: number;
  downPayment: number;
  apr: number;
  termMonths: number;
}

export interface TimingSettings {
  customPurchaseDate: string;
  waitingMonthlyCosts: number;
}

export interface AppScenario {
  version: number;
  onboardingComplete: boolean;
  profile: FinancialProfile;
  debts: Debt[];
  vehicle: Vehicle;
  loan: LoanTerms;
  timing: TimingSettings;
}

export interface SavedOption {
  id: string;
  name: string;
  vehicle: Omit<Vehicle, 'annualMiles' | 'fuelPrice'>;
  loan: LoanTerms;
  timing: TimingSettings;
  createdAt: string;
  updatedAt: string;
}

export interface Workspace {
  version: 2;
  onboardingComplete: boolean;
  profile: FinancialProfile;
  debts: Debt[];
  driving: { annualMiles: number; fuelPrice: number };
  options: SavedOption[];
  activeOptionId: string;
  comparisonIds: string[];
  baselineId: string | null;
}

export interface AmortizationRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export interface LoanResult {
  taxes: number;
  amountFinanced: number;
  monthlyPayment: number;
  totalInterest: number;
  totalFinancedCost: number;
  schedule: AmortizationRow[];
}

export interface DebtProjection {
  months: number | null;
  totalInterest: number;
  isPayable: boolean;
  payoffOrder: string[];
}

export interface CalculationIssue {
  code: 'missing' | 'invalid' | 'cashflow' | 'reserve' | 'funding' | 'debt';
  field: string;
  message: string;
}

export type ScenarioStatus = 'incomplete' | 'shortfall' | 'reserveBelowTarget' | 'withinTarget';
export type ScenarioLoan = { [K in keyof LoanResult]: K extends 'schedule' ? AmortizationRow[] : number | null };

export interface ScenarioResult {
  issues: CalculationIssue[];
  status: ScenarioStatus;
  complete: boolean;
  vehicleName: string;
  monthlyIncome: number | null;
  essentialExpenses: number | null;
  minimumDebtPayments: number | null;
  maintenanceMonthly: number | null;
  maintenanceIsEstimate: boolean;
  fuelMonthly: number | null;
  trueMonthlyCost: number | null;
  monthlySurplus: number | null;
  cashRemaining: number | null;
  emergencyCashRemaining: number | null;
  emergencyRunwayMonths: number | null;
  transportationIncomePercent: number | null;
  reserveGap: number | null;
  downPaymentApplied: number | null;
  downPaymentShortfall: number | null;
  loan: ScenarioLoan;
  debtWithoutCar: DebtProjection;
  debtWithCar: DebtProjection;
  debtDelayMonths: number | null;
  warnings: string[];
}

export interface TimingResult {
  label: string;
  monthsWaiting: number;
  downPayment: number | null;
  additionalSavings: number;
  waitingCost: number;
  result: ScenarioResult;
  netDifferenceFromNow: number | null;
}
