import AsyncStorage from '@react-native-async-storage/async-storage';
import { flushWorkspace } from '@/store/persistence';
import { STORAGE_KEY, useScenarioStore } from '@/store/scenarioStore';
import { createDefaultScenario } from '@/data/defaults';
jest.mock('@react-native-async-storage/async-storage', () => jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'));
const state = () => useScenarioStore.getState();
beforeEach(async () => { state().exitDemo(); await state().reset(); });
it('keeps all demo mutations out of persisted real data', async () => {
  state().updateProfile({ carSavings: 1234 });
  const original = state().workspace;
  state().startDemo(); state().updateProfile({ carSavings: 999999 }); state().duplicateOption(state().workspace.activeOptionId);
  await flushWorkspace();
  const envelope = JSON.parse((await AsyncStorage.getItem(STORAGE_KEY))!);
  expect(envelope.state.workspace).toEqual(original);
  state().exitDemo(); expect(state().workspace).toEqual(original); expect(state().demoOriginal).toBeNull();
});
it('saves an independent option without changing its source or shared finances', () => {
  const original = state().workspace.options[0]; const profile = state().workspace.profile;
  const experiment = createDefaultScenario(); experiment.vehicle.price = 19000;
  state().saveExperiment(experiment, 'Less expensive');
  expect(state().workspace.options[0]).toEqual(original); expect(state().workspace.options).toHaveLength(2);
  expect(state().scenario.vehicle.price).toBe(19000); expect(state().workspace.profile).toEqual(profile);
});
it('rejects invalid financial and debt edits at the store boundary', () => {
  state().updateProfile({ carSavings: -1 }); expect(state().workspace.profile.carSavings).toBe(0);
  state().addDebt(); const id = state().workspace.debts[0]!.id;
  state().updateDebt(id, { apr: Infinity }); expect(state().workspace.debts[0]!.apr).toBe(0);
});
