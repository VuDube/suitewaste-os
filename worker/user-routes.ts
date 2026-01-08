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
import { ok, bad } from './core-utils';
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
  Timesheet
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
  const requireFeature = (feature: string) => async (c: HonoContext, next: Next) => {
    const user = c.get('user');
    if (!user || !user.features?.includes(feature)) throw forbidden();
    await next();
  };
  // --- FLEET ---
  app.get('/api/fleet/vehicles', async (c) => ok(c, (await VehicleEntity.list(c.env, null, 100)).items));
  app.post('/api/fleet/vehicles', requireRole(['admin', 'manager']), async (c) => {
    const body = await c.req.json<Vehicle>();
    const vehicle = await VehicleEntity.create(c.env, { ...body, id: body.id || crypto.randomUUID() });
    await createAuditRecord(c, { entity_id: vehicle.id, entity_type: 'fleet', action: 'create', payload: vehicle });
    return ok(c, vehicle);
  });
  app.get('/api/fleet/routes', async (c) => ok(c, (await RouteEntity.list(c.env, null, 100)).items));
  // --- MARKETPLACE ---
  app.get('/api/marketplace/lots', async (c) => {
    const lots = [
      { id: 'lot-cu-01', material: 'Copper Grade A', weight_kg: 500, purity: '99.9%', epr_status: 'verified' },
      { id: 'lot-al-01', material: 'Aluminum Extrusion', weight_kg: 1200, purity: '98%', epr_status: 'verified' },
      { id: 'lot-pt-01', material: 'PET Clear Flakes', weight_kg: 2500, purity: '95%', epr_status: 'verified' }
    ];
    return ok(c, lots);
  });
  app.post('/api/marketplace/orders', requireRole(['buyer', 'admin']), async (c) => {
    const body = await c.req.json<MarketplaceOrder>();
    const order = await OrderEntity.create(c.env, { ...body, id: crypto.randomUUID(), created_at: Date.now() });
    await createAuditRecord(c, { entity_id: order.id, entity_type: 'marketplace', action: 'create', payload: order });
    return ok(c, order);
  });
  // --- PRODUCERS ---
  app.get('/api/producers/requests', async (c) => ok(c, (await ProducerRequestEntity.list(c.env, null, 100)).items));
  app.post('/api/producers/requests', async (c) => {
    const body = await c.req.json<ProducerDisposalRequest>();
    const request = await ProducerRequestEntity.create(c.env, { ...body, id: crypto.randomUUID(), request_date: Date.now() });
    return ok(c, request);
  });
  // --- HR & TIMESHEETS ---
  app.get('/api/hr/staff', async (c) => ok(c, (await StaffEntity.list(c.env, null, 500)).items));
  app.post('/api/hr/clock', async (c) => {
    const { staffId, action } = await c.req.json<{ staffId: string, action: 'in' | 'out' }>();
    const inst = new StaffEntity(c.env, staffId);
    const staff = await inst.mutate(s => ({ ...s, clock_status: action, last_seen: Date.now() }));
    const timesheet = await TimesheetEntity.create(c.env, { id: crypto.randomUUID(), staff_id: staffId, clock_in: Date.now() });
    return ok(c, { staff, timesheet });
  });
  // --- CORE DASHBOARD ---
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
  app.get('/api/auth/me', async (c) => {
    const user = c.get('user');
    if (!user) throw unauthorized();
    const { password_hash, ...safeUser } = user;
    return ok(c, safeUser);
  });
}