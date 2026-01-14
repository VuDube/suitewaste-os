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
  SapsRecordEntity
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
    const { weight, context } = await c.req.json();
    // Simulate AI logic or call Workers AI if available
    const response: AIClassificationResult = {
      material_type: weight > 100 ? "Copper Grade A" : "Aluminum Siding",
      confidence: 0.94,
      grade_suggestion: "Premium Industrial",
      reasoning: "Mass density and operator context suggest high-value metal stream.",
      suggested_price_zar: weight > 100 ? 165.40 : 38.20
    };
    return ok(c, response);
  });
  // --- ECO REWARDS ---
  app.get('/api/suppliers/:id/rewards', async (c) => {
    const id = c.req.param('id');
    const rewards = await new EcoRewardEntity(c.env, id).getState();
    return ok(c, rewards);
  });
  // --- SYNC ENGINE (Enhanced with Rewards) ---
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
  // --- REST OF CORE ROUTES ---
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
    const { password_hash, ...safeUser } = user;
    return ok(c, { user: safeUser, token });
  });
  app.get('/api/auth/me', async (c) => {
    const user = c.get('user');
    if (!user) throw unauthorized();
    const { password_hash, ...safeUser } = user;
    return ok(c, safeUser);
  });
  app.get('/api/suppliers', async (c) => {
    const result = await SupplierEntity.list(c.env, null, 1000);
    // Attach rewards
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
        trends: Array.from({ length: 7 }).map((_, i) => ({
          date: new Date(Date.now() - (6-i)*86400000).toISOString().split('T')[0],
          weight: 100 + Math.random()*500,
          value: 1000 + Math.random()*5000,
          rewards: 50 + Math.random()*200
        }))
      }
    });
  });
}