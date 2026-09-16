import { Debt, DebtProjection } from '@/types/domain';

interface WorkingDebt extends Debt { remaining: number }

export function projectDebtPayoff(debts: Debt[], extraMonthly: number, avalanche = true): DebtProjection {
  const working: WorkingDebt[] = debts
    .filter((debt) => debt.balance > 0)
    .map((debt) => ({ ...debt, remaining: Math.max(0, debt.balance) }));
  if (working.length === 0) return { months: 0, totalInterest: 0, isPayable: true, payoffOrder: [] };

  let totalInterest = 0;
  const payoffOrder: string[] = [];
  const paid = new Set<string>();
  for (let month = 1; month <= 600; month += 1) {
    let interestThisMonth = 0;
    for (const debt of working) {
      if (debt.remaining <= 0) continue;
      const interest = debt.remaining * Math.max(0, debt.apr) / 1200;
      debt.remaining += interest;
      interestThisMonth += interest;
    }
    totalInterest += interestThisMonth;

    let unusedMinimums = 0;
    for (const debt of working) {
      const minimum = Math.max(0, debt.minimumPayment);
      if (debt.remaining <= 0) {
        unusedMinimums += minimum;
        continue;
      }
      const applied = Math.min(minimum, debt.remaining);
      debt.remaining -= applied;
      unusedMinimums += minimum - applied;
    }

    if (avalanche) {
      let extra = Math.max(0, extraMonthly) + unusedMinimums;
      const priority = [...working].sort((a, b) => b.apr - a.apr || a.id.localeCompare(b.id));
      for (const debt of priority) {
        const applied = Math.min(extra, debt.remaining);
        debt.remaining -= applied;
        extra -= applied;
        if (extra <= 0) break;
      }
    }

    for (const debt of working) {
      if (debt.remaining <= 0.005 && !paid.has(debt.id)) {
        paid.add(debt.id);
        payoffOrder.push(debt.id);
      }
    }

    if (working.every((debt) => debt.remaining <= 0.005)) {
      return { months: month, totalInterest, isPayable: true, payoffOrder };
    }
  }
  return { months: null, totalInterest, isPayable: false, payoffOrder };
}
