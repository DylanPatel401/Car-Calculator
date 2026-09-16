import { createDefaultScenario } from '@/data/defaults';
import { calculateScenario } from '@/engine/scenario';
import { calculateTimingScenario, monthsUntil } from '@/engine/timing';

describe('scenario engine', () => {
  it('calculates true monthly cost and surplus', () => {
    const scenario = createDefaultScenario();
    scenario.vehicle.make = 'Toyota';
    scenario.vehicle.model = 'Camry';
    const result = calculateScenario(scenario);
    expect(result.complete).toBe(true);
    expect(result.trueMonthlyCost).toBeGreaterThan(result.loan.monthlyPayment!);
    expect(result.monthlySurplus).toBeCloseTo(result.monthlyIncome! - result.essentialExpenses! - result.trueMonthlyCost! - scenario.profile.discretionarySpending, 2);
  });

  it('protects emergency savings unless explicitly enabled', () => {
    const scenario = createDefaultScenario();
    scenario.loan.downPayment = 20000;
    const protectedResult = calculateScenario(scenario);
    expect(protectedResult.emergencyCashRemaining).toBe(scenario.profile.emergencySavings);
    expect(protectedResult.downPaymentApplied).toBe(scenario.profile.carSavings + scenario.profile.otherSavings);
    expect(protectedResult.cashRemaining).toBe(scenario.profile.emergencySavings);
    expect(protectedResult.downPaymentShortfall).toBe(15000);
    scenario.profile.useEmergencyForDownPayment = true;
    const reallocatedResult = calculateScenario(scenario);
    expect(reallocatedResult.downPaymentApplied).toBe(15000);
    expect(reallocatedResult.emergencyCashRemaining).toBe(0);
    expect(reallocatedResult.cashRemaining).toBe(0);
  });

  it('returns incomplete ownership cost for missing MPG', () => {
    const scenario = createDefaultScenario();
    scenario.vehicle.mpg = 0;
    expect(calculateScenario(scenario).trueMonthlyCost).toBeNull();
  });

  it('does not apply more cash than the remaining purchase balance', () => {
    const scenario = createDefaultScenario();
    scenario.profile.carSavings = 100000;
    scenario.loan.downPayment = 100000;
    const result = calculateScenario(scenario);
    expect(result.loan.amountFinanced).toBe(0);
    expect(result.downPaymentApplied).toBeCloseTo(32900, 2);
    expect(result.cashRemaining).toBeCloseTo(77100, 2);
  });
});

describe('timing engine', () => {
  it('handles calendar month boundaries', () => {
    expect(monthsUntil('2027-02-01T12:00:00.000Z', new Date('2027-01-31T12:00:00.000Z'))).toBe(1);
    expect(monthsUntil('2027-01-30T12:00:00.000Z', new Date('2027-01-31T12:00:00.000Z'))).toBe(0);
  });

  it('uses explicit savings and waiting costs', () => {
    const scenario = createDefaultScenario();
    scenario.profile.monthlyCarSavingsContribution = 500;
    scenario.timing.waitingMonthlyCosts = 100;
    const result = calculateTimingScenario(scenario, 6, 'Wait');
    expect(result.additionalSavings).toBe(3000);
    expect(result.waitingCost).toBe(600);
    expect(result.downPayment).toBe(scenario.loan.downPayment + 3000);
  });

  it('can show waiting as a net cost', () => {
    const scenario = createDefaultScenario();
    scenario.profile.monthlyCarSavingsContribution = 0;
    scenario.timing.waitingMonthlyCosts = 1000;
    expect(calculateTimingScenario(scenario, 6, 'Wait').netDifferenceFromNow).toBeLessThan(0);
  });
});
