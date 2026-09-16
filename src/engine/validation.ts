import { z } from 'zod';
import { profileSchema, debtSchema } from '@/data/workspace';
import { AppScenario, CalculationIssue } from '@/types/domain';

const amount = z.number().finite().nonnegative();
export const scenarioSchema = z.object({
  version: z.number(), onboardingComplete: z.boolean(),
  profile: profileSchema, debts: z.array(debtSchema),
  vehicle: z.object({ make: z.string(), model: z.string(), trim: z.string(), year: amount.int().min(1980),
    condition: z.enum(['new', 'used']), price: amount, mileage: amount, mpg: amount,
    annualMiles: amount, fuelPrice: amount, insuranceMonthly: amount,
    maintenanceMonthly: amount.nullable(), registrationAnnual: amount, parkingMonthly: amount, tollsMonthly: amount, otherMonthly: amount }),
  loan: z.object({ taxRate: amount.max(100), fees: amount, tradeInCredit: amount, negativeEquity: amount,
    downPayment: amount, apr: amount.max(100), termMonths: amount.int().min(1).max(120) }),
  timing: z.object({ customPurchaseDate: z.string().refine(v => Number.isFinite(Date.parse(v))), waitingMonthlyCosts: amount }),
});

export function scenarioIssues(scenario: AppScenario): CalculationIssue[] {
  const parsed = scenarioSchema.safeParse(scenario);
  const issues: CalculationIssue[] = parsed.success ? [] : parsed.error.issues.map(issue => ({
    code: 'invalid', field: issue.path.join('.'), message: `${issue.path.join(' / ')}: ${issue.message}`,
  }));
  const required: [string, boolean, string][] = [
    ['profile.paycheckAmount', scenario.profile.paycheckAmount > 0, 'Enter your take-home pay.'],
    ['vehicle.make', !!scenario.vehicle.make.trim(), 'Add the vehicle make.'],
    ['vehicle.model', !!scenario.vehicle.model.trim(), 'Add the vehicle model.'],
    ['vehicle.price', scenario.vehicle.price > 0, 'Enter a vehicle price.'],
    ['vehicle.mpg', scenario.vehicle.mpg > 0, 'Enter MPG above zero to calculate fuel cost.'],
  ];
  for (const [field, valid, message] of required) if (!valid && !issues.some(i => i.field === field)) issues.push({ code: 'missing', field, message });
  return issues;
}
