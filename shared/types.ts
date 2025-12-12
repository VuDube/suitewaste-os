export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
// --- SuiteWaste OS Core Types ---
export interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  phone_number?: string;
  email?: string;
  address?: string;
  epr_number?: string;
  is_weee_compliant: boolean;
  created_at: number; // epoch millis
  updated_at: number; // epoch millis
}
export interface InventoryLedgerEntry {
  id: string;
  supplier_id: string;
  material_type: string;
  weight_kg: number;
  capture_timestamp: number; // epoch millis
  operator_id?: string;
  device_id?: string;
  photo_attachment_key?: string;
  is_synced: boolean;
  created_at: number; // epoch millis
}
export interface Transaction {
  id: string;
  ledger_entry_id: string;
  amount: number;
  currency: string;
  payment_method?: string;
  transaction_timestamp: number; // epoch millis
  receipt_key?: string;
  epr_fee: number;
  is_synced: boolean;
  created_at: number; // epoch millis
}