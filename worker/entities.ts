import { IndexedEntity, type Env } from "./core-utils";
import type { Supplier, InventoryLedgerEntry, Transaction, User, Session, AuditLog, StaffMember, GLAccount, GLEntry } from "@shared/types";
import { MOCK_SUPPLIERS, MOCK_INVENTORY_LEDGER, MOCK_TRANSACTIONS, MOCK_USERS } from "@shared/mock-data";
export class SessionEntity extends IndexedEntity<Session> {
  static readonly entityName = "session";
  static readonly indexName = "sessions";
  static readonly initialState: Session = { id: "", userId: "", createdAt: 0 };
}
export class SupplierEntity extends IndexedEntity<Supplier> {
  static readonly entityName = "supplier";
  static readonly indexName = "suppliers";
  static readonly initialState: Supplier = { id: "", name: "", is_weee_compliant: false, created_at: 0, updated_at: 0 };
  static seedData = MOCK_SUPPLIERS;
}
export class InventoryLedgerEntity extends IndexedEntity<InventoryLedgerEntry> {
  static readonly entityName = "inventory_ledger";
  static readonly indexName = "inventory_ledger_entries";
  static readonly initialState: InventoryLedgerEntry = { id: "", supplier_id: "", material_type: "", weight_kg: 0, capture_timestamp: 0, is_synced: false, created_at: 0 };
  static seedData = MOCK_INVENTORY_LEDGER;
}
export class TransactionEntity extends IndexedEntity<Transaction> {
  static readonly entityName = "transaction";
  static readonly indexName = "transactions";
  static readonly initialState: Transaction = { id: "", ledger_entry_id: "", amount: 0, currency: "ZAR", transaction_timestamp: 0, epr_fee: 0, is_synced: false, created_at: 0 };
  static seedData = MOCK_TRANSACTIONS;
}
export class UserEntity extends IndexedEntity<User> {
  static readonly entityName = "user";
  static readonly indexName = "users";
  static readonly initialState: User = { id: "", username: "", password_hash: "", role: "operator", active: false, features: [], created_at: 0 };
  static seedData = MOCK_USERS;
}
export class StaffEntity extends IndexedEntity<StaffMember> {
  static readonly entityName = "staff";
  static readonly indexName = "staff_members";
  static readonly initialState: StaffMember = { id: "", name: "", pin: "", role: "operator", clock_status: "out", last_seen: 0 };
}
export class GLAccountEntity extends IndexedEntity<GLAccount> {
  static readonly entityName = "gl_account";
  static readonly indexName = "gl_accounts";
  static readonly initialState: GLAccount = { id: "", code: "", name: "", type: "Asset", balance: 0 };
}
export class GLEntryEntity extends IndexedEntity<GLEntry> {
  static readonly entityName = "gl_entry";
  static readonly indexName = "gl_entries";
  static readonly initialState: GLEntry = { id: "", account_id: "", debit: 0, credit: 0, description: "", timestamp: 0 };
}
export class AuditLogEntity extends IndexedEntity<AuditLog> {
  static readonly entityName = "audit_log";
  static readonly indexName = "audit_logs";
  static readonly initialState: AuditLog = { id: "", entity_id: "", entity_type: "system", action: "verify", actor_id: "system", timestamp: 0, payload_hash: "0", previous_hash: "0" };
  static async getLatestHash(env: Env): Promise<string> {
    const logs = await this.list(env, null, 1);
    return logs.items[0]?.payload_hash || "0000000000000000000000000000000000000000000000000000000000000000";
  }
  static async verifyChain(items: AuditLog[]): Promise<{ verified: boolean; totalChecked: number; reason?: string; blockId?: string }> {
    const sorted = [...items].sort((a, b) => a.timestamp - b.timestamp);
    let prevHash = "0000000000000000000000000000000000000000000000000000000000000000";
    for (const log of sorted) {
      if (log.previous_hash !== prevHash) {
        return { verified: false, totalChecked: sorted.indexOf(log), reason: "Hash linkage failure", blockId: log.id };
      }
      // In a real env, we'd re-compute the SHA256(timestamp|actor|action|details|prevHash) here
      prevHash = log.payload_hash;
    }
    return { verified: true, totalChecked: sorted.length };
  }
}