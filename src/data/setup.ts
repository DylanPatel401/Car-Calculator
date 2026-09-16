import AsyncStorage from '@react-native-async-storage/async-storage';
import { z } from 'zod';
import { createDefaultScenario } from './defaults';
import { AppScenario } from '@/types/domain';

export const SETUP_KEY = 'car-calculator-setup-v1';
const numberText = (label: string, min = 0, max = Number.MAX_SAFE_INTEGER, optional = false) => z.string().refine(v => (optional && v.trim() === '') || (/^(?:\d+\.?\d*|\.\d+)$/.test(v) && Number.isFinite(Number(v)) && Number(v) >= min && Number(v) <= max), `Enter ${label}${min > 0 ? ' above zero' : ' (zero is OK)'}.`);
export const setupSchema = z.object({
  paycheck: numberText('take-home pay', 0.01), frequency: z.enum(['weekly', 'biweekly', 'twiceMonthly', 'monthly']),
  sideIncome: numberText('side income', 0, undefined, true),
  emergency: numberText('emergency savings'), carSavings: numberText('car savings'), otherSavings: numberText('other savings', 0, undefined, true),
  reserve: numberText('a reserve target'), expenses: numberText('required expenses'), discretionary: numberText('discretionary spending', 0, undefined, true),
  contribution: numberText('monthly car savings', 0, undefined, true),
  make: z.string().trim().min(1, 'Enter a make.'), model: z.string().trim().min(1, 'Enter a model.'),
  price: numberText('a price', 0.01), year: numberText('a year', 1980, new Date().getFullYear() + 2).refine(v => Number.isInteger(Number(v)), 'Enter a whole year.'),
  condition: z.enum(['new', 'used']), down: numberText('a down payment'), apr: numberText('an APR', 0, 100), tax: numberText('a sales tax rate', 0, 100),
  term: z.enum(['36', '48', '60', '72', '84']),
  debts: z.array(z.object({ name: z.string().trim().min(1, 'Name this debt.'), balance: numberText('a balance'), apr: numberText('an APR', 0, 100), minimum: numberText('a minimum payment') })),
});
export type SetupValues = z.infer<typeof setupSchema>;
export const emptySetup = (): SetupValues => ({ paycheck: '', frequency: 'twiceMonthly', sideIncome: '', emergency: '', carSavings: '', otherSavings: '', reserve: '', expenses: '', discretionary: '', contribution: '', make: '', model: '', price: '', year: String(new Date().getFullYear() - 2), condition: 'used', down: '', apr: '', tax: '', term: '60', debts: [] });
export const setupSteps: (keyof SetupValues)[][] = [ ['paycheck', 'frequency', 'sideIncome'], ['emergency', 'carSavings', 'otherSavings', 'reserve', 'expenses', 'discretionary', 'contribution', 'debts'], ['make', 'model', 'price', 'year', 'condition', 'down', 'apr', 'tax', 'term'] ];
export function setupScenario(v: SetupValues): AppScenario {
  const s = createDefaultScenario();
  s.profile = { ...s.profile, paycheckAmount: Number(v.paycheck), payFrequency: v.frequency, sideIncomeMonthly: Number(v.sideIncome), includeSideIncome: Number(v.sideIncome) > 0,
    emergencySavings: Number(v.emergency), carSavings: Number(v.carSavings), otherSavings: Number(v.otherSavings), reserveTarget: Number(v.reserve),
    essentialExpensesQuick: Number(v.expenses), discretionarySpending: Number(v.discretionary), monthlyCarSavingsContribution: Number(v.contribution),
    detailedExpenses: { housing: 0, groceries: 0, utilities: 0, phone: 0, transportation: 0, insurance: 0, subscriptions: 0, otherRequired: 0 } };
  s.vehicle = { ...s.vehicle, make: v.make.trim(), model: v.model.trim(), price: Number(v.price), year: Number(v.year), condition: v.condition };
  s.loan = { ...s.loan, downPayment: Number(v.down), apr: Number(v.apr), taxRate: Number(v.tax), termMonths: Number(v.term) };
  s.debts = v.debts.map((d, i) => ({ id: `debt-${Date.now()}-${i}`, name: d.name.trim(), type: 'other', balance: Number(d.balance), apr: Number(d.apr), minimumPayment: Number(d.minimum) }));
  return s;
}
// Writes are serialized so finishing/resetting cannot be overtaken by a stale autosave.
let writes = Promise.resolve();
export function saveSetup(values: SetupValues, step: number): Promise<void> {
  writes = writes.catch(() => undefined).then(() => AsyncStorage.setItem(SETUP_KEY, JSON.stringify({ version: 1, step, values })));
  return writes;
}
export function clearSetup(): Promise<void> {
  writes = writes.catch(() => undefined).then(() => AsyncStorage.removeItem(SETUP_KEY));
  return writes;
}
export async function loadSetup(): Promise<{ values: SetupValues; step: number } | null> {
  try {
    const raw = JSON.parse(await AsyncStorage.getItem(SETUP_KEY) ?? 'null');
    if (raw?.version !== 1 || !raw.values || !Number.isInteger(raw.step)) return null;
    const defaults = emptySetup();
    for (const key of Object.keys(defaults) as (keyof SetupValues)[]) {
      if (key === 'debts') continue;
      if (typeof raw.values[key] !== 'string') return null;
    }
    if (!['weekly', 'biweekly', 'twiceMonthly', 'monthly'].includes(raw.values.frequency) || !['new', 'used'].includes(raw.values.condition) || !['36', '48', '60', '72', '84'].includes(raw.values.term)) return null;
    if (!Array.isArray(raw.values.debts) || raw.values.debts.some((d: Record<string, unknown>) => !d || ['name', 'balance', 'apr', 'minimum'].some(k => typeof d[k] !== 'string'))) return null;
    return { values: raw.values, step: Math.min(3, Math.max(0, raw.step)) };
  } catch { return null; }
}
