import { Hono } from "hono";
import type { Context, Next } from 'hono';
import { SupplierEntity, InventoryLedgerEntity, TransactionEntity, UserEntity, SessionEntity, AuditLogEntity, StaffEntity, GLAccountEntity, GLEntryEntity } from "./entities";
import { ok, bad, notFound } from './core-utils';
import type { InventoryLedgerEntry, Supplier, Transaction, User, ConfigUserUpdate, Session, AuditLog, StaffMember, GLAccount, WasteStreamType } from "@shared/types";
import { HTTPException } from "hono/http-exception";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
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
  app.get('/api/auth/init', async (c: HonoContext) => {
    const allUsers = (await UserEntity.list(c.env, null, 1)).items;
    if (allUsers.length === 0) {
      const hashedAdminPass = await bcrypt.hash('admin789', 10);
      await UserEntity.create(c.env, {
        id: 'user-adm-001',
        username: 'admin1',
        password_hash: hashedAdminPass,
        role: 'admin',
        active: true,
        features: ['chat-access', 'fleet', 'hr'],
        created_at: Date.now()
      });
      return ok(c, { seeded: true });
    }
    return ok(c, { seeded: false });
  });
  app.post('/api/auth/login', async (c: HonoContext) => {
    const { username, password } = await c.req.json<{ username?: string; password?: string }>();
    if (!username || !password) return bad(c, 'Username and password required');
    const allUsers = (await UserEntity.list(c.env, null, 100)).items;
    const user = allUsers.find(u => u.username === username);
    if (!user || !user.active) return bad(c, 'Invalid credentials');
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return bad(c, 'Invalid credentials');
    const sessionId = crypto.randomUUID();
    const token = jwt.sign({ userId: user.id, sessionId }, JWT_SECRET, { expiresIn: '8h' });
    await SessionEntity.create(c.env, { id: sessionId, userId: user.id, createdAt: Date.now() });
    const { password_hash, ...userWithoutPassword } = user;
    return ok(c, { user: userWithoutPassword, token });
  });
  // --- HR MODULE ---
  app.get('/api/hr/staff', requireRole(['admin', 'manager']), async (c: HonoContext) => {
    const list = await StaffEntity.list(c.env, null, 1000);
    return ok(c, list.items);
  });
  app.post('/api/hr/staff', requireRole(['admin', 'manager']), async (c: HonoContext) => {
    const body = await c.req.json<StaffMember>();
    const staff = await StaffEntity.create(c.env, { ...body, id: crypto.randomUUID(), last_seen: Date.now() });
    await createAuditRecord(c, { entity_id: staff.id, entity_type: 'staff', action: 'create', payload: staff });
    return ok(c, staff);
  });
  app.put('/api/hr/staff/:id', requireRole(['admin', 'manager']), async (c: HonoContext) => {
    const id = c.req.param('id');
    const body = await c.req.json<Partial<StaffMember>>();
    const inst = new StaffEntity(c.env, id);
    await inst.patch({ ...body, last_seen: Date.now() });
    const next = await inst.getState();
    await createAuditRecord(c, { entity_id: id, entity_type: 'staff', action: 'update', payload: next });
    return ok(c, next);
  });
  // --- FINANCE MODULE ---
  app.get('/api/finance/gl-summary', requireRole(['admin', 'manager', 'auditor']), async (c: HonoContext) => {
    const accounts = await GLAccountEntity.list(c.env, null, 100);
    return ok(c, accounts.items);
  });
  app.get('/api/finance/vat-report', requireRole(['admin', 'manager', 'auditor']), async (c: HonoContext) => {
    const transactions = (await TransactionEntity.list(c.env, null, 1000)).items || [];
    const totalAmount = transactions.reduce((s, t) => s + t.amount, 0);
    const vatRate = 0.15;
    const netAmount = totalAmount / (1 + vatRate);
    const vatAmount = totalAmount - netAmount;
    return ok(c, { net_amount: netAmount, vat_amount: vatAmount, gross_amount: totalAmount, currency: 'ZAR' });
  });
  // --- WORKERS AI CLASSIFICATION ---
  app.post('/api/ai/classify', async (c: HonoContext) => {
    const { material } = await c.req.json<{ material: string }>();
    if (!material) return bad(c, 'Material description required');
    let stream: WasteStreamType = 'Other';
    try {
      if (c.env.AI) {
        const response = await c.env.AI.run('@cf/meta/llama-2-7b-chat-int8', {
          messages: [
            { role: 'system', content: 'You are an industrial waste classifier. Classify the input into one of these types: Plastic, Paper & Packaging, Glass, Metals, Electrical & Electronic, Other. Output only the category name.' },
            { role: 'user', content: material }
          ]
        });
        const aiText = response.response?.trim();
        if (aiText) stream = aiText as WasteStreamType;
      } else {
        // Mock classification fallback
        const lower = material.toLowerCase();
        if (lower.includes('wire') || lower.includes('copper') || lower.includes('metal')) stream = 'Metals';
        else if (lower.includes('bottle') || lower.includes('plastic')) stream = 'Plastic';
        else if (lower.includes('box') || lower.includes('paper')) stream = 'Paper & Packaging';
        else if (lower.includes('tv') || lower.includes('board') || lower.includes('weee')) stream = 'Electrical & Electronic';
      }
    } catch (e) {
      console.warn("AI Classification failed:", e);
    }
    return ok(c, { suggestedStream: stream });
  });
  app.get('/api/dashboard', async (c: HonoContext) => {
    const [suppliers, ledger, transactions] = await Promise.all([
      SupplierEntity.list(c.env, null, 500),
      InventoryLedgerEntity.list(c.env, null, 500),
      TransactionEntity.list(c.env, null, 500),
    ]);
    const itemsSuppliers = suppliers.items || [];
    const itemsLedger = ledger.items || [];
    const itemsTransactions = transactions.items || [];
    return ok(c, {
      summary: {
        totalWeight: itemsLedger.reduce((sum, item) => sum + item.weight_kg, 0),
        totalValue: itemsTransactions.reduce((sum, item) => sum + item.amount, 0),
        totalEPR: itemsTransactions.reduce((sum, item) => sum + item.epr_fee, 0),
        weeePct: itemsSuppliers.length > 0 ? (itemsSuppliers.filter(s => s.is_weee_compliant).length / itemsSuppliers.length) * 100 : 0,
        recentLedger: itemsLedger.slice(0, 5),
        recentTransactions: itemsTransactions.slice(0, 5),
        recentSuppliers: itemsSuppliers.slice(0, 5)
      }
    });
  });
  app.get('/api/auth/me', async (c: HonoContext) => {
    const user = c.get('user');
    if (!user) throw unauthorized();
    const { password_hash, ...safeUser } = user;
    return ok(c, safeUser);
  });
}