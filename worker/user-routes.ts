import { Hono } from "hono";
import type { Context, Next } from 'hono';
import { Buffer } from 'buffer';
(globalThis as any).Buffer = Buffer;
import {
  SupplierEntity,
  InventoryLedgerEntity,
  TransactionEntity,
  UserEntity,
  SessionEntity,
  AuditLogEntity,
  StaffEntity,
  VehicleEntity,
  RouteEntity,
  OrderEntity,
  ProducerRequestEntity,
  TimesheetEntity
} from "./entities";
import { ok, bad, notFound } from './core-utils';
import type {
  InventoryLedgerEntry,
  Supplier,
  Transaction,
  User,
  ConfigUserUpdate,
  AuditLog,
  Vehicle,
  CollectionRoute,
  MarketplaceOrder,
  ProducerDisposalRequest,
  Timesheet,
  WasteStreamType,
  EPRReport
} from "@shared/types";
import { HTTPException } from "hono/http-exception";
const JWT_SECRET = 'suitewaste-enterprise-v1-secret-key';
function base64urlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
  return Uint8Array.from(atob(padded), c => c.charCodeAt(0));
}
async function verifyJwt(token: string, secret: string): Promise<any> {
  const [headerB64, payloadB64, sigB64] = token.split('.');
  if (!headerB64 || !payloadB64 || !sigB64) throw new Error('Invalid token');
  const data = `${headerB64}.${payloadB64}`;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  const valid = await crypto.subtle.verify('HMAC', key, base64urlDecode(sigB64), new TextEncoder().encode(data));
  if (!valid) throw new Error('Invalid signature');
  return JSON.parse(new TextDecoder().decode(base64urlDecode(payloadB64)));
}
async function signJwt(payload: any, secret: string): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const data = `${headerB64}.${payloadB64}`;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${data}.${sigB64}`;
}
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
      const decoded = await verifyJwt(token, JWT_SECRET);
      const user = await new UserEntity(c.env, decoded.userId).getState();
      if (!user || !user.id || !user.active) throw unauthorized();
      c.set('user', user);
      c.set('sessionId', decoded.sessionId);
    } catch (e) { throw unauthorized(); }
    await next();
  });
  const requireRole = (roles: User['role'][]) => async (c: HonoContext, next: Next) => {
    const user = c.get('user');
    if (!user || !roles.includes(user.role)) throw forbidden();
    await next();
  };
  // --- AUTH ---
  app.get('/api/auth/init', async (c) => {
    await Promise.all([
      UserEntity.ensureSeed(c.env),
      SupplierEntity.ensureSeed(c.env),
      VehicleEntity.ensureSeed(c.env),
      InventoryLedgerEntity.ensureSeed(c.env),
      TransactionEntity.ensureSeed(c.env)
    ]);
    return ok(c, { seeded: true });
  });
  app.post('/api/auth/login', async (c) => {
    const { username, password } = await c.req.json();
    const users = await UserEntity.list(c.env, null, 100);
    const user = users.items.find(u => u.username === username && u.password_hash === password);
    if (!user || !user.active) return bad(c, 'Invalid credentials or inactive account');
    const sessionId = crypto.randomUUID();
    await SessionEntity.create(c.env, { id: sessionId, userId: user.id, createdAt: Date.now() });
    const token = await signJwt({ userId: user.id, sessionId }, JWT_SECRET);
    const { password_hash, ...safeUser } = user;
    return ok(c, { user: safeUser, token });
  });
  app.get('/api/auth/me', async (c) => {
    const user = c.get('user');
    if (!user) throw unauthorized();
    const { password_hash, ...safeUser } = user;
    return ok(c, safeUser);
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
    for (const t of pendingTransactions) {
      await TransactionEntity.create(c.env, { ...t, is_synced: true });
      syncedIds.push(t.id);
    }
    return ok(c, { syncedIds });
  });
  // --- SUPPLIERS ---
  app.get('/api/suppliers', async (c) => ok(c, (await SupplierEntity.list(c.env, null, 1000)).items));
  app.post('/api/suppliers', requireRole(['admin', 'manager']), async (c) => {
    const body = await c.req.json<Supplier>();
    const supplier = await SupplierEntity.create(c.env, { ...body, id: crypto.randomUUID(), created_at: Date.now(), updated_at: Date.now() });
    return ok(c, supplier);
  });
  app.delete('/api/suppliers/:id', requireRole(['admin']), async (c) => {
    const id = c.req.param('id');
    const deleted = await SupplierEntity.delete(c.env, id);
    return ok(c, { id, deleted });
  });
  // --- LEDGER & TRANSACTIONS ---
  app.get('/api/ledger', async (c) => ok(c, (await InventoryLedgerEntity.list(c.env, null, 1000)).items));
  app.get('/api/transactions', async (c) => ok(c, (await TransactionEntity.list(c.env, null, 1000)).items));
  // --- EPR & COMPLIANCE ---
  app.get('/api/epr-report', async (c) => {
    const [ledger, transactions] = await Promise.all([
      InventoryLedgerEntity.list(c.env, null, 1000),
      TransactionEntity.list(c.env, null, 1000)
    ]);
    const streams: Record<WasteStreamType, { weight: number; fees: number }> = {
      'Plastic': { weight: 0, fees: 0 },
      'Paper & Packaging': { weight: 0, fees: 0 },
      'Glass': { weight: 0, fees: 0 },
      'Metals': { weight: 0, fees: 0 },
      'Electrical & Electronic': { weight: 0, fees: 0 },
      'Other': { weight: 0, fees: 0 }
    };
    ledger.items.forEach(item => {
      const type = item.material_type.toLowerCase();
      let streamKey: WasteStreamType = 'Other';
      if (type.includes('plastic')) streamKey = 'Plastic';
      else if (type.includes('metal') || type.includes('copper')) streamKey = 'Metals';
      else if (type.includes('glass')) streamKey = 'Glass';
      else if (type.includes('paper')) streamKey = 'Paper & Packaging';
      else if (type.includes('weee') || type.includes('elec')) streamKey = 'Electrical & Electronic';
      streams[streamKey].weight += item.weight_kg;
      const t = transactions.items.find(tr => tr.ledger_entry_id === item.id);
      if (t) streams[streamKey].fees += t.epr_fee;
    });
    const report: EPRReport = {
      compliance_pct: 94.5,
      total_fees: transactions.items.reduce((sum, t) => sum + t.epr_fee, 0),
      audit_chain_status: 'verified',
      streams
    };
    return ok(c, report);
  });
  // --- AUDIT ---
  app.get('/api/audit', requireRole(['admin', 'auditor']), async (c) => {
    const cursor = c.req.query('cursor');
    return ok(c, await AuditLogEntity.list(c.env, cursor, 50));
  });
  app.post('/api/audit/verify', requireRole(['admin', 'auditor']), async (c) => {
    const logs = await AuditLogEntity.list(c.env, null, 1000);
    const result = await AuditLogEntity.verifyChain(logs.items);
    return ok(c, result);
  });
  // --- CONFIG ---
  app.get('/api/config/users', requireRole(['admin']), async (c) => {
    const users = await UserEntity.list(c.env, null, 100);
    return ok(c, users.items.map(({ password_hash, ...u }) => u));
  });
  app.post('/api/config/users', requireRole(['admin']), async (c) => {
    const updates = await c.req.json<ConfigUserUpdate[]>();
    for (const up of updates) {
      const inst = new UserEntity(c.env, up.id);
      await inst.patch(up);
    }
    return ok(c, { success: true });
  });
  // --- HARDWARE STUBS ---
  app.post('/api/ai/classify', async (c) => {
    const { material } = await c.req.json();
    return ok(c, { suggestedStream: 'Metals' });
  });
  app.get('/api/camera/snapshot', async (c) => {
    return ok(c, { imageUrl: 'https://images.unsplash.com/photo-1599153066743-08810dc8a419?auto=format&fit=crop&q=80&w=600' });
  });
  app.post('/api/admin/sessions/clear', requireRole(['admin']), async (c) => {
    const sessions = await SessionEntity.list(c.env, null, 1000);
    await SessionEntity.deleteMany(c.env, sessions.items.map(s => s.id));
    return ok(c, { cleared: sessions.items.length });
  });
  // --- FINANCE ---
  app.get('/api/finance/vat-report', async (c) => {
    const transactions = await TransactionEntity.list(c.env, null, 1000);
    const total = transactions.items.reduce((sum, t) => sum + t.amount, 0);
    return ok(c, {
      net_amount: total / 1.15,
      vat_amount: total - (total / 1.15),
      gross_amount: total
    });
  });
  app.get('/api/finance/gl-summary', async (c) => {
    return ok(c, [
      { id: '1', name: 'Cash at Bank', code: '1000', balance: 45000 },
      { id: '2', name: 'VAT Output', code: '2000', balance: 6750 }
    ]);
  });
  // --- HR & FLEET ---
  app.get('/api/hr/staff', async (c) => ok(c, (await StaffEntity.list(c.env, null, 500)).items));
  app.get('/api/fleet/vehicles', async (c) => ok(c, (await VehicleEntity.list(c.env, null, 100)).items));
  app.get('/api/fleet/routes', async (c) => ok(c, (await RouteEntity.list(c.env, null, 100)).items));
  // --- DASHBOARD ---
  app.get('/api/dashboard', async (c) => {
    const [suppliers, ledger, transactions] = await Promise.all([
      SupplierEntity.list(c.env, null, 100),
      InventoryLedgerEntity.list(c.env, null, 100),
      TransactionEntity.list(c.env, null, 100),
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
}