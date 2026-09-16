import { z } from 'zod';
import { createDefaultScenario, createEmptyScenario, migrateScenario } from '@/data/defaults';
import { AppScenario, SavedOption, Workspace } from '@/types/domain';

const amount = z.number().finite().nonnegative();
export const profileSchema = z.object({
  paycheckAmount: amount, payFrequency: z.enum(['weekly', 'biweekly', 'twiceMonthly', 'monthly']),
  sideIncomeMonthly: amount, includeSideIncome: z.boolean(), emergencySavings: amount,
  carSavings: amount, otherSavings: amount, reserveTarget: amount,
  expenseMode: z.enum(['quick', 'detailed']), essentialExpensesQuick: amount,
  detailedExpenses: z.object({ housing: amount, groceries: amount, utilities: amount, phone: amount,
    transportation: amount, insurance: amount, subscriptions: amount, otherRequired: amount }),
  discretionarySpending: amount, monthlyCarSavingsContribution: amount,
  useEmergencyForDownPayment: z.boolean(), debtAvalancheEnabled: z.boolean(),
});
export const debtSchema = z.object({ id: z.string(), name: z.string(),
  type: z.enum(['studentLoan', 'creditCard', 'personalLoan', 'autoLoan', 'other']),
  balance: amount, apr: amount.max(100), minimumPayment: amount });
const optionSchema = z.object({
  id: z.string().min(1), name: z.string().trim().min(1).max(120),
  vehicle: z.object({ make: z.string(), model: z.string(), trim: z.string(), year: amount.int(),
    condition: z.enum(['new', 'used']), price: amount, mileage: amount, mpg: amount,
    insuranceMonthly: amount, maintenanceMonthly: amount.nullable(), registrationAnnual: amount,
    parkingMonthly: amount, tollsMonthly: amount, otherMonthly: amount }),
  loan: z.object({ taxRate: amount.max(100), fees: amount, tradeInCredit: amount, negativeEquity: amount,
    downPayment: amount, apr: amount.max(100), termMonths: amount.int().min(1).max(120) }),
  timing: z.object({ customPurchaseDate: z.string().refine((v) => Number.isFinite(Date.parse(v))), waitingMonthlyCosts: amount }),
  createdAt: z.string(), updatedAt: z.string(),
});

export function createOption(scenario = createDefaultScenario(), name?: string): SavedOption {
  const { annualMiles: _annualMiles, fuelPrice: _fuelPrice, ...vehicle } = scenario.vehicle;
  const now = new Date().toISOString();
  return { id: `option-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    name: name ?? ([vehicle.make, vehicle.model].filter(Boolean).join(' ') || 'My first option'),
    vehicle, loan: { ...scenario.loan }, timing: { ...scenario.timing }, createdAt: now, updatedAt: now };
}

export function workspaceFromScenario(scenario = createEmptyScenario()): Workspace {
  const option = createOption(scenario);
  return { version: 2, onboardingComplete: scenario.onboardingComplete, profile: { ...scenario.profile },
    debts: scenario.debts.map((debt) => ({ ...debt })),
    driving: { annualMiles: scenario.vehicle.annualMiles, fuelPrice: scenario.vehicle.fuelPrice },
    options: [option], activeOptionId: option.id, comparisonIds: [option.id], baselineId: option.id };
}

export function scenarioForOption(workspace: Workspace, id = workspace.activeOptionId): AppScenario {
  const option = workspace.options.find((item) => item.id === id) ?? workspace.options[0]!;
  return { version: 1, onboardingComplete: workspace.onboardingComplete, profile: workspace.profile,
    debts: workspace.debts, vehicle: { ...option.vehicle, ...workspace.driving }, loan: option.loan, timing: option.timing };
}

export function repairSelection(workspace: Workspace): Workspace {
  const ids = new Set(workspace.options.map((option) => option.id));
  const comparisonIds = [...new Set(workspace.comparisonIds)].filter((id) => ids.has(id)).slice(0, 3);
  return { ...workspace, activeOptionId: ids.has(workspace.activeOptionId) ? workspace.activeOptionId : workspace.options[0]!.id,
    comparisonIds, baselineId: workspace.baselineId && comparisonIds.includes(workspace.baselineId)
      ? workspace.baselineId : comparisonIds[0] ?? null };
}

export function migrateWorkspace(raw: unknown): Workspace {
  const fallback = workspaceFromScenario();
  if (!raw || typeof raw !== 'object') return fallback;
  const record = raw as Record<string, unknown>;
  if (record.version === 1) {
    const legacy = migrateScenario(record);
    const migrated = workspaceFromScenario(legacy);
    return migrateWorkspace(migrated);
  }
  if (record.version !== 2) return fallback;
  const parsedOptions = Array.isArray(record.options) ? record.options.flatMap((item) => {
    const parsed = optionSchema.safeParse(item);
    return parsed.success ? [parsed.data] : [];
  }) : [];
  const options = parsedOptions.filter((option, index) => parsedOptions.findIndex((item) => item.id === option.id) === index);
  const profile = profileSchema.safeParse(record.profile);
  const driving = z.object({ annualMiles: amount, fuelPrice: amount }).safeParse(record.driving);
  const debts = Array.isArray(record.debts) ? record.debts.flatMap((item) => {
    const parsed = debtSchema.safeParse(item);
    return parsed.success ? [parsed.data] : [];
  }) : [];
  return repairSelection({ ...fallback, onboardingComplete: record.onboardingComplete === true,
    profile: profile.success ? profile.data : fallback.profile, debts,
    driving: driving.success ? driving.data : fallback.driving,
    options: options.length ? options : fallback.options,
    activeOptionId: typeof record.activeOptionId === 'string' ? record.activeOptionId : '',
    comparisonIds: Array.isArray(record.comparisonIds) ? record.comparisonIds.filter((id): id is string => typeof id === 'string') : [],
    baselineId: typeof record.baselineId === 'string' ? record.baselineId : null });
}

export function validOption(option: SavedOption): boolean { return optionSchema.safeParse(option).success; }
