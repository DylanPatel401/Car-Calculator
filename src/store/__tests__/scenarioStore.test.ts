import AsyncStorage from '@react-native-async-storage/async-storage';
import { flushWorkspace } from '@/store/persistence';
import { STORAGE_KEY, useScenarioStore } from '@/store/scenarioStore';
import { createDefaultScenario } from '@/data/defaults';
import { scenarioForOption } from '@/data/workspace';

jest.mock('@react-native-async-storage/async-storage', () => jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'));
const state = () => useScenarioStore.getState();
beforeEach(async () => { await state().reset(); await flushWorkspace(); });

it('duplicates independently while sharing financial and driving inputs', () => {
  const id = state().workspace.activeOptionId;
  state().duplicateOption(id);
  state().updateLoan({ apr: 0 });
  state().updateVehicle({ annualMiles: 18000, fuelPrice: 4 });
  state().updateProfile({ paycheckAmount: 3100 });
  expect(state().workspace.options[0]!.loan.apr).toBe(6.5);
  expect(state().workspace.options[1]!.loan.apr).toBe(0);
  expect(scenarioForOption(state().workspace, id).vehicle.annualMiles).toBe(18000);
  expect(scenarioForOption(state().workspace, id).profile.paycheckAmount).toBe(3100);
});
it('enforces three selections and repairs baseline after deletion', () => {
  for (let i = 0; i < 4; i++) { state().addOption(); state().toggleComparison(state().workspace.activeOptionId); }
  expect(state().workspace.comparisonIds).toHaveLength(3);
  const baseline = state().workspace.baselineId!;
  state().deleteOption(baseline);
  expect(state().workspace.baselineId).not.toBe(baseline);
  expect(state().workspace.comparisonIds).toContain(state().workspace.baselineId);
});
it('deleting the last option preserves finances; reset clears them', async () => {
  state().updateProfile({ carSavings: 12345 });
  state().deleteOption(state().workspace.activeOptionId);
  expect(state().workspace.options).toHaveLength(1);
  expect(state().scenario.profile.carSavings).toBe(12345);
  await state().reset();
  expect(state().scenario.profile.carSavings).toBe(0);
  expect(state().scenario.onboardingComplete).toBe(false);
});
it('migrates the Zustand version-1 envelope and restores saved options', async () => {
  const scenario = createDefaultScenario();
  scenario.vehicle.make = 'Honda';
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, state: { scenario } }));
  await useScenarioStore.persist.rehydrate();
  expect(state().scenario.vehicle.make).toBe('Honda');
  state().duplicateOption(state().workspace.activeOptionId);
  state().renameOption(state().workspace.activeOptionId, 'Second choice');
  await flushWorkspace();
  await useScenarioStore.persist.rehydrate();
  expect(state().workspace.options).toHaveLength(2);
  expect(state().workspace.options[1]!.name).toBe('Second choice');
});
it('finishes hydration after corrupt storage or a read failure', async () => {
  await AsyncStorage.setItem(STORAGE_KEY, 'broken json');
  await useScenarioStore.persist.rehydrate();
  expect(state().hasHydrated).toBe(true);
  jest.mocked(AsyncStorage.getItem).mockRejectedValueOnce(new Error('Read failed'));
  await useScenarioStore.persist.rehydrate();
  expect(state().hasHydrated).toBe(true);
});
