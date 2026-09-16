import { projectDebtPayoff } from '@/engine/debt';
import { Debt } from '@/types/domain';

const debts: Debt[] = [
  { id: 'low', name: 'Low APR', type: 'studentLoan', balance: 5000, apr: 4, minimumPayment: 100 },
  { id: 'high', name: 'High APR', type: 'creditCard', balance: 5000, apr: 22, minimumPayment: 100 },
];

describe('debt payoff projection', () => {
  it('sends extra cash to the highest APR balance first', () => {
    const result = projectDebtPayoff(debts, 700, true);
    expect(result.isPayable).toBe(true);
    expect(result.payoffOrder[0]).toBe('high');
  });

  it('finishes sooner with extra payments', () => {
    const minimums = projectDebtPayoff(debts, 0, true);
    const accelerated = projectDebtPayoff(debts, 500, true);
    expect(accelerated.months!).toBeLessThan(minimums.months!);
    expect(accelerated.totalInterest).toBeLessThan(minimums.totalInterest);
  });

  it('detects a payment that cannot cover interest', () => {
    const result = projectDebtPayoff([{ ...debts[1]!, minimumPayment: 10 }], 0, true);
    expect(result.isPayable).toBe(false);
    expect(result.months).toBeNull();
  });

  it('rolls a paid debt minimum into the avalanche payment budget', () => {
    const withFreedMinimum = projectDebtPayoff([
      { id: 'small', name: 'Small', type: 'other', balance: 100, apr: 0, minimumPayment: 100 },
      { id: 'large', name: 'Large', type: 'other', balance: 1000, apr: 0, minimumPayment: 100 },
    ], 0, true);
    expect(withFreedMinimum.months).toBe(6);
  });
});
