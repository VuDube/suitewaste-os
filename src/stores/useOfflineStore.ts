import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';
import { toast } from 'sonner';
import type { InventoryLedgerEntry, Transaction } from '@shared/types';
import { api } from '@/lib/api-client';
interface OfflineState {
  pendingLedgerEntries: InventoryLedgerEntry[];
  pendingTransactions: Transaction[];
  isOnline: boolean;
  isSyncing: boolean;
  addLedgerEntry: (entry: Omit<InventoryLedgerEntry, 'id' | 'is_synced' | 'created_at' | 'capture_timestamp'> & { id?: string }) => string;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'is_synced' | 'created_at' | 'transaction_timestamp'>) => void;
  syncAllPending: () => Promise<void>;
  setOnlineStatus: (isOnline: boolean) => void;
}
const storage = {
  getItem: async (name: string): Promise<string | null> => (await get(name)) || null,
  setItem: async (name: string, value: string): Promise<void> => { await set(name, value); },
  removeItem: async (name: string): Promise<void> => { await del(name); },
};
export const useOfflineStore = create<OfflineState>()(
  persist(
    (set, get) => ({
      pendingLedgerEntries: [],
      pendingTransactions: [],
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      isSyncing: false,
      addLedgerEntry: (entry) => {
        const id = entry.id || crypto.randomUUID();
        const newEntry: InventoryLedgerEntry = {
          ...entry,
          id,
          is_synced: false,
          created_at: Date.now(),
          capture_timestamp: Date.now(),
        };
        set((state) => ({ pendingLedgerEntries: [...state.pendingLedgerEntries, newEntry] }));
        toast.success('Weight captured locally');
        return id;
      },
      addTransaction: (transaction) => {
        const newTransaction: Transaction = {
          ...transaction,
          id: crypto.randomUUID(),
          is_synced: false,
          created_at: Date.now(),
          transaction_timestamp: Date.now(),
        };
        set((state) => ({ pendingTransactions: [...state.pendingTransactions, newTransaction] }));
        toast.success('Transaction queued');
      },
      syncAllPending: async () => {
        const { isOnline, isSyncing, pendingLedgerEntries, pendingTransactions } = get();
        if (!isOnline || isSyncing || (pendingLedgerEntries.length === 0 && pendingTransactions.length === 0)) {
          return;
        }
        set({ isSyncing: true });
        try {
          let ledgerSuccess = false;
          let transactionSuccess = false;
          // 1. Sync Ledger Entries First
          if (pendingLedgerEntries.length > 0) {
            const res = await api<{ syncedIds: string[] }>('/api/sync/ledger', {
              method: 'POST', 
              body: JSON.stringify({ pendingEntries: pendingLedgerEntries }),
            });
            if (res.syncedIds.length > 0) {
              set(state => ({
                pendingLedgerEntries: state.pendingLedgerEntries.filter(e => !res.syncedIds.includes(e.id)),
              }));
              ledgerSuccess = true;
            }
          }
          // 2. Sync Transactions
          if (pendingTransactions.length > 0) {
            const res = await api<{ syncedIds: string[] }>('/api/sync/transactions', {
              method: 'POST', 
              body: JSON.stringify({ pendingTransactions: pendingTransactions }),
            });
            if (res.syncedIds.length > 0) {
              set(state => ({
                pendingTransactions: state.pendingTransactions.filter(t => !res.syncedIds.includes(t.id)),
              }));
              transactionSuccess = true;
            }
          }
          if (ledgerSuccess || transactionSuccess) {
            toast.success('Cloud synchronization complete');
            // Re-fetch application data
            if (typeof window !== 'undefined') {
              const qc = (window as any).queryClient;
              if (qc) {
                qc.invalidateQueries();
              }
            }
          }
        } catch (error) {
          console.error('Sync failure:', error);
          toast.error('Sync interrupted', { description: 'Local data remains safe. Retrying when stable.' });
        } finally {
          set({ isSyncing: false });
        }
      },
      setOnlineStatus: (isOnline) => set({ isOnline }),
    }),
    {
      name: 'suitewaste-offline-storage',
      storage: createJSONStorage(() => storage),
    }
  )
);
// Global connectivity listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => useOfflineStore.getState().setOnlineStatus(true));
  window.addEventListener('offline', () => useOfflineStore.getState().setOnlineStatus(false));
  // Auto-sync trigger
  useOfflineStore.subscribe((state, prevState) => {
    if (state.isOnline && !prevState.isOnline) {
      state.syncAllPending();
    }
  });
}