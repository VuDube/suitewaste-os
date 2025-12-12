import { Hono } from "hono";
import type { Env } from './core-utils';
import { SupplierEntity, InventoryLedgerEntity, TransactionEntity } from "./entities";
import { ok, bad, notFound, isStr } from './core-utils';
import type { InventoryLedgerEntry, Supplier } from "@shared/types";
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  // --- SUPPLIERS ---
  app.get('/api/suppliers', async (c) => {
    await SupplierEntity.ensureSeed(c.env);
    const page = await SupplierEntity.list(c.env, null, 100); // Fetch up to 100 suppliers
    return ok(c, page.items);
  });
  app.post('/api/suppliers', async (c) => {
    const body = await c.req.json<Partial<Supplier>>();
    if (!body.name?.trim()) return bad(c, 'Supplier name is required');
    const newSupplier: Supplier = {
      id: crypto.randomUUID(),
      name: body.name.trim(),
      contact_person: body.contact_person,
      phone_number: body.phone_number,
      email: body.email,
      address: body.address,
      epr_number: body.epr_number,
      is_weee_compliant: body.is_weee_compliant ?? false,
      created_at: Date.now(),
      updated_at: Date.now(),
    };
    return ok(c, await SupplierEntity.create(c.env, newSupplier));
  });
  app.delete('/api/suppliers/:id', async (c) => {
    const id = c.req.param('id');
    const deleted = await SupplierEntity.delete(c.env, id);
    return ok(c, { id, deleted });
  });
  // --- INVENTORY LEDGER ---
  app.get('/api/ledger', async (c) => {
    await InventoryLedgerEntity.ensureSeed(c.env);
    const page = await InventoryLedgerEntity.list(c.env, null, 50); // Fetch recent 50
    // Simple in-memory sort by capture time descending for this example
    const sortedItems = page.items.sort((a, b) => b.capture_timestamp - a.capture_timestamp);
    return ok(c, sortedItems);
  });
  app.post('/api/ledger', async (c) => {
    const body = await c.req.json<Partial<InventoryLedgerEntry>>();
    if (!body.supplier_id || !body.material_type || !body.weight_kg) {
      return bad(c, 'supplier_id, material_type, and weight_kg are required');
    }
    const newEntry: InventoryLedgerEntry = {
      id: body.id || crypto.randomUUID(),
      supplier_id: body.supplier_id,
      material_type: body.material_type,
      weight_kg: body.weight_kg,
      capture_timestamp: body.capture_timestamp || Date.now(),
      is_synced: true, // When created via API, it's considered synced
      created_at: Date.now(),
    };
    return ok(c, await InventoryLedgerEntity.create(c.env, newEntry));
  });
  // --- OFFLINE SYNC ---
  app.post('/api/sync/ledger', async (c) => {
    const { pendingEntries } = await c.req.json<{ pendingEntries: InventoryLedgerEntry[] }>();
    if (!Array.isArray(pendingEntries) || pendingEntries.length === 0) {
      return bad(c, 'pendingEntries must be a non-empty array');
    }
    const syncedIds: string[] = [];
    const errors: { id: string, error: string }[] = [];
    for (const entry of pendingEntries) {
      try {
        const entryToCreate: InventoryLedgerEntry = {
          ...entry,
          is_synced: true, // Mark as synced
          created_at: entry.created_at || Date.now(),
        };
        await InventoryLedgerEntity.create(c.env, entryToCreate);
        syncedIds.push(entry.id);
      } catch (e) {
        console.error(`Failed to sync ledger entry ${entry.id}:`, e);
        errors.push({ id: entry.id, error: e instanceof Error ? e.message : 'Unknown error' });
      }
    }
    return ok(c, { syncedIds, errors });
  });
}