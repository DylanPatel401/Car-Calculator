import AsyncStorage from '@react-native-async-storage/async-storage';
import { writeWorkspace, flushWorkspace, usePersistenceStatus } from '@/store/persistence';
jest.mock('@react-native-async-storage/async-storage', () => jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'));
it('surfaces failed writes and recovers on retry without rejecting unhandled promises', async () => {
  jest.mocked(AsyncStorage.setItem).mockRejectedValueOnce(new Error('disk full'));
  await writeWorkspace('test-workspace', 'first'); expect(await flushWorkspace()).toBe(false); expect(usePersistenceStatus.getState().error).toBe(true);
  await writeWorkspace('test-workspace', 'second'); expect(await flushWorkspace()).toBe(true); expect(await AsyncStorage.getItem('test-workspace')).toBe('second');
});
