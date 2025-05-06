import { create } from 'zustand';
import { Invoice } from '../types/invoice';

interface InvoiceStore {
  currentInvoice: Invoice | null;
  setCurrentInvoice: (invoice: Invoice) => void;
  updateInvoice: (updates: Partial<Invoice>) => void;
}

export const useInvoiceStore = create<InvoiceStore>((set) => ({
  currentInvoice: null,
  setCurrentInvoice: (invoice) => set({ currentInvoice: invoice }),
  updateInvoice: (updates) =>
    set((state) => ({
      currentInvoice: state.currentInvoice
        ? { ...state.currentInvoice, ...updates }
        : null,
    })),
}));