import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { InvoiceSettings, defaultSettings } from '../types/settings';

interface SettingsStore {
  settings: InvoiceSettings;
  updateSettings: (settings: Partial<InvoiceSettings>) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: {
            ...state.settings,
            ...newSettings,
          },
        })),
      resetSettings: () => set({ settings: defaultSettings }),
    }),
    {
      name: 'invoice-settings',
    }
  )
);