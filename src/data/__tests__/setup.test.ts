import AsyncStorage from '@react-native-async-storage/async-storage';
import { emptySetup, setupSchema, setupScenario, saveSetup, loadSetup, clearSetup, SETUP_KEY } from '@/data/setup';
jest.mock('@react-native-async-storage/async-storage', () => jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'));
it('starts personal finances blank and requires real inputs', () => {
  const v = emptySetup(); expect(v.paycheck).toBe(''); expect(v.emergency).toBe(''); expect(v.expenses).toBe(''); expect(setupSchema.safeParse(v).success).toBe(false);
});
it('accepts explicit zero savings without injecting sample finances', () => {
  const v = { ...emptySetup(), paycheck: '2500', emergency: '0', carSavings: '0', reserve: '0', expenses: '1800', make: 'Honda', model: 'Civic', price: '22000', down: '0', apr: '0', tax: '0' };
  expect(setupSchema.safeParse(v).success).toBe(true);
  const s = setupScenario(v); expect(s.profile.carSavings).toBe(0); expect(s.profile.discretionarySpending).toBe(0); expect(s.profile.detailedExpenses.housing).toBe(0);
});
it('restores partial drafts and clears after queued writes', async () => {
  const v = { ...emptySetup(), paycheck: '2500.' }; await saveSetup(v, 1);
  expect(await loadSetup()).toEqual({ values: v, step: 1 });
  void saveSetup(v, 2); await clearSetup(); expect(await loadSetup()).toBeNull();
});
it('recovers from corrupted or unsupported drafts', async () => {
  await AsyncStorage.setItem(SETUP_KEY, 'broken'); expect(await loadSetup()).toBeNull();
  await AsyncStorage.setItem(SETUP_KEY, JSON.stringify({ version: 8 })); expect(await loadSetup()).toBeNull();
});
