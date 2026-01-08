import { Hono } from "hono";
import type { Context, Next } from 'hono';
import { SupplierEntity, InventoryLedgerEntity, TransactionEntity, UserEntity, SessionEntity, AuditLogEntity } from "./entities";
import { ok, bad, notFound } from './core-utils';
import type { InventoryLedgerEntry, Supplier, Transaction, User, ConfigUserUpdate, Session, AuditLog } from "@shared/types";
import { HTTPException } from "hono/http-exception";
export interface Env { GlobalDurableObject: DurableObjectNamespace<any>; }
export type HonoApp = Hono<{ Bindings: Env; Variables: { user?: User; sessionId?: string } }>;
export type HonoContext = Context<{ Bindings: Env; Variables: { user?: User; sessionId?: string } }>;
const unauthorized = () => new HTTPException(401, { message: 'Unauthorized' });
const forbidden = () => new HTTPException(403, { message: 'Forbidden' });
async function sha256(message: string) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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
const getEprStream = (materialType: string): string => {
  const lowerMat = materialType.toLowerCase();
  if (lowerMat.includes('plastic') || lowerMat.includes('pet') || lowerMat.includes('hdpe') || lowerMat.includes('pvc')) return 'Plastic';
  if (lowerMat.includes('paper') || lowerMat.includes('cardboard') || lowerMat.includes('packaging')) return 'Paper & Packaging';
  if (lowerMat.includes('glass')) return 'Glass';
  if (lowerMat.includes('copper') || lowerMat.includes('aluminum') || lowerMat.includes('steel') || lowerMat.includes('metal') || lowerMat.includes('brass') || lowerMat.includes('lead')) return 'Metals';
  if (lowerMat.includes('electronic') || lowerMat.includes('weee') || lowerMat.includes('battery') || lowerMat.includes('cable') || lowerMat.includes('circuit')) return 'Electrical & Electronic';
  return 'Other';
};
export function userRoutes(app: HonoApp) {
  // --- AUTH MIDDLEWARE ---
  app.use('/api/*', async (c: HonoContext, next: Next) => {
    const path = c.req.path;
    if (['/api/auth/init', '/api/auth/login', '/api/health'].some(p => path.startsWith(p))) return next();
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) throw unauthorized();
    const token = authHeader.split(' ')[1];
    const session = await new SessionEntity(c.env, token).getState();
    if (!session || !session.userId) throw unauthorized();
    const user = await new UserEntity(c.env, session.userId).getState();
    if (!user || !user.id || !user.active) throw unauthorized();
    c.set('user', user);
    c.set('sessionId', token);
    await next();
  });
  const requireRole = (roles: User['role'][]) => async (c: HonoContext, next: Next) => {
    const user = c.get('user');
    if (!user || !roles.includes(user.role)) throw forbidden();
    await next();
  };
  // --- AUTH ROUTES ---
  app.get('/api/auth/init', async (c: HonoContext) => {
    const allUsers = (await UserEntity.list(c.env, null, 1)).items;
    if (allUsers.length === 0) {
      await UserEntity.ensureSeed(c.env);
      return ok(c, { seeded: true });
    }
    return ok(c, { seeded: false });
  });
  app.post('/api/auth/login', async (c: HonoContext) => {
    const { username, password } = await c.req.json<{ username?: string; password?: string }>();
    if (!username || !password) return bad(c, 'Username and password required');
    const allUsers = (await UserEntity.list(c.env, null, 100)).items;
    const user = allUsers.find(u => u.username === username && u.password_hash === password);
    if (!user || !user.active) return bad(c, 'Invalid credentials');
    const sessionId = crypto.randomUUID();
    await SessionEntity.create(c.env, { id: sessionId, userId: user.id, createdAt: Date.now() });
    const { password_hash, ...userWithoutPassword } = user;
    return ok(c, { user: userWithoutPassword, token: sessionId });
  });
  app.post('/api/auth/logout', async (c: HonoContext) => {
    const sessionId = c.get('sessionId');
    if (sessionId) await SessionEntity.delete(c.env, sessionId);
    return ok(c, { success: true });
  });
  app.get('/api/auth/me', async (c: HonoContext) => {
    const user = c.get('user');
    if (!user) throw unauthorized();
    const { password_hash, ...safeUser } = user;
    return ok(c, safeUser);
  });
  // --- BUSINESS LOGIC ROUTES ---
  app.get('/api/dashboard', async (c: HonoContext) => {
    const user = c.get('user');
    if (!user) throw unauthorized();
    const [suppliersPage, ledgerPage, transactionsPage] = await Promise.all([
      SupplierEntity.list(c.env, null, 500),
      InventoryLedgerEntity.list(c.env, null, 500),
      TransactionEntity.list(c.env, null, 500),
    ]);
    const itemsSuppliers = suppliersPage.items || [];
    const itemsLedger = ledgerPage.items || [];
    const itemsTransactions = transactionsPage.items || [];
    const recentSuppliers = [...itemsSuppliers].sort((a, b) => b.created_at - a.created_at).slice(0, 5);
    const recentLedger = [...itemsLedger].sort((a, b) => b.capture_timestamp - a.capture_timestamp).slice(0, 5);
    const recentTransactions = [...itemsTransactions].sort((a, b) => b.transaction_timestamp - a.transaction_timestamp).slice(0, 5);
    const totalWeight = itemsLedger.reduce((sum, item) => sum + item.weight_kg, 0);
    const totalValue = itemsTransactions.reduce((sum, item) => sum + item.amount, 0);
    const totalEPR = itemsTransactions.reduce((sum, item) => sum + item.epr_fee, 0);
    const weeeCompliantCount = itemsSuppliers.filter(s => s.is_weee_compliant).length;
    const weeePct = itemsSuppliers.length > 0 ? (weeeCompliantCount / itemsSuppliers.length) * 100 : 0;
    const summaryData = {
      operator: { recentTransactions, recentLedger },
      manager: { totalWeight, totalValue, totalEPR, recentSuppliers, recentLedger },
      admin: { totalWeight, totalValue, totalEPR, weeePct, recentSuppliers, userCount: (await UserEntity.list(c.env, null, 100)).items.length },
      auditor: { totalWeight, totalEPR, weeePct, recentLedger, recentTransactions },
    };
    return ok(c, {
      summary: summaryData[user.role as keyof typeof summaryData] || summaryData.operator,
      hardwareStatus: { scale: 'connected', camera: 'healthy' },
    });
  });
  app.get('/api/epr-report', requireRole(['admin', 'auditor']), async (c: HonoContext) => {
    const [suppliers, ledger, transactions] = await Promise.all([
      SupplierEntity.list(c.env, null, 1000),
      InventoryLedgerEntity.list(c.env, null, 1000),
      TransactionEntity.list(c.env, null, 1000),
    ]);
    const ledgerMap = new Map((ledger.items || []).map(l => [l.id, l]));
    const streams: { [key: string]: { weight: number; fees: number } } = {};
    (transactions.items || []).forEach(t => {
      const entry = ledgerMap.get(t.ledger_entry_id);
      if (entry) {
        const name = getEprStream(entry.material_type);
        if (!streams[name]) streams[name] = { weight: 0, fees: 0 };
        streams[name].weight += entry.weight_kg;
        streams[name].fees += t.epr_fee;
      }
    });
    return ok(c, {
      compliance_pct: (suppliers.items?.length || 0) > 0 ? (suppliers.items!.filter(s => s.is_weee_compliant).length / suppliers.items!.length) * 100 : 0,
      total_fees: (transactions.items || []).reduce((sum, t) => sum + t.epr_fee, 0),
      streams
    });
  });
  app.get('/api/audit', requireRole(['admin', 'auditor']), async (c: HonoContext) => {
    const logs = await AuditLogEntity.list(c.env, c.req.query('cursor'), 50);
    return ok(c, logs);
  });
  app.post('/api/audit/verify', requireRole(['admin', 'auditor']), async (c: HonoContext) => {
    const logsRes = await AuditLogEntity.list(c.env, null, 1000);
    const logs = [...logsRes.items].sort((a, b) => a.timestamp - b.timestamp);
    let lastHash = "0000000000000000000000000000000000000000000000000000000000000000";
    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];
      if (log.previous_hash !== lastHash) {
        return ok(c, { verified: false, failureIndex: i, reason: 'Previous hash mismatch', blockId: log.id });
      }
      const content = `${log.timestamp}|${log.actor_id}|${log.action}|${log.details}|${log.previous_hash}`;
      const calculatedHash = await sha256(content);
      if (calculatedHash !== log.payload_hash) {
        return ok(c, { verified: false, failureIndex: i, reason: 'Payload hash mismatch', blockId: log.id });
      }
      lastHash = log.payload_hash;
    }
    return ok(c, { verified: true, totalChecked: logs.length });
  });
  app.post('/api/config/users', requireRole(['admin']), async (c: HonoContext) => {
    const updates = await c.req.json<ConfigUserUpdate[]>();
    for (const u of updates) {
      await new UserEntity(c.env, u.id).mutate(curr => ({ ...curr, role: u.role, active: u.active, features: u.features }));
    }
    return ok(c, { success: true });
  });
  app.get('/api/config/users', requireRole(['admin']), async (c: HonoContext) => {
    const users = (await UserEntity.list(c.env, null, 200)).items || [];
    return ok(c, users.map(({ password_hash, ...u }) => u));
  });
  app.post('/api/suppliers', requireRole(['admin', 'manager']), async (c: HonoContext) => {
    const body = await c.req.json<Partial<Supplier>>();
    const now = Date.now();
    const s: Supplier = { id: crypto.randomUUID(), name: body.name || "New Supplier", is_weee_compliant: !!body.is_weee_compliant, created_at: now, updated_at: now, ...body } as Supplier;
    const created = await SupplierEntity.create(c.env, s);
    await createAuditRecord(c, { entity_id: s.id, entity_type: 'supplier', action: 'create', payload: s });
    return ok(c, created);
  });
  app.get('/api/suppliers', async (c: HonoContext) => ok(c, (await SupplierEntity.list(c.env, null, 200)).items || []));
  app.delete('/api/suppliers/:id', requireRole(['admin', 'manager']), async (c: HonoContext) => {
    const id = c.req.param('id');
    const deleted = await SupplierEntity.delete(c.env, id);
    if (deleted) await createAuditRecord(c, { entity_id: id, entity_type: 'supplier', action: 'delete', payload: { id } });
    return ok(c, { deleted });
  });
  app.get('/api/ledger', async (c: HonoContext) => ok(c, (await InventoryLedgerEntity.list(c.env, null, 500)).items || []));
  app.post('/api/ledger', async (c: HonoContext) => {
    const body = await c.req.json<Partial<InventoryLedgerEntry>>();
    const now = Date.now();
    const entry: InventoryLedgerEntry = { id: crypto.randomUUID(), supplier_id: body.supplier_id || "", material_type: body.material_type || "Unknown", weight_kg: body.weight_kg || 0, capture_timestamp: now, is_synced: true, created_at: now, ...body } as InventoryLedgerEntry;
    const created = await InventoryLedgerEntity.create(c.env, entry);
    await createAuditRecord(c, { entity_id: entry.id, entity_type: 'ledger', action: 'create', payload: entry });
    return ok(c, created);
  });
  app.get('/api/transactions', async (c: HonoContext) => ok(c, (await TransactionEntity.list(c.env, null, 500)).items || []));
  app.post('/api/transactions', async (c: HonoContext) => {
    const body = await c.req.json<Partial<Transaction>>();
    const now = Date.now();
    const t: Transaction = { id: crypto.randomUUID(), ledger_entry_id: body.ledger_entry_id || "", amount: body.amount || 0, currency: "ZAR", transaction_timestamp: now, epr_fee: body.epr_fee || 0, is_synced: true, created_at: now, ...body } as Transaction;
    const created = await TransactionEntity.create(c.env, t);
    await createAuditRecord(c, { entity_id: t.id, entity_type: 'transaction', action: 'create', payload: t });
    return ok(c, created);
  });
  app.post('/api/sync/ledger', async (c: HonoContext) => {
    const { pendingEntries } = await c.req.json<{ pendingEntries: InventoryLedgerEntry[] }>();
    if (pendingEntries) for (const e of pendingEntries) await InventoryLedgerEntity.create(c.env, { ...e, is_synced: true });
    return ok(c, { syncedIds: (pendingEntries || []).map(e => e.id) });
  });
  app.post('/api/sync/transactions', async (c: HonoContext) => {
    const { pendingTransactions } = await c.req.json<{ pendingTransactions: Transaction[] }>();
    if (pendingTransactions) for (const t of pendingTransactions) await TransactionEntity.create(c.env, { ...t, is_synced: true });
    return ok(c, { syncedIds: (pendingTransactions || []).map(t => t.id) });
  });
  app.post('/api/admin/sessions/clear', requireRole(['admin']), async (c: HonoContext) => {
    const sessions = await SessionEntity.list(c.env, null, 5000);
    const ids = sessions.items.map(s => s.id);
    await SessionEntity.deleteMany(c.env, ids);
    return ok(c, { cleared: ids.length });
  });
  app.get('/api/camera/snapshot', async (c: HonoContext) => ok(c, { imageUrl: `https://images.unsplash.com/photo-1581092919546-23c1c35a828d?q=80&w=800&auto=format&fit=crop&ixid=${Math.random()}` }));
}