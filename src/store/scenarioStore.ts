import { writeWorkspace } from '@/store/persistence';
import { clearSetup } from '@/data/setup';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createDefaultScenario } from '@/data/defaults';
import { profileSchema, debtSchema, createOption, migrateWorkspace, repairSelection, scenarioForOption, validOption, workspaceFromScenario } from '@/data/workspace';
import { AppScenario, Debt, FinancialProfile, LoanTerms, SavedOption, TimingSettings, Vehicle, Workspace } from '@/types/domain';

export const STORAGE_KEY = 'car-calculator-scenario';
interface ScenarioState {
  demoOriginal: Workspace | null;
  startDemo: () => void;
  exitDemo: () => void;
  saveExperiment: (scenario: AppScenario, name: string) => void;
  workspace: Workspace;
  scenario: AppScenario;
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  completeOnboarding: (scenario: AppScenario) => void;
  updateProfile: (changes: Partial<FinancialProfile>) => void;
  updateVehicle: (changes: Partial<Vehicle>) => void;
  updateLoan: (changes: Partial<LoanTerms>) => void;
  updateTiming: (changes: Partial<TimingSettings>) => void;
  addDebt: () => void;
  updateDebt: (id: string, changes: Partial<Debt>) => void;
  removeDebt: (id: string) => void;
  addOption: () => void;
  duplicateOption: (id: string) => void;
  renameOption: (id: string, name: string) => void;
  deleteOption: (id: string) => void;
  selectOption: (id: string) => void;
  toggleComparison: (id: string) => void;
  setBaseline: (id: string) => void;
  reset: () => Promise<void>;
}
const derived = (workspace: Workspace) => ({ workspace, scenario: scenarioForOption(workspace) });
const initial = workspaceFromScenario();

export const useScenarioStore = create<ScenarioState>()(persist((set) => {
  const change = (edit: (workspace: Workspace) => Workspace) => set((state) => derived(edit(state.workspace)));
  const editActive = (edit: (option: SavedOption) => SavedOption) => change((workspace) => ({ ...workspace,
    options: workspace.options.map((option) => {
      if (option.id !== workspace.activeOptionId) return option;
      const next = { ...edit(option), updatedAt: new Date().toISOString() };
      return validOption(next) ? next : option;
    }) }));
  return {
    ...derived(initial), hasHydrated: false, demoOriginal: null,
    startDemo: () => set(state => {
      if (state.demoOriginal) return state;
      const sample = createDefaultScenario();
      sample.onboardingComplete = true;
      sample.vehicle.make = 'Toyota'; sample.vehicle.model = 'Camry';
      return { ...derived(workspaceFromScenario(sample)), demoOriginal: state.workspace };
    }),
    exitDemo: () => set(state => state.demoOriginal ? { ...derived(state.demoOriginal), demoOriginal: null } : state),
    saveExperiment: (scenario, name) => change(w => {
      const option = createOption(scenario, name.trim() || 'What-if option');
      if (!validOption(option)) return w;
      return { ...w, options: [...w.options, option], activeOptionId: option.id };
    }),
    setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    completeOnboarding: (scenario) => set(derived(workspaceFromScenario({ ...scenario, onboardingComplete: true }))),
    updateProfile: (changes) => change((w) => { const profile = { ...w.profile, ...changes }; return profileSchema.safeParse(profile).success ? { ...w, profile } : w; }),
    updateVehicle: ({ annualMiles, fuelPrice, ...changes }) => {
      editActive((option) => ({ ...option, vehicle: { ...option.vehicle, ...changes } }));
      if (annualMiles !== undefined || fuelPrice !== undefined) change((w) => ({ ...w, driving: {
        annualMiles: annualMiles !== undefined && Number.isFinite(annualMiles) && annualMiles >= 0 ? annualMiles : w.driving.annualMiles,
        fuelPrice: fuelPrice !== undefined && Number.isFinite(fuelPrice) && fuelPrice >= 0 ? fuelPrice : w.driving.fuelPrice,
      } }));
    },
    updateLoan: (changes) => editActive((option) => ({ ...option, loan: { ...option.loan, ...changes } })),
    updateTiming: (changes) => editActive((option) => ({ ...option, timing: { ...option.timing, ...changes } })),
    addDebt: () => change((w) => ({ ...w, debts: [...w.debts, { id: `debt-${Date.now()}-${Math.random()}`, name: 'New debt', type: 'creditCard', balance: 0, apr: 0, minimumPayment: 0 }] })),
    updateDebt: (id, changes) => change((w) => ({ ...w, debts: w.debts.map((debt) => debt.id === id && debtSchema.safeParse({ ...debt, ...changes }).success ? { ...debt, ...changes } : debt) })),
    removeDebt: (id) => change((w) => ({ ...w, debts: w.debts.filter((debt) => debt.id !== id) })),
    addOption: () => change((w) => {
      const option = createOption(undefined, `Option ${w.options.length + 1}`);
      return { ...w, options: [...w.options, option], activeOptionId: option.id };
    }),
    duplicateOption: (id) => change((w) => {
      const original = w.options.find((option) => option.id === id);
      if (!original) return w;
      const copy = createOption(scenarioForOption(w, id), `${original.name.slice(0, 110)} \u2014 Copy`);
      return { ...w, options: [...w.options, copy], activeOptionId: copy.id };
    }),
    renameOption: (id, name) => change((w) => ({ ...w, options: w.options.map((option) => option.id === id && name.trim()
      ? { ...option, name: name.trim().slice(0, 120), updatedAt: new Date().toISOString() } : option) })),
    deleteOption: (id) => change((w) => {
      const index = w.options.findIndex((option) => option.id === id);
      if (index < 0) return w;
      const options = w.options.filter((option) => option.id !== id);
      if (!options.length) options.push(createOption(undefined, 'New option'));
      return repairSelection({ ...w, options, activeOptionId: w.activeOptionId === id
        ? options[Math.min(index, options.length - 1)]!.id : w.activeOptionId });
    }),
    selectOption: (id) => change((w) => w.options.some((option) => option.id === id) ? { ...w, activeOptionId: id } : w),
    toggleComparison: (id) => change((w) => {
      if (!w.options.some((option) => option.id === id)) return w;
      const comparisonIds = w.comparisonIds.includes(id) ? w.comparisonIds.filter((item) => item !== id)
        : w.comparisonIds.length < 3 ? [...w.comparisonIds, id] : w.comparisonIds;
      return repairSelection({ ...w, comparisonIds });
    }),
    setBaseline: (id) => change((w) => w.comparisonIds.includes(id) ? { ...w, baselineId: id } : w),
    reset: async () => { await clearSetup(); set({ ...derived(workspaceFromScenario()), hasHydrated: true }); },
  };
}, {
  name: STORAGE_KEY, version: 2,
  storage: createJSONStorage(() => ({
    getItem: async (name) => {
      try {
        const value = await AsyncStorage.getItem(name);
        if (value) JSON.parse(value);
        return value;
      } catch { return null; }
    },
    setItem: writeWorkspace,
    removeItem: (name) => AsyncStorage.removeItem(name),
  })),
  partialize: (state) => ({ workspace: state.demoOriginal ?? state.workspace }),
  migrate: (persisted) => {
    const stored = persisted as { workspace?: unknown; scenario?: unknown } | null;
    return { workspace: migrateWorkspace(stored?.workspace ?? stored?.scenario) };
  },
  merge: (persisted, current) => {
    const stored = persisted as { workspace?: unknown } | null;
    return { ...current, ...derived(migrateWorkspace(stored?.workspace)) };
  },
  onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
}));
