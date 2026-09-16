import { scenarioForOption } from '@/data/workspace';
import { calculateScenario } from '@/engine/scenario';
import { AppScenario, ScenarioResult, Workspace } from '@/types/domain';

export const comparisonRows: { label: string; unit: 'money' | 'percent' | 'months'; value: (s: AppScenario, r: ScenarioResult) => number | null }[] = [
  { label: 'Purchase price', unit: 'money', value: (s) => s.vehicle.price },
  { label: 'Applied down payment', unit: 'money', value: (_, r) => r.downPaymentApplied },
  { label: 'Amount financed', unit: 'money', value: (_, r) => r.loan.amountFinanced },
  { label: 'APR', unit: 'percent', value: (s) => s.loan.apr },
  { label: 'Loan term', unit: 'months', value: (s) => s.loan.termMonths },
  { label: 'Monthly payment', unit: 'money', value: (_, r) => r.loan.monthlyPayment },
  { label: 'Monthly ownership', unit: 'money', value: (_, r) => r.trueMonthlyCost },
  { label: 'Monthly surplus', unit: 'money', value: (_, r) => r.monthlySurplus },
  { label: 'Cash remaining', unit: 'money', value: (_, r) => r.cashRemaining },
  { label: 'Emergency reserve', unit: 'money', value: (_, r) => r.emergencyCashRemaining },
  { label: 'Emergency runway', unit: 'months', value: (_, r) => r.emergencyRunwayMonths },
  { label: 'Total interest', unit: 'money', value: (_, r) => r.loan.totalInterest },
  { label: 'Debt payoff delay', unit: 'months', value: (_, r) => r.debtDelayMonths },
];

export function compareOptions(workspace: Workspace) {
  const entries = workspace.comparisonIds.flatMap((id) => {
    const option = workspace.options.find((item) => item.id === id);
    if (!option) return [];
    const scenario = scenarioForOption(workspace, id);
    const result = calculateScenario(scenario);
    return [{ option, result, values: comparisonRows.map((row) => {
      const value = row.value(scenario, result);
      return result.complete && value !== null && Number.isFinite(value) ? value : null;
    }) }];
  });
  const baseline = entries.find((entry) => entry.option.id === workspace.baselineId) ?? entries[0];
  return entries.map((entry) => ({ ...entry, differences: entry.values.map((value, index) => {
    const base = baseline?.values[index];
    return value !== null && base !== null && base !== undefined ? value - base : null;
  }) }));
}
