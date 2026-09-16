import { annualPercentToMonthlyRate, calculateLoan, remainingBalanceAtMonth } from '@/engine/financing';

const baseTerms = { taxRate: 0, fees: 0, tradeInCredit: 0, negativeEquity: 0, downPayment: 0, apr: 6, termMonths: 60 };

describe('financing engine', () => {
  it('converts a user-facing annual percentage to a monthly decimal rate', () => {
    expect(annualPercentToMonthlyRate(6)).toBeCloseTo(0.005, 8);
    expect(annualPercentToMonthlyRate(6.5)).toBeCloseTo(0.065 / 12, 8);
  });

  it('matches a known amortized payment', () => {
    const result = calculateLoan(30000, baseTerms);
    expect(result.monthlyPayment).toBeCloseTo(579.98, 2);
    expect(result.schedule).toHaveLength(60);
    expect(result.schedule[59]?.balance).toBeCloseTo(0, 2);
    expect(result.totalInterest).toBeCloseTo(4799.04, 1);
  });

  it('handles zero APR without dividing by zero', () => {
    const result = calculateLoan(24000, { ...baseTerms, apr: 0, termMonths: 48 });
    expect(result.monthlyPayment).toBe(500);
    expect(result.totalInterest).toBe(0);
  });

  it('includes tax, fees, trade credit, and negative equity', () => {
    const result = calculateLoan(25000, { ...baseTerms, taxRate: 8, fees: 500, negativeEquity: 1000, downPayment: 5000, tradeInCredit: 2000 });
    expect(result.taxes).toBe(2000);
    expect(result.amountFinanced).toBe(21500);
  });

  it('never returns negative principal and exposes remaining balance', () => {
    const result = calculateLoan(10000, { ...baseTerms, downPayment: 12000 });
    expect(result.amountFinanced).toBe(0);
    expect(remainingBalanceAtMonth(result, 12)).toBe(0);
  });
});
