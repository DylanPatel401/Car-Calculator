import { calculateScenario } from '@/engine/scenario';
import { AppScenario, TimingResult } from '@/types/domain';

export function monthsUntil(dateIso: string, from = new Date()): number {
  const target = new Date(dateIso);
  if (Number.isNaN(target.getTime()) || target <= from) return 0;
  const wholeMonths = (target.getFullYear() - from.getFullYear()) * 12 + target.getMonth() - from.getMonth();
  return Math.max(0, wholeMonths + (target.getDate() > from.getDate() ? 1 : 0));
}

export function calculateTimingScenario(scenario: AppScenario, monthsWaiting: number, label: string): TimingResult {
  const months = Math.max(0, Math.round(monthsWaiting));
  const additionalSavings = Math.max(0, scenario.profile.monthlyCarSavingsContribution) * months;
  const waitingCost = Math.max(0, scenario.timing.waitingMonthlyCosts) * months;
  const adjusted: AppScenario = {
    ...scenario,
    profile: {
      ...scenario.profile,
      carSavings: Math.max(0, scenario.profile.carSavings + additionalSavings - waitingCost),
    },
    loan: {
      ...scenario.loan,
      downPayment: scenario.loan.downPayment + additionalSavings,
    },
  };
  const nowResult = calculateScenario(scenario);
  const result = calculateScenario(adjusted);
  const nowCost = nowResult.loan.totalInterest;
  const futureCost = result.loan.totalInterest === null ? null : result.loan.totalInterest + waitingCost;
  return {
    label,
    monthsWaiting: months,
    downPayment: result.downPaymentApplied,
    additionalSavings,
    waitingCost,
    result,
    netDifferenceFromNow: nowCost === null || futureCost === null ? null : nowCost - futureCost,
  };
}
