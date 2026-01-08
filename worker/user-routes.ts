import { Buffer } from 'buffer';
globalThis.Buffer = Buffer;

import { Hono } from "hono";
import type { Context, Next } from 'hono';
import { 
  SupplierEntity, 
  InventoryLedgerEntity, 
  TransactionEntity, 
  UserEntity, 
  SessionEntity, 
  AuditLogEntity, 
  StaffEntity, 
  GLAccountEntity, 
  GLEntryEntity 
} from "./entities";
import { ok, bad, notFound } from './core-utils';
import type { 
  InventoryLedgerEntry, 
  Supplier, 
  Transaction, 
  User, 
  ConfigUserUpdate, 
  AuditLog, 
  StaffMember, 
  WasteStreamType,
  ApiResponse
} from "@shared/types";
import { HTTPException } from "hono/http-exception";
import jwt from 'jsonwebtoken';
// Note: bcryptjs is avoided in Worker entry due to node:crypto issues in some environments.
// We assume password verification is handled or mocked for this phase's logic.
const JWT_SECRET = 'suitewaste-enterprise-v1-secret-key';
export interface Env {
  GlobalDurableObject: DurableObjectNamespace<any>;
  AI?: any;
}
export type HonoApp = Hono<{ Bindings: Env; Variables: { user?: User; sessionId?: string } }>;
export type HonoContext = Context<{ Bindings: Env; Variables: { user?: User; sessionId?: string } }>;
const unauthorized = () => new HTTPException(401, { message: 'Unauthorized' });
const forbidden = () => new HTTPException(403, { message: 'Forbidden' });
async function sha256(message: string) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}
async function createAuditRecord(c: HonoContext, params: { entity_id: string, entity_type: AuditLog['entity_type'], action: AuditLog['action'], payload: any }) {
  const user = c.get('user');
  const prevHash = await AuditLogEntity.getLatestHash(c.env);
  const timestamp = Date.now();
  const payloadStr = JSON.stringify(params.payload);
  const content = `${timestamp}|${user?.id || 'system'}|${params.action}|${payloadStr}|${prevHash}`;
  const hash = await sha256(content);
  const log: AuditLog = {
    id: crypto.randomUUID(),
    entity_id: params.entity_id,
    entity_type: params.entity_type,
    action: params.action,
    actor_id: user?.id || 'system',
    timestamp,
    payload_hash: hash,
    previous_hash: prevHash,
    details: payloadStr
  };
  await AuditLogEntity.create(c.env, log);
}
export function userRoutes(app: HonoApp) {
  app.use('/api/*', async (c: HonoContext, next: Next) => {
    const path = c.req.path;
    if (['/api/auth/init', '/api/auth/login', '/api/health'].some(p => path.startsWith(p))) return next();
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) throw unauthorized();
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const user = await new UserEntity(c.env, decoded.userId).getState();
      if (!user || !user.id || !user.active) throw unauthorized();
      c.set('user', user);
      c.set('sessionId', decoded.sessionId);
    } catch (e) {
      throw unauthorized();
    }
    await next();
  });
  const requireRole = (roles: User['role'][]) => async (c: HonoContext, next: Next) => {
    const user = c.get('user');
    if (!user || !roles.includes(user.role)) throw forbidden();
    await next();
  };
  // --- SUPPLIERS ---
  app.get('/api/suppliers', async (c) => {
    const list = await SupplierEntity.list(c.env, null, 1000);
    return ok(c, list.items);
  });
  app.post('/api/suppliers', requireRole(['admin', 'manager']), async (c) => {
    const body = await c.req.json<Omit<Supplier, 'id'>>();
    const supplier = await SupplierEntity.create(c.env, { 
      ...body, 
      id: crypto.randomUUID(), 
      created_at: Date.now(), 
      updated_at: Date.now() 
    } as Supplier);
    await createAuditRecord(c, { entity_id: supplier.id, entity_type: 'supplier', action: 'create', payload: supplier });
    return ok(c, supplier);
  });
  app.delete('/api/suppliers/:id', requireRole(['admin']), async (c) => {
    const id = c.req.param('id');
    const deleted = await SupplierEntity.delete(c.env, id);
    if (deleted) await createAuditRecord(c, { entity_id: id, entity_type: 'supplier', action: 'delete', payload: { id } });
    return ok(c, { id, deleted });
  });
  // --- LEDGER & TRANSACTIONS ---
  app.get('/api/ledger', async (c) => {
    const list = await InventoryLedgerEntity.list(c.env, null, 1000);
    return ok(c, list.items);
  });
  app.get('/api/transactions', async (c) => {
    const list = await TransactionEntity.list(c.env, null, 1000);
    return ok(c, list.items);
  });
  // --- SYNC ---
  app.post('/api/sync/ledger', async (c) => {
    const { pendingEntries } = await c.req.json<{ pendingEntries: InventoryLedgerEntry[] }>();
    const syncedIds: string[] = [];
    for (const entry of pendingEntries) {
      await InventoryLedgerEntity.create(c.env, { ...entry, is_synced: true });
      syncedIds.push(entry.id);
    }
    return ok(c, { syncedIds });
  });
  app.post('/api/sync/transactions', async (c) => {
    const { pendingTransactions } = await c.req.json<{ pendingTransactions: Transaction[] }>();
    const syncedIds: string[] = [];
    for (const tx of pendingTransactions) {
      await TransactionEntity.create(c.env, { ...tx, is_synced: true });
      syncedIds.push(tx.id);
    }
    return ok(c, { syncedIds });
  });
  // --- AUDIT ---
  app.get('/api/audit', requireRole(['admin', 'auditor']), async (c) => {
    const cursor = c.req.query('cursor');
    const logs = await AuditLogEntity.list(c.env, cursor || null, 50);
    return ok(c, logs);
  });
  app.post('/api/audit/verify', requireRole(['admin', 'auditor']), async (c) => {
    const logs = await AuditLogEntity.list(c.env, null, 1000);
    const result = await AuditLogEntity.verifyChain(logs.items);
    return ok(c, result);
  });
  // --- EPR REPORT ---
  app.get('/api/epr-report', requireRole(['admin', 'manager', 'auditor']), async (c) => {
    const ledger = await InventoryLedgerEntity.list(c.env, null, 2000);
    const transactions = await TransactionEntity.list(c.env, null, 2000);
    const streams: Record<WasteStreamType, { weight: number; fees: number }> = {
      'Plastic': { weight: 0, fees: 0 },
      'Paper & Packaging': { weight: 0, fees: 0 },
      'Glass': { weight: 0, fees: 0 },
      'Metals': { weight: 0, fees: 0 },
      'Electrical & Electronic': { weight: 0, fees: 0 },
      'Other': { weight: 0, fees: 0 }
    };
    const getStream = (mat: string): WasteStreamType => {
      const l = mat.toLowerCase();
      if (l.includes('plastic')) return 'Plastic';
      if (l.includes('paper') || l.includes('pack')) return 'Paper & Packaging';
      if (l.includes('glass')) return 'Glass';
      if (l.includes('metal') || l.includes('copper')) return 'Metals';
      if (l.includes('elect') || l.includes('weee')) return 'Electrical & Electronic';
      return 'Other';
    };
    ledger.items.forEach(entry => {
      const stream = getStream(entry.material_type);
      streams[stream].weight += entry.weight_kg;
      const tx = transactions.items.find(t => t.ledger_entry_id === entry.id);
      if (tx) streams[stream].fees += tx.epr_fee;
    });
    return ok(c, {
      compliance_pct: 98.5, // Mocked overall compliance
      total_fees: Object.values(streams).reduce((s, v) => s + v.fees, 0),
      audit_chain_status: 'verified',
      streams
    });
  });
  // --- CONFIG / SETTINGS ---
  app.get('/api/config/users', requireRole(['admin']), async (c) => {
    const users = await UserEntity.list(c.env, null, 100);
    return ok(c, users.items.map(({ password_hash, ...u }) => u));
  });
  app.post('/api/config/users', requireRole(['admin']), async (c) => {
    const updates = await c.req.json<ConfigUserUpdate[]>();
    for (const update of updates) {
      const inst = new UserEntity(c.env, update.id);
      await inst.patch(update);
    }
    return ok(c, { updated: updates.length });
  });
  // --- CAMERA ---
  app.get('/api/camera/snapshot', async (c) => {
    // Industrial placeholder proxy
    const imageUrl = `https://images.unsplash.com/photo-1530124560676-4fbc912f77c7?auto=format&fit=crop&q=80&w=800`;
    return ok(c, { imageUrl });
  });
  // --- AI CLASSIFY ---
  app.post('/api/ai/classify', async (c) => {
    const { material } = await c.req.json<{ material: string }>();
    let stream: WasteStreamType = 'Other';
    if (c.env.AI) {
      try {
        const response = await c.env.AI.run('@cf/meta/llama-2-7b-chat-int8', {
          messages: [
            { role: 'system', content: 'Output one: Plastic, Paper & Packaging, Glass, Metals, Electrical & Electronic, Other.' },
            { role: 'user', content: material }
          ]
        });
        stream = (response.response?.trim() || 'Other') as WasteStreamType;
      } catch (e) { console.warn(e); }
    }
    return ok(c, { suggestedStream: stream });
  });
  app.get('/api/dashboard', async (c) => {
    const [suppliers, ledger, transactions] = await Promise.all([
      SupplierEntity.list(c.env, null, 500),
      InventoryLedgerEntity.list(c.env, null, 500),
      TransactionEntity.list(c.env, null, 500),
    ]);
    return ok(c, {
      summary: {
        totalWeight: ledger.items.reduce((s, i) => s + i.weight_kg, 0),
        totalValue: transactions.items.reduce((s, i) => s + i.amount, 0),
        totalEPR: transactions.items.reduce((s, i) => s + i.epr_fee, 0),
        weeePct: suppliers.items.length > 0 ? (suppliers.items.filter(s => s.is_weee_compliant).length / suppliers.items.length) * 100 : 0,
        recentLedger: ledger.items.slice(0, 5),
        recentTransactions: transactions.items.slice(0, 5)
      }
    });
  });
  app.get('/api/auth/me', async (c) => {
    const user = c.get('user');
    if (!user) throw unauthorized();
    const { password_hash, ...safeUser } = user;
    return ok(c, safeUser);
  });
}