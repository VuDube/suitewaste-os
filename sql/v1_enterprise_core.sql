-- SuiteWaste OS :: Enterprise V1.0 Core Schema
-- Mission: SAPS 607, VAT 264, and 10-App Ecosystem Integrity
PRAGMA foreign_keys = ON;
-- 1. Second-Hand Goods Act (SAPS 607) Records
CREATE TABLE IF NOT EXISTS saps_607_records (
    id TEXT PRIMARY KEY,
    transaction_id TEXT NOT NULL,
    supplier_id TEXT NOT NULL,
    police_station TEXT,
    entry_number TEXT,
    fingerprint_hash TEXT, -- SHA256 of biometric capture
    id_photo_key TEXT,
    verification_status TEXT CHECK(status IN ('pending', 'verified', 'flagged')) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);
-- 2. Extended Producer Responsibility (EPR) Producers
CREATE TABLE IF NOT EXISTS producers (
    id TEXT PRIMARY KEY,
    company_name TEXT NOT NULL,
    reg_number TEXT UNIQUE,
    industry_sector TEXT, -- e.g. 'Electronics', 'Packaging'
    compliance_target_tons REAL,
    current_offset_tons REAL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 3. EcoRewards & Tokenization
CREATE TABLE IF NOT EXISTS ecorewards (
    id TEXT PRIMARY KEY,
    supplier_id TEXT NOT NULL,
    points_balance INTEGER DEFAULT 0,
    token_address TEXT, -- Future blockchain bridge
    last_award_date TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);
-- 4. Marketplace Bids (Auction System)
CREATE TABLE IF NOT EXISTS bids (
    id TEXT PRIMARY KEY,
    lot_id TEXT NOT NULL,
    buyer_id TEXT NOT NULL,
    amount_zar REAL NOT NULL,
    status TEXT CHECK(status IN ('active', 'outbid', 'won')) DEFAULT 'active',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (buyer_id) REFERENCES users(id)
);
-- 5. Vehicle Telematics (OBD-II Logs)
CREATE TABLE IF NOT EXISTS obd_logs (
    id TEXT PRIMARY KEY,
    vehicle_id TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fuel_level REAL,
    engine_temp REAL,
    dtc_codes TEXT, -- JSON array of Diagnostic Trouble Codes
    gps_lat REAL,
    gps_lng REAL,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);
-- 6. Payroll (BCEA Compliant)
CREATE TABLE IF NOT EXISTS payroll (
    id TEXT PRIMARY KEY,
    staff_id TEXT NOT NULL,
    period_start TIMESTAMP NOT NULL,
    period_end TIMESTAMP NOT NULL,
    base_pay REAL NOT NULL,
    overtime_pay REAL DEFAULT 0,
    deductions REAL DEFAULT 0,
    net_pay REAL NOT NULL,
    payment_status TEXT CHECK(status IN ('draft', 'processed', 'paid')) DEFAULT 'draft',
    FOREIGN KEY (staff_id) REFERENCES staff(id)
);
-- 7. Training & Safety Certificates
CREATE TABLE IF NOT EXISTS training_certs (
    id TEXT PRIMARY KEY,
    staff_id TEXT NOT NULL,
    cert_name TEXT NOT NULL,
    expiry_date TIMESTAMP NOT NULL,
    cert_url TEXT,
    FOREIGN KEY (staff_id) REFERENCES staff(id)
);
-- 8. E2EE Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    channel_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    encrypted_payload TEXT NOT NULL, -- AES-GCM
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 9. Global System Settings
CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 10. Audit Chain Expansion
CREATE INDEX IF NOT EXISTS idx_saps_transaction ON saps_607_records(transaction_id);
CREATE INDEX IF NOT EXISTS idx_bids_lot ON bids(lot_id);
CREATE INDEX IF NOT EXISTS idx_obd_vehicle ON obd_logs(vehicle_id);