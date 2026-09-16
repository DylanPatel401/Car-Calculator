import { AmortizationRow, LoanResult, LoanTerms } from '@/types/domain';

const finite = (value: number) => (Number.isFinite(value) ? value : 0);

export function annualPercentToMonthlyRate(annualPercent: number): number {
  return Math.max(0, finite(annualPercent)) / 100 / 12;
}

export function calculateLoan(vehiclePrice: number, terms: LoanTerms): LoanResult {
  const price = Math.max(0, finite(vehiclePrice));
  const taxes = price * Math.max(0, finite(terms.taxRate)) / 100;
  const amountFinanced = Math.max(
    0,
    price + taxes + Math.max(0, finite(terms.fees)) + Math.max(0, finite(terms.negativeEquity))
      - Math.max(0, finite(terms.downPayment)) - Math.max(0, finite(terms.tradeInCredit)),
  );
  const termMonths = Math.max(1, Math.round(finite(terms.termMonths)));
  const monthlyRate = annualPercentToMonthlyRate(terms.apr);
  const monthlyPayment = amountFinanced === 0
    ? 0
    : monthlyRate === 0
      ? amountFinanced / termMonths
      : amountFinanced * monthlyRate / (1 - (1 + monthlyRate) ** -termMonths);

  const schedule: AmortizationRow[] = [];
  let balance = amountFinanced;
  let totalInterest = 0;
  for (let month = 1; month <= termMonths && balance > 0.005; month += 1) {
    const interest = monthlyRate === 0 ? 0 : balance * monthlyRate;
    const payment = Math.min(monthlyPayment, balance + interest);
    const principal = Math.max(0, payment - interest);
    balance = Math.max(0, balance - principal);
    totalInterest += interest;
    schedule.push({ month, payment, principal, interest, balance });
  }

  return {
    taxes,
    amountFinanced,
    monthlyPayment,
    totalInterest,
    totalFinancedCost: amountFinanced + totalInterest,
    schedule,
  };
}

export function remainingBalanceAtMonth(result: LoanResult, month: number): number {
  if (month <= 0) return result.amountFinanced;
  return result.schedule[Math.min(month, result.schedule.length) - 1]?.balance ?? 0;
}
