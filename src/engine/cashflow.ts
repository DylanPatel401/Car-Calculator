import { FinancialProfile, PayFrequency } from '@/types/domain';

const frequencyAnnualizer: Record<PayFrequency, number> = {
  weekly: 52,
  biweekly: 26,
  twiceMonthly: 24,
  monthly: 12,
};

export const payFrequencyHint: Record<PayFrequency, string> = {
  weekly: '52 paychecks per year, averaged over 12 months.',
  biweekly: 'Every 2 weeks: 26 paychecks per year, averaged over 12 months.',
  twiceMonthly: 'Twice monthly: 24 paychecks per year.',
  monthly: '12 paychecks per year.',
};

export function monthlyIncome(profile: FinancialProfile): number {
  const base = Math.max(0, profile.paycheckAmount) * frequencyAnnualizer[profile.payFrequency] / 12;
  return base + (profile.includeSideIncome ? Math.max(0, profile.sideIncomeMonthly) : 0);
}

export function essentialExpenses(profile: FinancialProfile): number {
  if (profile.expenseMode === 'quick') return Math.max(0, profile.essentialExpensesQuick);
  return Object.values(profile.detailedExpenses).reduce((sum, value) => sum + Math.max(0, value), 0);
}
