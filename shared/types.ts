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
  role: 'operator' | 'manager' | 'admin' | 'auditor' | 'buyer' | 'producer';
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
export interface Vehicle {
  id: string;
  registration: string;
  model: string;
  status: 'active' | 'maintenance' | 'idle';
  capacity_kg: number;
  last_service: number;
}
export interface CollectionRoute {
  id: string;
  vehicle_id: string;
  driver_id: string;
  stops: string[];
  status: 'pending' | 'in-progress' | 'completed';
  assigned_date: number;
}
export interface MarketplaceOrder {
  id: string;
  buyer_id: string;
  material_lot_id: string;
  weight_kg: number;
  price_zar: number;
  status: 'open' | 'paid' | 'shipped';
  epr_cert_hash?: string;
  created_at: number;
}
export interface ProducerDisposalRequest {
  id: string;
  producer_name: string;
  material_type: string;
  estimated_weight: number;
  status: 'requested' | 'scheduled' | 'collected';
  request_date: number;
}
export interface Timesheet {
  id: string;
  staff_id: string;
  clock_in: number;
  clock_out?: number;
  location_gps?: string;
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
export interface AuditLog {
  id: string;
  entity_id: string;
  entity_type: 'supplier' | 'ledger' | 'transaction' | 'user' | 'system' | 'staff' | 'finance' | 'fleet' | 'marketplace' | 'producer';
  action: 'create' | 'update' | 'delete' | 'login' | 'verify' | 'clock-in' | 'clock-out' | 'dispatch' | 'complete';
  actor_id: string;
  timestamp: number;
  payload_hash: string;
  previous_hash: string;
  details?: string;
}
export interface EPRReport {
  compliance_pct: number;
  total_fees: number;
  audit_chain_status: 'verified' | 'tampered' | 'pending';
  streams: Record<WasteStreamType, { weight: number; fees: number }>;
}
export type ConfigUserUpdate = Pick<User, 'id' | 'role' | 'active' | 'features'>;