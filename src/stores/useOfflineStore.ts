import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';
import { v4 as uuid } from 'uuid';
import { toast } from 'sonner';
import type { InventoryLedgerEntry, Transaction } from '@shared/types';
import { api } from '@/lib/api-client';
interface OfflineState {
  pendingLedgerEntries: InventoryLedgerEntry[];
  pendingTransactions: Transaction[];
  isOnline: boolean;
  addLedgerEntry: (entry: Omit<InventoryLedgerEntry, 'id' | 'is_synced' | 'created_at' | 'capture_timestamp'>) => void;
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
      addLedgerEntry: (entry) => {
        const newEntry: InventoryLedgerEntry = {
          ...entry,
          id: uuid(),
          is_synced: false,
          created_at: Date.now(),
          capture_timestamp: Date.now(),
        };
        set((state) => ({ pendingLedgerEntries: [...state.pendingLedgerEntries, newEntry] }));
        toast.success('Weight captured locally', {
          description: `${newEntry.weight_kg.toFixed(2)}kg of ${newEntry.material_type} is queued for sync.`,
        });
      },
      addTransaction: (transaction) => {
        const newTransaction: Transaction = {
          ...transaction,
          id: uuid(),
          is_synced: false,
          created_at: Date.now(),
          transaction_timestamp: Date.now(),
        };
        set((state) => ({ pendingTransactions: [...state.pendingTransactions, newTransaction] }));
        toast.success('Transaction saved locally', { description: 'Queued for sync.' });
      },
      syncAllPending: async () => {
        const { isOnline, pendingLedgerEntries, pendingTransactions } = get();
        if (!isOnline) return;
        let synced = false;
        if (pendingLedgerEntries.length > 0) {
          const entriesToSync = [...pendingLedgerEntries];
          try {
            const res = await api<{ syncedIds: string[] }>('/api/sync/ledger', {
              method: 'POST', body: JSON.stringify({ pendingEntries: entriesToSync }),
            });
            if (res.syncedIds.length > 0) {
              set(state => ({
                pendingLedgerEntries: state.pendingLedgerEntries.filter(e => !res.syncedIds.includes(e.id)),
              }));
              synced = true;
            }
          } catch (error) {
            toast.error('Ledger sync failed', { description: error instanceof Error ? error.message : 'Server error' });
          }
        }
        // Placeholder for transaction sync
        if (pendingTransactions.length > 0) {
            console.warn("Transaction sync not yet implemented on backend");
        }
        if (synced) {
          toast.success('Pending items synced successfully!');
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
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => useOfflineStore.getState().setOnlineStatus(true));
  window.addEventListener('offline', () => useOfflineStore.getState().setOnlineStatus(false));
  useOfflineStore.subscribe((state, prevState) => {
    if (state.isOnline && !prevState.isOnline && (state.pendingLedgerEntries.length > 0 || state.pendingTransactions.length > 0)) {
      state.syncAllPending();
    }
  });
  // Sync on focus if online and has pending items
  window.addEventListener('focus', () => {
    const state = useOfflineStore.getState();
    if (state.isOnline && (state.pendingLedgerEntries.length > 0 || state.pendingTransactions.length > 0)) {
      state.syncAllPending();
    }
  });
}