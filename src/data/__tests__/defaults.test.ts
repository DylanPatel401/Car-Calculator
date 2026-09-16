import { createDefaultScenario, migrateScenario } from '@/data/defaults';

describe('scenario persistence migration', () => {
  it('recovers from corrupt storage', () => {
    const recovered = migrateScenario('not-an-object');
    expect(recovered.onboardingComplete).toBe(false);
    expect(recovered.profile).toEqual(createDefaultScenario().profile);
    expect(recovered.vehicle).toEqual(createDefaultScenario().vehicle);
  });

  it('merges missing nested fields from defaults', () => {
    const scenario = createDefaultScenario();
    const migrated = migrateScenario({ ...scenario, profile: { ...scenario.profile, detailedExpenses: { housing: 2200 } } });
    expect(migrated.profile.detailedExpenses.housing).toBe(2200);
    expect(migrated.profile.detailedExpenses.groceries).toBeGreaterThan(0);
  });

  it('resets unsupported schema versions', () => {
    expect(migrateScenario({ version: 999, onboardingComplete: true }).onboardingComplete).toBe(false);
  });
});
