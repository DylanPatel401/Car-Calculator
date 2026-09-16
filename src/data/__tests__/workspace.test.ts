import { createDefaultScenario } from '@/data/defaults';
import { migrateWorkspace, scenarioForOption, workspaceFromScenario } from '@/data/workspace';
import { compareOptions } from '@/engine/comparison';

describe('workspace migration and comparison', () => {
  it('preserves the complete legacy scenario', () => {
    const legacy = createDefaultScenario();
    legacy.onboardingComplete = true;
    legacy.vehicle.make = 'Toyota'; legacy.vehicle.model = 'Camry';
    legacy.vehicle.fuelPrice = 4.1;
    legacy.debts = [{ id: 'card', name: 'Card', type: 'creditCard', balance: 900, apr: 0, minimumPayment: 50 }];
    expect(scenarioForOption(migrateWorkspace(legacy))).toEqual(legacy);
  });
  it('repairs stale selections and filters malformed options', () => {
    const workspace = workspaceFromScenario();
    const restored = migrateWorkspace({ ...workspace, activeOptionId: 'missing', comparisonIds: ['missing', workspace.activeOptionId], baselineId: 'missing', options: [...workspace.options, { id: 'bad' }] });
    expect(restored.options).toHaveLength(1);
    expect(restored.activeOptionId).toBe(workspace.activeOptionId);
    expect(restored.baselineId).toBe(workspace.activeOptionId);
  });
  it('returns zero differences for equivalent options and none for incomplete inputs', () => {
    const scenario = createDefaultScenario();
    scenario.vehicle.make = 'Toyota'; scenario.vehicle.model = 'Camry'; scenario.loan.apr = 0;
    scenario.profile.debtAvalancheEnabled = false;
    const workspace = workspaceFromScenario(scenario);
    workspace.options.push({ ...workspace.options[0]!, id: 'copy' });
    workspace.comparisonIds.push('copy');
    expect(compareOptions(workspace)[1]!.differences.every((difference) => difference === 0)).toBe(true);
    workspace.options[1] = { ...workspace.options[1]!, vehicle: { ...workspace.options[1]!.vehicle, mpg: 0 } };
    expect(compareOptions(workspace)[1]!.differences.every((difference) => difference === null)).toBe(true);
  });
});
