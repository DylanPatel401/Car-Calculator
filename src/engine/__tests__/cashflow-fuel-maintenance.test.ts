import { essentialExpenses, monthlyIncome } from '@/engine/cashflow';
import { calculateMonthlyFuelCost } from '@/engine/fuel';
import { estimateMonthlyMaintenance, maintenanceCost } from '@/engine/maintenance';
import { createDefaultScenario } from '@/data/defaults';

describe('ownership inputs', () => {
  it('normalizes every paycheck frequency to a monthly amount', () => {
    const profile = createDefaultScenario().profile;
    expect(monthlyIncome({ ...profile, paycheckAmount: 1000, payFrequency: 'weekly' })).toBeCloseTo(4333.33, 2);
    expect(monthlyIncome({ ...profile, paycheckAmount: 2000, payFrequency: 'biweekly' })).toBeCloseTo(4333.33, 2);
    expect(monthlyIncome({ ...profile, paycheckAmount: 2500, payFrequency: 'twiceMonthly' })).toBe(5000);
    expect(monthlyIncome({ ...profile, paycheckAmount: 5000, payFrequency: 'monthly' })).toBe(5000);
  });

  it('distinguishes biweekly pay from twice-monthly pay', () => {
    const profile = createDefaultScenario().profile;
    const biweekly = monthlyIncome({ ...profile, paycheckAmount: 2000, payFrequency: 'biweekly' });
    const twiceMonthly = monthlyIncome({ ...profile, paycheckAmount: 2000, payFrequency: 'twiceMonthly' });
    expect(biweekly).toBeCloseTo(4333.33, 2);
    expect(twiceMonthly).toBe(4000);
    expect(biweekly - twiceMonthly).toBeCloseTo(333.33, 2);
  });

  it('switches between quick and detailed expenses', () => {
    const profile = createDefaultScenario().profile;
    expect(essentialExpenses(profile)).toBe(2500);
    const detailed = { ...profile, expenseMode: 'detailed' as const };
    expect(essentialExpenses(detailed)).toBe(Object.values(profile.detailedExpenses).reduce((a, b) => a + b, 0));
  });

  it('calculates fuel and rejects impossible MPG', () => {
    expect(calculateMonthlyFuelCost(12000, 25, 3.5)).toBe(140);
    expect(calculateMonthlyFuelCost(12000, 0, 3.5)).toBeNull();
  });

  it('uses an editable maintenance value over the estimate', () => {
    const vehicle = createDefaultScenario().vehicle;
    expect(estimateMonthlyMaintenance(vehicle)).toBeGreaterThan(0);
    expect(maintenanceCost({ ...vehicle, maintenanceMonthly: 123 })).toEqual({ amount: 123, isEstimate: false });
  });
});
