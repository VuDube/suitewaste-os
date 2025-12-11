-- SuiteWaste OS :: Enterprise Extension Schema
-- Version: 1.1
-- Description: Finance (General Ledger) and HR (Staff Management) extensions.
PRAGMA foreign_keys = ON;
-- --------------------------------------------------------------------------------
-- Table: staff
-- Description: Management of industrial personnel and attendance.
-- --------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS staff (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    pin TEXT NOT NULL,
    role TEXT CHECK(role IN ('operator', 'clerk', 'driver', 'manager')) DEFAULT 'operator',
    clock_status TEXT CHECK(clock_status IN ('in', 'out')) DEFAULT 'out',
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- --------------------------------------------------------------------------------
-- Table: gl_accounts (Chart of Accounts)
-- --------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gl_accounts (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    type TEXT CHECK(type IN ('Asset', 'Liability', 'Income', 'Expense', 'Equity')) NOT NULL,
    balance REAL DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- --------------------------------------------------------------------------------
-- Table: gl_entries (Double-entry Bookkeeping)
-- --------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gl_entries (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    transaction_id TEXT, -- References business transaction if applicable
    debit REAL DEFAULT 0.0,
    credit REAL DEFAULT 0.0,
    description TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES gl_accounts(id) ON DELETE CASCADE
);
-- --------------------------------------------------------------------------------
-- Seed Data: Initial Chart of Accounts
-- --------------------------------------------------------------------------------
INSERT OR IGNORE INTO gl_accounts (id, code, name, type) VALUES 
('acc-1000', '1000', 'Cash / Bank', 'Asset'),
('acc-2000', '2000', 'VAT Output (15%)', 'Liability'),
('acc-4000', '4000', 'Scrap Purchase Expense', 'Expense'),
('acc-5000', '5000', 'EPR Fee Liability', 'Liability');
-- --------------------------------------------------------------------------------
-- Triggers: Financial Integrity
-- --------------------------------------------------------------------------------
CREATE TRIGGER IF NOT EXISTS update_gl_balance_after_entry
AFTER INSERT ON gl_entries
FOR EACH ROW
BEGIN
    UPDATE gl_accounts 
    SET balance = balance + (NEW.debit - NEW.credit) 
    WHERE id = NEW.account_id;
END;
-- End of Enterprise Extensions