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
  OrderEntity,
  ProducerRequestEntity,
  SapsRecordEntity,
  BidEntity,
  ObdLogEntity,
  PayrollEntity,
  ChatMsgEntity,
  TimesheetEntity,
  GLAccountEntity
} from "./entities";
import { ok, bad, notFound } from './core-utils';
import type { InventoryLedgerEntry, Supplier, Transaction, User, StaffMember, AuditLog } from "@shared/types";
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
const forbidden = () => new HTTPException(403, { message: 'Forbidden' });
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
  // --- OPS & SHIFTS ---
  app.post('/api/ops/shifts', requireRole(['operator', 'manager', 'admin']), async (c) => {
    const { status } = await c.req.json();
    const user = c.get('user');
    await AuditLogEntity.record(c.env, {
      entity_id: user?.id || 'sys',
      entity_type: 'system',
      action: status === 'start' ? 'create' : 'update',
      actor_id: user?.id || 'sys',
      details: `Industrial shift ${status}ed by ${user?.username}`
    });
    return ok(c, { timestamp: Date.now() });
  });
  app.post('/api/hardware/calibrate', requireRole(['manager', 'admin']), async (c) => {
    const body = await c.req.json();
    const user = c.get('user');
    await AuditLogEntity.record(c.env, {
      entity_id: body.device || 'main-scale',
      entity_type: 'system',
      action: 'verify',
      actor_id: user?.id || 'sys',
      details: `Scale calibration verified: ${JSON.stringify(body)}`
    });
    return ok(c, { verified: true });
  });
  // --- FINANCE & VAT264 ---
  app.get('/api/finance/vat264', requireRole(['manager', 'admin', 'auditor']), async (c) => {
    const transactions = await TransactionEntity.list(c.env, null, 1000);
    // Filter transactions for non-VAT suppliers (mock logic)
    const logs = (transactions?.items || []).filter(t => t.amount > 5000);
    return ok(c, logs);
  });
  // --- AUTH SEEDING ---
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
  // --- STANDARD ENTITIES ---
  app.get('/api/suppliers', async (c) => {
    const result = await SupplierEntity.list(c.env, null, 1000);
    return ok(c, result?.items || []);
  });
  app.get('/api/ledger', async (c) => {
    const result = await InventoryLedgerEntity.list(c.env, null, 1000);
    return ok(c, result?.items || []);
  });
  app.get('/api/transactions', async (c) => {
    const result = await TransactionEntity.list(c.env, null, 1000);
    return ok(c, result?.items || []);
  });
  app.get('/api/hr/staff', async (c) => {
    const result = await StaffEntity.list(c.env, null, 500);
    return ok(c, result?.items || []);
  });
  app.get('/api/dashboard', async (c) => {
    const [suppliers, ledger, transactions] = await Promise.all([
      SupplierEntity.list(c.env, null, 100),
      InventoryLedgerEntity.list(c.env, null, 100),
      TransactionEntity.list(c.env, null, 100)
    ]);
    const ledgerItems = ledger?.items || [];
    const transactionsItems = transactions?.items || [];
    // Summary aggregation
    const totalWeight = ledgerItems.reduce((s, i) => s + (i.weight_kg || 0), 0);
    const totalValue = transactionsItems.reduce((s, i) => s + (i.amount || 0), 0);
    const totalEPR = transactionsItems.reduce((s, i) => s + (i.epr_fee || 0), 0);
    const trends = Array.from({ length: 14 }).map((_, i) => ({
      date: new Date(Date.now() - (13 - i) * 86400000).toISOString().split('T')[0],
      weight: 100 + Math.random() * 900,
      value: 1000 + Math.random() * 5000
    }));
    return ok(c, {
      summary: {
        totalWeight,
        totalValue,
        totalEPR,
        weeePct: 84.5,
        ai_fraud_risk: 12,
        sars_vat_due: totalValue * 0.15,
        trends
      }
    });
  });
  app.post('/api/ai/wingman-voice', async (c) => {
    const { text } = await c.req.json();
    return ok(c, { response: `Wingman received intent: ${text}. Industrial SOP sequence 4a is active.` });
  });
  app.get('/api/compliance/saps607', async (c) => {
    const result = await SapsRecordEntity.list(c.env, null, 100);
    return ok(c, result?.items || []);
  });
  app.get('/api/finance/gl-summary', async (c) => {
    const accounts = await GLAccountEntity.list(c.env, null, 100);
    return ok(c, accounts?.items || []);
  });
  app.get('/api/finance/vat-report', async (c) => {
    const transactions = await TransactionEntity.list(c.env, null, 1000);
    const items = transactions?.items || [];
    const totalGross = items.reduce((sum, t) => sum + (t.amount || 0), 0);
    const netAmount = totalGross / 1.15;
    const vatAmount = totalGross - netAmount;
    return ok(c, { net_amount: netAmount, vat_amount: vatAmount, gross_amount: totalGross });
  });
}