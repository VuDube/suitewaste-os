export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
export type WasteStreamType =
  | 'Plastic'
  | 'Paper & Packaging'
  | 'Glass'
  | 'Metals'
  | 'Electrical & Electronic'
  | 'Other';
export interface User {
  id: string;
  username: string;
  email?: string;
  password_hash: string;
  role: 'operator' | 'manager' | 'admin' | 'auditor';
  active: boolean;
  features?: string[];
  created_at: number;
}
export interface Session {
  id: string;
  userId: string;
  createdAt: number;
}
export interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  phone_number?: string;
  email?: string;
  address?: string;
  epr_number?: string;
  is_weee_compliant: boolean;
  created_at: number;
  updated_at: number;
}
export interface InventoryLedgerEntry {
  id: string;
  supplier_id: string;
  material_type: string;
  weight_kg: number;
  capture_timestamp: number;
  operator_id?: string;
  device_id?: string;
  photo_attachment_key?: string;
  notes?: string;
  is_synced: boolean;
  created_at: number;
}
export interface Transaction {
  id: string;
  ledger_entry_id: string;
  amount: number;
  currency: string;
  payment_method?: string;
  transaction_timestamp: number;
  receipt_key?: string;
  epr_fee: number;
  is_synced: boolean;
  created_at: number;
}
export interface StaffMember {
  id: string;
  name: string;
  pin: string;
  role: 'operator' | 'clerk' | 'driver' | 'manager';
  clock_status: 'in' | 'out';
  last_seen: number;
  features?: string[];
}
export interface GLAccount {
  id: string;
  code: string;
  name: string;
  type: 'Asset' | 'Liability' | 'Income' | 'Expense' | 'Equity';
  balance: number;
}
export interface GLEntry {
  id: string;
  account_id: string;
  transaction_id?: string;
  debit: number;
  credit: number;
  description: string;
  timestamp: number;
}
export interface FinanceSummary {
  net_amount: number;
  vat_amount: number;
  gross_amount: number;
  currency: 'ZAR';
}
export interface AuditLog {
  id: string;
  entity_id: string;
  entity_type: 'supplier' | 'ledger' | 'transaction' | 'user' | 'system' | 'staff' | 'finance';
  action: 'create' | 'update' | 'delete' | 'login' | 'verify' | 'clock-in' | 'clock-out';
  actor_id: string;
  timestamp: number;
  payload_hash: string;
  previous_hash: string;
  details?: string;
}
export interface EPRStreamData {
  weight: number;
  fees: number;
}
export interface EPRReport {
  compliance_pct: number;
  total_fees: number;
  audit_chain_status: 'verified' | 'tampered' | 'pending';
  streams: Record<WasteStreamType, EPRStreamData>;
}
export type ConfigUserUpdate = Pick<User, 'id' | 'role' | 'active' | 'features'>;