import { createDefaultScenario } from '@/data/defaults';
import { calculateScenario } from '@/engine/scenario';
import { calculateLoan } from '@/engine/financing';

const complete = () => { const s = createDefaultScenario(); s.vehicle.make = 'Honda'; s.vehicle.model = 'Civic'; return s; };
it('uses explicit incomplete state before interpreting affordability', () => {
  const s = complete(); s.profile.paycheckAmount = 0;
  const r = calculateScenario(s);
  expect(r.status).toBe('incomplete'); expect(r.monthlySurplus).toBeNull();
  expect(r.issues).toContainEqual(expect.objectContaining({ field: 'profile.paycheckAmount', code: 'missing' }));
});
it('reports simultaneous cashflow and reserve concerns', () => {
  const s = complete(); s.profile.paycheckAmount = 100; s.profile.reserveTarget = 20000;
  const r = calculateScenario(s);
  expect(r.status).toBe('shortfall'); expect(r.issues.map(i => i.code)).toEqual(expect.arrayContaining(['cashflow', 'reserve']));
});
it('distinguishes reserve-only concerns and within-target results', () => {
  const s = complete(); expect(calculateScenario(s).status).toBe('withinTarget');
  s.profile.reserveTarget = 20000; expect(calculateScenario(s).status).toBe('reserveBelowTarget');
});
it.each([-1, NaN, Infinity])('rejects invalid APR %s instead of quoting zero APR', apr => {
  const s = complete(); s.loan.apr = apr;
  expect(() => calculateLoan(s.vehicle.price, s.loan)).toThrow(RangeError);
  const r = calculateScenario(s); expect(r.loan.monthlyPayment).toBeNull(); expect(r.trueMonthlyCost).toBeNull();
});
it('rejects non-positive and fractional terms', () => {
  const s = complete(); for (const termMonths of [0, -12, 12.5]) expect(() => calculateLoan(s.vehicle.price, { ...s.loan, termMonths })).toThrow(RangeError);
});

it('suppresses dependent outputs when financial inputs are non-finite', () => {
  const s = complete(); s.profile.carSavings = NaN; const r = calculateScenario(s);
  expect(r.cashRemaining).toBeNull(); expect(r.monthlySurplus).toBeNull(); expect(r.status).toBe('incomplete');
});
