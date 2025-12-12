import { Hono } from "hono";
import type { Env } from './core-utils';
import { SupplierEntity, InventoryLedgerEntity, TransactionEntity } from "./entities";
import { ok, bad } from './core-utils';
import type { InventoryLedgerEntry, Supplier, Transaction } from "@shared/types";
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  // --- SUPPLIERS ---
  app.get('/api/suppliers', async (c) => {
    await SupplierEntity.ensureSeed(c.env);
    const page = await SupplierEntity.list(c.env, null, 100);
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
    const page = await InventoryLedgerEntity.list(c.env, null, 200); // Fetch more for client-side filtering
    return ok(c, page.items);
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
      is_synced: true,
      created_at: Date.now(),
      notes: body.notes,
    };
    return ok(c, await InventoryLedgerEntity.create(c.env, newEntry));
  });
  // --- TRANSACTIONS ---
  app.get('/api/transactions', async (c) => {
    await TransactionEntity.ensureSeed(c.env);
    const page = await TransactionEntity.list(c.env, null, 200);
    return ok(c, page.items);
  });
  app.post('/api/transactions', async (c) => {
    const body = await c.req.json<Partial<Transaction>>();
    if (!body.ledger_entry_id || body.amount == null) {
      return bad(c, 'ledger_entry_id and amount are required');
    }
    const newTransaction: Transaction = {
      id: body.id || crypto.randomUUID(),
      ledger_entry_id: body.ledger_entry_id,
      amount: body.amount,
      currency: body.currency || 'ZAR',
      payment_method: body.payment_method,
      transaction_timestamp: body.transaction_timestamp || Date.now(),
      epr_fee: body.epr_fee || 0,
      is_synced: true,
      created_at: Date.now(),
    };
    return ok(c, await TransactionEntity.create(c.env, newTransaction));
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
        await InventoryLedgerEntity.create(c.env, { ...entry, is_synced: true });
        syncedIds.push(entry.id);
      } catch (e) {
        errors.push({ id: entry.id, error: e instanceof Error ? e.message : 'Unknown error' });
      }
    }
    return ok(c, { syncedIds, errors });
  });
  app.post('/api/sync/transactions', async (c) => {
    const { pendingTransactions } = await c.req.json<{ pendingTransactions: Transaction[] }>();
    if (!Array.isArray(pendingTransactions) || pendingTransactions.length === 0) {
      return bad(c, 'pendingTransactions must be a non-empty array');
    }
    const syncedIds: string[] = [];
    const errors: { id: string, error: string }[] = [];
    for (const tx of pendingTransactions) {
      try {
        await TransactionEntity.create(c.env, { ...tx, is_synced: true });
        syncedIds.push(tx.id);
      } catch (e) {
        errors.push({ id: tx.id, error: e instanceof Error ? e.message : 'Unknown error' });
      }
    }
    return ok(c, { syncedIds, errors });
  });
  // --- HARDWARE MOCKS ---
  app.get('/api/camera/snapshot', async (c) => {
    // In a real app, you'd fetch from an IP camera using credentials from KV/Secrets
    // For this demo, we return a random industrial-themed image from Unsplash.
    const randomId = Math.floor(Math.random() * 1000);
    const imageUrl = `https://images.unsplash.com/photo-1581092919546-23c1c35a828d?q=80&w=800&auto=format&fit=crop&ixid=${randomId}`;
    return ok(c, { imageUrl });
  });
}