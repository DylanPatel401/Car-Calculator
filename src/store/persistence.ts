import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

export const usePersistenceStatus = create<{ error: boolean }>(() => ({ error: false }));
let pending = Promise.resolve();
export function writeWorkspace(name: string, value: string): Promise<void> {
  pending = pending.then(async () => {
    try { await AsyncStorage.setItem(name, value); usePersistenceStatus.setState({ error: false }); }
    catch { usePersistenceStatus.setState({ error: true }); }
  });
  return pending;
}
export async function flushWorkspace(): Promise<boolean> {
  await pending;
  return !usePersistenceStatus.getState().error;
}
