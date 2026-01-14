import { IndexedEntity, type Env } from "./core-utils";
import type {
  Supplier, InventoryLedgerEntry, Transaction, User, Session, AuditLog,
  StaffMember, GLAccount, GLEntry, Vehicle, CollectionRoute,
  MarketplaceOrder, ProducerDisposalRequest, Timesheet, EcoRewards
} from "@shared/types";
// New Enterprise Types (Inlined for worker context)
export interface SapsRecord { id: string; transaction_id: string; supplier_id: string; status: string; created_at: number; }
export interface Bid { id: string; lot_id: string; buyer_id: string; amount_zar: number; status: string; timestamp: number; }
export interface ObdLog { id: string; vehicle_id: string; timestamp: number; fuel_level: number; dtc_codes: string; }
export interface PayrollRecord { id: string; staff_id: string; net_pay: number; payment_status: string; period_end: number; }
export interface ChatMessage { id: string; channel_id: string; sender_id: string; encrypted_payload: string; timestamp: number; }
import { MOCK_SUPPLIERS, MOCK_INVENTORY_LEDGER, MOCK_TRANSACTIONS, MOCK_USERS } from "@shared/mock-data";
export class EcoRewardEntity extends IndexedEntity<EcoRewards> {
  static readonly entityName = "eco_reward";
  static readonly indexName = "eco_rewards";
  static readonly initialState: EcoRewards = { id: "", supplier_id: "", points_balance: 0, last_award_date: 0 };
  /**
   * Transactionally award points to a supplier.
   */
  static async awardPoints(env: Env, supplierId: string, weight: number, material: string): Promise<number> {
    const inst = new EcoRewardEntity(env, supplierId);
    const multiplier = material.toLowerCase().includes('copper') ? 5 : 1;
    const earned = Math.floor(weight * multiplier);
    const updated = await inst.mutate(s => ({
      ...s,
      supplier_id: supplierId,
      points_balance: s.points_balance + earned,
      last_award_date: Date.now()
    }));
    // Ensure index entry exists
    const idx = new (require("./core-utils").Index)(env, this.indexName);
    await idx.add(supplierId);
    return updated.points_balance;
  }
}
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
export class SapsRecordEntity extends IndexedEntity<SapsRecord> {
  static readonly entityName = "saps_record";
  static readonly indexName = "saps_records";
  static readonly initialState: SapsRecord = { id: "", transaction_id: "", supplier_id: "", status: "pending", created_at: 0 };
}
export class BidEntity extends IndexedEntity<Bid> {
  static readonly entityName = "bid";
  static readonly indexName = "bids";
  static readonly initialState: Bid = { id: "", lot_id: "", buyer_id: "", amount_zar: 0, status: "active", timestamp: 0 };
}
export class ObdLogEntity extends IndexedEntity<ObdLog> {
  static readonly entityName = "obd_log";
  static readonly indexName = "obd_logs";
  static readonly initialState: ObdLog = { id: "", vehicle_id: "", timestamp: 0, fuel_level: 0, dtc_codes: "[]" };
}
export class PayrollEntity extends IndexedEntity<PayrollRecord> {
  static readonly entityName = "payroll";
  static readonly indexName = "payroll_records";
  static readonly initialState: PayrollRecord = { id: "", staff_id: "", net_pay: 0, payment_status: "draft", period_end: 0 };
}
export class ChatMsgEntity extends IndexedEntity<ChatMessage> {
  static readonly entityName = "chat_msg";
  static readonly indexName = "chat_msgs";
  static readonly initialState: ChatMessage = { id: "", channel_id: "", sender_id: "", encrypted_payload: "", timestamp: 0 };
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
export class VehicleEntity extends IndexedEntity<Vehicle> {
  static readonly entityName = "vehicle";
  static readonly indexName = "vehicles";
  static readonly initialState: Vehicle = { id: "", registration: "", model: "", status: "idle", capacity_kg: 0, last_service: 0 };
  static seedData: ReadonlyArray<Vehicle> = [
    { id: "v-001", registration: "CA 123-456", model: "Isuzu NPR 400", status: "active", capacity_kg: 4000, last_service: Date.now() },
    { id: "v-002", registration: "GP 987-654", model: "Hino 300", status: "idle", capacity_kg: 3000, last_service: Date.now() }
  ];
}
export class RouteEntity extends IndexedEntity<CollectionRoute> {
  static readonly entityName = "route";
  static readonly indexName = "routes";
  static readonly initialState: CollectionRoute = { id: "", vehicle_id: "", driver_id: "", stops: [], status: "pending", assigned_date: 0 };
}
export class OrderEntity extends IndexedEntity<MarketplaceOrder> {
  static readonly entityName = "order";
  static readonly indexName = "orders";
  static readonly initialState: MarketplaceOrder = { id: "", buyer_id: "", material_lot_id: "", weight_kg: 0, price_zar: 0, status: "open", created_at: 0 };
}
export class ProducerRequestEntity extends IndexedEntity<ProducerDisposalRequest> {
  static readonly entityName = "producer_request";
  static readonly indexName = "producer_requests";
  static readonly initialState: ProducerDisposalRequest = { id: "", producer_name: "", material_type: "", estimated_weight: 0, status: "requested", request_date: 0 };
}
export class TimesheetEntity extends IndexedEntity<Timesheet> {
  static readonly entityName = "timesheet";
  static readonly indexName = "timesheets";
  static readonly initialState: Timesheet = { id: "", staff_id: "", clock_in: 0 };
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
  static readonly initialState: AuditLog = {
    id: "",
    entity_id: "",
    entity_type: "system",
    action: "verify",
    actor_id: "system",
    timestamp: 0,
    payload_hash: "0",
    previous_hash: "0"
  };
  static async record(
    env: Env,
    data: Omit<AuditLog, "id" | "timestamp" | "payload_hash" | "previous_hash">
  ): Promise<AuditLog> {
    const prevHash = await this.getLatestHash(env);
    const id = crypto.randomUUID();
    const timestamp = Date.now();
    const payloadStr = JSON.stringify({ ...data, id, timestamp, prevHash });
    const payloadHash = btoa(payloadStr).substring(0, 64);
    const log: AuditLog = {
      ...data,
      id,
      timestamp,
      payload_hash: payloadHash,
      previous_hash: prevHash
    };
    await this.create(env, log);
    return log;
  }
  static async getLatestHash(env: Env): Promise<string> {
    const logs = await this.list(env, null, 1);
    return logs.items[0]?.payload_hash || "0000000000000000000000000000000000000000000000000000000000000000";
  }
  static async verifyChain(items: AuditLog[]): Promise<{ verified: boolean; totalChecked: number; reason?: string; blockId?: string }> {
    if (items.length === 0) return { verified: true, totalChecked: 0 };
    const sorted = [...items].sort((a, b) => a.timestamp - b.timestamp);
    let prevHash = sorted[0].previous_hash;
    for (const log of sorted) {
      if (log.previous_hash !== prevHash) return { verified: false, totalChecked: sorted.indexOf(log), reason: "Hash linkage failure", blockId: log.id };
      prevHash = log.payload_hash;
    }
    return { verified: true, totalChecked: sorted.length };
  }
}