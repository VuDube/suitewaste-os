import { IndexedEntity, type Env } from "./core-utils";
import type { Supplier, InventoryLedgerEntry, Transaction, User, Session, AuditLog, StaffMember, GLAccount, GLEntry } from "@shared/types";
import { MOCK_SUPPLIERS, MOCK_INVENTORY_LEDGER, MOCK_TRANSACTIONS, MOCK_USERS } from "@shared/mock-data";
// SESSION ENTITY
export class SessionEntity extends IndexedEntity<Session> {
  static readonly entityName = "session";
  static readonly indexName = "sessions";
  static readonly initialState: Session = { id: "", userId: "", createdAt: 0 };
}
// SUPPLIER ENTITY
export class SupplierEntity extends IndexedEntity<Supplier> {
  static readonly entityName = "supplier";
  static readonly indexName = "suppliers";
  static readonly initialState: Supplier = { id: "", name: "", is_weee_compliant: false, created_at: 0, updated_at: 0 };
  static seedData = MOCK_SUPPLIERS;
}
// INVENTORY LEDGER ENTITY
export class InventoryLedgerEntity extends IndexedEntity<InventoryLedgerEntry> {
  static readonly entityName = "inventory_ledger";
  static readonly indexName = "inventory_ledger_entries";
  static readonly initialState: InventoryLedgerEntry = { id: "", supplier_id: "", material_type: "", weight_kg: 0, capture_timestamp: 0, is_synced: false, created_at: 0 };
  static seedData = MOCK_INVENTORY_LEDGER;
}
// TRANSACTION ENTITY
export class TransactionEntity extends IndexedEntity<Transaction> {
  static readonly entityName = "transaction";
  static readonly indexName = "transactions";
  static readonly initialState: Transaction = { id: "", ledger_entry_id: "", amount: 0, currency: "ZAR", transaction_timestamp: 0, epr_fee: 0, is_synced: false, created_at: 0 };
  static seedData = MOCK_TRANSACTIONS;
}
// USER ENTITY
export class UserEntity extends IndexedEntity<User> {
  static readonly entityName = "user";
  static readonly indexName = "users";
  static readonly initialState: User = { id: "", username: "", password_hash: "", role: "operator", active: false, features: [], created_at: 0 };
  static seedData = MOCK_USERS;
}
// STAFF ENTITY
export class StaffEntity extends IndexedEntity<StaffMember> {
  static readonly entityName = "staff";
  static readonly indexName = "staff_members";
  static readonly initialState: StaffMember = { id: "", name: "", pin: "", role: "operator", clock_status: "out", last_seen: 0 };
}
// GL ACCOUNT ENTITY
export class GLAccountEntity extends IndexedEntity<GLAccount> {
  static readonly entityName = "gl_account";
  static readonly indexName = "gl_accounts";
  static readonly initialState: GLAccount = { id: "", code: "", name: "", type: "Asset", balance: 0 };
}
// GL ENTRY ENTITY
export class GLEntryEntity extends IndexedEntity<GLEntry> {
  static readonly entityName = "gl_entry";
  static readonly indexName = "gl_entries";
  static readonly initialState: GLEntry = { id: "", account_id: "", debit: 0, credit: 0, description: "", timestamp: 0 };
  /**
   * Post a double-entry leg and update account balance
   */
  static async post(env: Env, entry: Omit<GLEntry, 'id' | 'timestamp'>): Promise<GLEntry> {
    const fullEntry: GLEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    };
    const created = await this.create(env, fullEntry);
    // Update balance in account entity
    const acc = new GLAccountEntity(env, entry.account_id);
    await acc.mutate(s => ({
      ...s,
      balance: s.balance + (entry.debit - entry.credit)
    }));
    return created;
  }
}
// AUDIT LOG ENTITY
export class AuditLogEntity extends IndexedEntity<AuditLog> {
  static readonly entityName = "audit_log";
  static readonly indexName = "audit_logs";
  static readonly initialState: AuditLog = { id: "", entity_id: "", entity_type: "system", action: "verify", actor_id: "system", timestamp: 0, payload_hash: "0", previous_hash: "0" };
  static async getLatestHash(env: Env): Promise<string> {
    const logs = await this.list(env, null, 1);
    return logs.items[0]?.payload_hash || "0000000000000000000000000000000000000000000000000000000000000000";
  }
}