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
  VehicleEntity,
  RouteEntity,
  EcoRewardEntity,
  SapsRecordEntity,
  OrderEntity,
  ProducerRequestEntity
} from "./entities";
import { ok, bad, notFound } from './core-utils';
import type { InventoryLedgerEntry, Transaction, User, AIClassificationResult } from "@shared/types";
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
export interface Env { GlobalDurableObject: DurableObjectNamespace<any>; AI?: any; }
export type HonoApp = Hono<{ Bindings: Env; Variables: { user?: User; sessionId?: string } }>;
export type HonoContext = Context<{ Bindings: Env; Variables: { user?: User; sessionId?: string } }>;
const unauthorized = () => new HTTPException(401, { message: 'Unauthorized' });
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
  // --- AI CLASSIFICATION ---
  app.post('/api/ai/classify', async (c) => {
    const { weight } = await c.req.json();
    const response: AIClassificationResult = {
      material_type: weight > 100 ? "Copper Grade A" : "Aluminum Siding",
      confidence: 0.94,
      grade_suggestion: "Premium Industrial",
      reasoning: "Mass density and operator context suggest high-value metal stream.",
      suggested_price_zar: weight > 100 ? 165.40 : 38.20
    };
    return ok(c, response);
  });
  // --- HR MODULE ---
  app.get('/api/hr/staff', async (c) => {
    const result = await StaffEntity.list(c.env, null, 1000);
    return ok(c, result?.items || []);
  });
  // --- FLEET MODULE ---
  app.get('/api/fleet/vehicles', async (c) => {
    const result = await VehicleEntity.list(c.env, null, 100);
    return ok(c, result?.items || []);
  });
  app.get('/api/fleet/routes', async (c) => {
    const result = await RouteEntity.list(c.env, null, 100);
    return ok(c, result?.items || []);
  });
  app.post('/api/fleet/routes/:id/dispatch', async (c) => {
    const id = c.req.param('id');
    const entity = new RouteEntity(c.env, id);
    await entity.patch({ status: 'in-progress' });
    await AuditLogEntity.record(c.env, {
      entity_id: id,
      entity_type: 'fleet',
      action: 'dispatch',
      actor_id: c.get('user')?.id || 'sys'
    });
    return ok(c, { status: 'dispatched' });
  });
  // --- FINANCE MODULE ---
  app.get('/api/finance/vat-report', async (c) => {
    const transactions = await TransactionEntity.list(c.env, null, 1000);
    const totalValue = transactions.items.reduce((sum, t) => sum + t.amount, 0);
    const vatAmount = totalValue * 0.15;
    return ok(c, { totalValue, vat_amount: vatAmount });
  });
  app.get('/api/finance/vat264', async (c) => {
    const transactions = await TransactionEntity.list(c.env, null, 1000);
    // Simulation: Only purchases from non-VAT vendors (simplified)
    return ok(c, transactions.items.slice(0, 10));
  });
  // --- MARKETPLACE & PRODUCER ---
  app.get('/api/marketplace/lots', async (c) => {
    const orders = await OrderEntity.list(c.env, null, 100);
    const mockLots = [
      { id: 'lot-001', material: 'Copper Grade A', weight_kg: 450, epr_status: 'CERTIFIED', purity: '99.9%' },
      { id: 'lot-002', material: 'Aluminum Mixed', weight_kg: 1200, epr_status: 'PENDING', purity: '85%' }
    ];
    return ok(c, mockLots);
  });
  app.get('/api/producers/requests', async (c) => {
    const result = await ProducerRequestEntity.list(c.env, null, 100);
    return ok(c, result?.items || []);
  });
  // --- OPERATIONS & HARDWARE ---
  app.post('/api/ops/shifts', async (c) => {
    const { status } = await c.req.json();
    await AuditLogEntity.record(c.env, {
      entity_id: 'shift-' + Date.now(),
      entity_type: 'system',
      action: status === 'start' ? 'clock-in' : 'clock-out',
      actor_id: c.get('user')?.id || 'sys'
    });
    return ok(c, { success: true });
  });
  app.post('/api/hardware/calibrate', async (c) => {
    const results = await c.req.json();
    await AuditLogEntity.record(c.env, {
      entity_id: results.device || 'unknown-scale',
      entity_type: 'system',
      action: 'verify',
      actor_id: c.get('user')?.id || 'sys',
      details: JSON.stringify(results)
    });
    return ok(c, { success: true });
  });
  app.get('/api/camera/snapshot', async (c) => {
    return ok(c, { imageUrl: `https://images.unsplash.com/photo-1599153066743-08810dc8a419?auto=format&fit=crop&q=80&w=800` });
  });
  // --- COMPLIANCE & AUDIT ---
  app.get('/api/compliance/saps607', async (c) => {
    const result = await SapsRecordEntity.list(c.env, null, 1000);
    // Mock entries if empty
    if (result.items.length === 0) {
      return ok(c, [
        { id: 'saps-1', transaction_id: 't-123', supplier_id: 'supp-1', status: 'verified', created_at: Date.now() },
        { id: 'saps-2', transaction_id: 't-124', supplier_id: 'supp-2', status: 'verified', created_at: Date.now() }
      ]);
    }
    return ok(c, result.items);
  });
  app.get('/api/audit', async (c) => {
    const cursor = c.req.query('cursor');
    const result = await AuditLogEntity.list(c.env, cursor || null, 50);
    return ok(c, result);
  });
  app.post('/api/audit/verify', async (c) => {
    const logs = await AuditLogEntity.list(c.env, null, 1000);
    const result = await AuditLogEntity.verifyChain(logs.items);
    return ok(c, result);
  });
  // --- DATA GOVERNANCE ---
  app.get('/api/auth/export', async (c) => {
    const user = c.get('user');
    if (!user) throw unauthorized();
    const ledger = await InventoryLedgerEntity.list(c.env, null, 1000);
    const userLedger = ledger.items.filter(l => l.operator_id === user.id);
    return ok(c, { user, activity: userLedger });
  });
  app.post('/api/auth/purge', async (c) => {
    const user = c.get('user');
    if (!user) throw unauthorized();
    await UserEntity.delete(c.env, user.id);
    // Sessions usually deleted by index cleanup in real apps
    return ok(c, { purged: true });
  });
  // --- AUTH & SEED ---
  app.get('/api/auth/init', async (c) => {
    await Promise.all([
      UserEntity.ensureSeed(c.env),
      SupplierEntity.ensureSeed(c.env),
      VehicleEntity.ensureSeed(c.env)
    ]);
    return ok(c, { seeded: true });
  });
  app.post('/api/auth/login', async (c) => {
    const { username, password } = await c.req.json();
    const users = await UserEntity.list(c.env, null, 100);
    const user = (users?.items || []).find(u => u.username === username && u.password_hash === password);
    if (!user || !user.active) return bad(c, 'Invalid credentials');
    const sessionId = crypto.randomUUID();
    await SessionEntity.create(c.env, { id: sessionId, userId: user.id, createdAt: Date.now() });
    const token = await signJwt({ userId: user.id, sessionId }, JWT_SECRET);
    return ok(c, { user, token });
  });
  app.get('/api/auth/me', async (c) => {
    const user = c.get('user');
    if (!user) throw unauthorized();
    return ok(c, user);
  });
  app.get('/api/suppliers', async (c) => {
    const result = await SupplierEntity.list(c.env, null, 1000);
    const enhanced = await Promise.all(result.items.map(async s => {
      const r = await new EcoRewardEntity(c.env, s.id).getState();
      return { ...s, total_rewards: r.points_balance };
    }));
    return ok(c, enhanced);
  });
  app.get('/api/ledger', async (c) => {
    const result = await InventoryLedgerEntity.list(c.env, null, 1000);
    return ok(c, result?.items || []);
  });
  app.get('/api/transactions', async (c) => {
    const result = await TransactionEntity.list(c.env, null, 1000);
    return ok(c, result?.items || []);
  });
  app.get('/api/dashboard', async (c) => {
    const [ledger, transactions, rewards] = await Promise.all([
      InventoryLedgerEntity.list(c.env, null, 100),
      TransactionEntity.list(c.env, null, 100),
      EcoRewardEntity.list(c.env, null, 100)
    ]);
    const totalWeight = ledger.items.reduce((s, i) => s + i.weight_kg, 0);
    const totalValue = transactions.items.reduce((s, i) => s + i.amount, 0);
    const totalRewards = rewards.items.reduce((s, i) => s + i.points_balance, 0);
    return ok(c, {
      summary: {
        totalWeight,
        totalValue,
        totalRewards,
        ai_fraud_risk: 8,
        sars_vat_due: totalValue * 0.15,
        weeePct: 74,
        trends: Array.from({ length: 7 }).map((_, i) => ({
          date: new Date(Date.now() - (6-i)*86400000).toISOString().split('T')[0],
          weight: 100 + Math.random()*500,
          value: 1000 + Math.random()*5000,
          rewards: 50 + Math.random()*200
        }))
      }
    });
  });
  app.post('/api/sync/transactions', async (c) => {
    const { pendingTransactions } = await c.req.json<{ pendingTransactions: Transaction[] }>();
    const ledger = await InventoryLedgerEntity.list(c.env, null, 1000);
    const ledgerMap = new Map(ledger.items.map(l => [l.id, l]));
    for (const t of pendingTransactions) {
      await TransactionEntity.create(c.env, { ...t, is_synced: true });
      const entry = ledgerMap.get(t.ledger_entry_id);
      if (entry) {
        await EcoRewardEntity.awardPoints(c.env, entry.supplier_id, entry.weight_kg, entry.material_type);
      }
    }
    return ok(c, { syncedIds: pendingTransactions.map(t => t.id) });
  });
  app.post('/api/sync/ledger', async (c) => {
    const { pendingEntries } = await c.req.json<{ pendingEntries: InventoryLedgerEntry[] }>();
    for (const e of pendingEntries) {
      await InventoryLedgerEntity.create(c.env, { ...e, is_synced: true });
    }
    return ok(c, { syncedIds: pendingEntries.map(e => e.id) });
  });
}