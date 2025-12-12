import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';
import { v4 as uuid } from 'uuid';
import { toast } from 'sonner';
import type { InventoryLedgerEntry } from '@shared/types';
import { api } from '@/lib/api-client';
interface OfflineState {
  pendingLedgerEntries: InventoryLedgerEntry[];
  isOnline: boolean;
  addLedgerEntry: (entry: Omit<InventoryLedgerEntry, 'id' | 'is_synced' | 'created_at' | 'capture_timestamp'>) => void;
  syncPendingEntries: () => Promise<void>;
  setOnlineStatus: (isOnline: boolean) => void;
}
const storage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};
export const useOfflineStore = create<OfflineState>()(
  persist(
    (set, get) => ({
      pendingLedgerEntries: [],
      isOnline: navigator.onLine,
      addLedgerEntry: (entry) => {
        const newEntry: InventoryLedgerEntry = {
          ...entry,
          id: uuid(),
          is_synced: false,
          created_at: Date.now(),
          capture_timestamp: Date.now(),
        };
        set((state) => ({
          pendingLedgerEntries: [...state.pendingLedgerEntries, newEntry],
        }));
        toast.success('Weight captured locally', {
          description: `${newEntry.weight_kg.toFixed(2)}kg of ${newEntry.material_type} is queued for sync.`,
        });
      },
      syncPendingEntries: async () => {
        const { isOnline, pendingLedgerEntries } = get();
        if (!isOnline || pendingLedgerEntries.length === 0) {
          return;
        }
        const entriesToSync = [...pendingLedgerEntries];
        toast.info(`Syncing ${entriesToSync.length} pending entries...`);
        try {
          const response = await api<{ syncedIds: string[], errors: any[] }>('/api/sync/ledger', {
            method: 'POST',
            body: JSON.stringify({ pendingEntries: entriesToSync }),
          });
          if (response.syncedIds.length > 0) {
            set((state) => ({
              pendingLedgerEntries: state.pendingLedgerEntries.filter(
                (entry) => !response.syncedIds.includes(entry.id)
              ),
            }));
            toast.success(`${response.syncedIds.length} entries synced successfully!`);
          }
          if (response.errors.length > 0) {
            toast.error('Some entries failed to sync.', {
              description: 'Check console for details.'
            });
            console.error('Sync errors:', response.errors);
          }
        } catch (error) {
          toast.error('Sync failed', {
            description: error instanceof Error ? error.message : 'Could not connect to the server.',
          });
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
// Initialize online status listeners
window.addEventListener('online', () => useOfflineStore.getState().setOnlineStatus(true));
window.addEventListener('offline', () => useOfflineStore.getState().setOnlineStatus(false));
// Attempt to sync when the app comes online
useOfflineStore.subscribe((state, prevState) => {
  if (state.isOnline && !prevState.isOnline && state.pendingLedgerEntries.length > 0) {
    console.log('Back online, attempting to sync...');
    state.syncPendingEntries();
  }
});