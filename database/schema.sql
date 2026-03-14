-- Dairy Flow Database Schema
-- PostgreSQL Database Setup

-- Create database (run this manually in psql)
-- CREATE DATABASE dairy_flow;

-- Connect to database
-- \c dairy_flow;

-- ==================== PRODUCTION TABLE ====================
CREATE TABLE IF NOT EXISTS production (
    id SERIAL PRIMARY KEY,
    buffalo_name VARCHAR(255) NOT NULL,
    buffalo_number INTEGER,
    am_liters DECIMAL(10, 2) DEFAULT 0.00,
    pm_liters DECIMAL(10, 2) DEFAULT 0.00,
    total_liters DECIMAL(10, 2) GENERATED ALWAYS AS (am_liters + pm_liters) STORED,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== SALES TABLE ====================
CREATE TABLE IF NOT EXISTS sales (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    liters_purchased DECIMAL(10, 2) NOT NULL,
    rpl DECIMAL(10, 2) NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    amount_due DECIMAL(10, 2) GENERATED ALWAYS AS (quantity * rpl) STORED,
    amount_paid DECIMAL(10, 2) DEFAULT 0.00,
    table_type VARCHAR(2) NOT NULL CHECK (table_type IN ('AM', 'PM')),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== PURCHASES TABLE ====================
CREATE TABLE IF NOT EXISTS purchases (
    id SERIAL PRIMARY KEY,
    item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('khalli', 'chunni', 'kutti', 'grass')),
    quantity DECIMAL(10, 2) NOT NULL,
    price_per_unit DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(10, 2) GENERATED ALWAYS AS (quantity * price_per_unit) STORED,
    mtd DECIMAL(10, 2) DEFAULT 0.00,
    gross_total DECIMAL(10, 2) GENERATED ALWAYS AS (total_amount + mtd) STORED,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== EXPENSES TABLE (Optimized for 5 years) ====================
CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    amount DECIMAL(12, 2) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== SALARIES TABLE ====================
CREATE TABLE IF NOT EXISTS salaries (
    id SERIAL PRIMARY KEY,
    employee_name VARCHAR(255) NOT NULL UNIQUE,
    total_amount DECIMAL(10, 2) NOT NULL,
    paid_amount DECIMAL(10, 2) DEFAULT 0.00,
    balance DECIMAL(10, 2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== BALANCE SHEET TABLE (Optimized for 5 years) ====================
-- Note: This table stores current balance per customer
-- For historical balance sheet data, use balance_sheet_history table
CREATE TABLE IF NOT EXISTS balance_sheet (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL UNIQUE,
    -- Total Litres
    litres_mtd DECIMAL(12, 2) DEFAULT 0.00,
    litres_today DECIMAL(12, 2) DEFAULT 0.00,
    litres_total DECIMAL(12, 2) GENERATED ALWAYS AS (litres_mtd + litres_today) STORED,
    -- Total Sales
    sales_mtd DECIMAL(12, 2) DEFAULT 0.00,
    sales_today DECIMAL(12, 2) DEFAULT 0.00,
    sales_total DECIMAL(12, 2) GENERATED ALWAYS AS (sales_mtd + sales_today) STORED,
    -- Total Paid in Cash
    cash_mtd DECIMAL(12, 2) DEFAULT 0.00,
    cash_today DECIMAL(12, 2) DEFAULT 0.00,
    cash_total DECIMAL(12, 2) GENERATED ALWAYS AS (cash_mtd + cash_today) STORED,
    -- Total Credit & Balance Due
    credit_today DECIMAL(12, 2) DEFAULT 0.00,
    credit_mtd DECIMAL(12, 2) DEFAULT 0.00,
    credit_total DECIMAL(12, 2) GENERATED ALWAYS AS (credit_today + credit_mtd) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== BALANCE SHEET HISTORY TABLE (For 5 years historical data) ====================
CREATE TABLE IF NOT EXISTS balance_sheet_history (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    -- Total Litres
    litres_mtd DECIMAL(12, 2) DEFAULT 0.00,
    litres_today DECIMAL(12, 2) DEFAULT 0.00,
    litres_total DECIMAL(12, 2) GENERATED ALWAYS AS (litres_mtd + litres_today) STORED,
    -- Total Sales
    sales_mtd DECIMAL(12, 2) DEFAULT 0.00,
    sales_today DECIMAL(12, 2) DEFAULT 0.00,
    sales_total DECIMAL(12, 2) GENERATED ALWAYS AS (sales_mtd + sales_today) STORED,
    -- Total Paid in Cash
    cash_mtd DECIMAL(12, 2) DEFAULT 0.00,
    cash_today DECIMAL(12, 2) DEFAULT 0.00,
    cash_total DECIMAL(12, 2) GENERATED ALWAYS AS (cash_mtd + cash_today) STORED,
    -- Total Credit & Balance Due
    credit_today DECIMAL(12, 2) DEFAULT 0.00,
    credit_mtd DECIMAL(12, 2) DEFAULT 0.00,
    credit_total DECIMAL(12, 2) GENERATED ALWAYS AS (credit_today + credit_mtd) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(customer_name, date)
);

-- ==================== SUMMARIES TABLE ====================
CREATE TABLE IF NOT EXISTS summaries (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    total_sales DECIMAL(12, 2) DEFAULT 0.00,
    total_expenses DECIMAL(12, 2) DEFAULT 0.00,
    total_purchases DECIMAL(12, 2) DEFAULT 0.00,
    total_salaries DECIMAL(12, 2) DEFAULT 0.00,
    net_profit DECIMAL(12, 2) GENERATED ALWAYS AS (total_sales - total_expenses - total_purchases - total_salaries) STORED,
    grand_total DECIMAL(12, 2) GENERATED ALWAYS AS (total_sales) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== DATA RETENTION ALERTS TABLE ====================
CREATE TABLE IF NOT EXISTS data_retention_alerts (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL UNIQUE,
    oldest_date DATE NOT NULL,
    retention_limit_years INTEGER DEFAULT 5,
    alert_status VARCHAR(20) DEFAULT 'active' CHECK (alert_status IN ('active', 'dismissed', 'resolved')),
    alert_type VARCHAR(20) DEFAULT 'warning' CHECK (alert_type IN ('warning', 'critical')),
    days_until_limit INTEGER,
    days_beyond_limit INTEGER,
    alert_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== INDEXES FOR PERFORMANCE (Optimized for 5 years of data) ====================
-- Date indexes for efficient date range queries
CREATE INDEX IF NOT EXISTS idx_production_date ON production(date DESC);
CREATE INDEX IF NOT EXISTS idx_production_date_range ON production(date) WHERE date >= CURRENT_DATE - INTERVAL '5 years';
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_date_range ON sales(date) WHERE date >= CURRENT_DATE - INTERVAL '5 years';
CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(date DESC);
CREATE INDEX IF NOT EXISTS idx_purchases_date_range ON purchases(date) WHERE date >= CURRENT_DATE - INTERVAL '5 years';
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_date_range ON expenses(date) WHERE date >= CURRENT_DATE - INTERVAL '5 years';
CREATE INDEX IF NOT EXISTS idx_summaries_date ON summaries(date DESC);
CREATE INDEX IF NOT EXISTS idx_summaries_date_range ON summaries(date) WHERE date >= CURRENT_DATE - INTERVAL '5 years';

-- Additional indexes for common queries
CREATE INDEX IF NOT EXISTS idx_balance_sheet_customer ON balance_sheet(customer_name);
CREATE INDEX IF NOT EXISTS idx_balance_sheet_history_date ON balance_sheet_history(date DESC);
CREATE INDEX IF NOT EXISTS idx_balance_sheet_history_date_range ON balance_sheet_history(date) WHERE date >= CURRENT_DATE - INTERVAL '5 years';
CREATE INDEX IF NOT EXISTS idx_balance_sheet_history_customer ON balance_sheet_history(customer_name);
CREATE INDEX IF NOT EXISTS idx_balance_sheet_history_customer_date ON balance_sheet_history(customer_name, date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_salaries_employee ON salaries(employee_name);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_name);
CREATE INDEX IF NOT EXISTS idx_data_retention_alerts_status ON data_retention_alerts(alert_status);

-- ==================== FUNCTION TO CHECK DATA RETENTION ====================
CREATE OR REPLACE FUNCTION check_data_retention()
RETURNS TABLE (
    table_name VARCHAR(100),
    oldest_date DATE,
    days_until_limit INTEGER,
    days_beyond_limit INTEGER,
    alert_message TEXT,
    alert_type VARCHAR(20)
) AS $$
DECLARE
    retention_limit DATE := CURRENT_DATE - INTERVAL '5 years';
    warning_threshold DATE := CURRENT_DATE - INTERVAL '5 years' + INTERVAL '30 days';
    oldest_prod_date DATE;
    oldest_sales_date DATE;
    oldest_purchases_date DATE;
    oldest_expenses_date DATE;
    oldest_balance_sheet_date DATE;
    oldest_summaries_date DATE;
    days_until INTEGER;
    days_beyond INTEGER;
BEGIN
    -- Check production table
    SELECT MIN(date) INTO oldest_prod_date FROM production;
    IF oldest_prod_date IS NOT NULL THEN
        IF oldest_prod_date < retention_limit THEN
            -- Already beyond 3 years (CRITICAL)
            table_name := 'production';
            oldest_date := oldest_prod_date;
            days_beyond_limit := EXTRACT(DAY FROM (retention_limit - oldest_prod_date))::INTEGER;
            days_until_limit := NULL;
            alert_type := 'critical';
            alert_message := format('⚠️ CRITICAL: Production data contains records older than 5 years. Oldest record: %s (%s days beyond limit). Please archive or delete old data.', 
                oldest_prod_date, days_beyond_limit);
            RETURN NEXT;
        ELSIF oldest_prod_date <= warning_threshold THEN
            -- Within 30 days of 5-year limit (WARNING)
            table_name := 'production';
            oldest_date := oldest_prod_date;
            days_until_limit := EXTRACT(DAY FROM (retention_limit - oldest_prod_date))::INTEGER;
            days_beyond_limit := NULL;
            alert_type := 'warning';
            alert_message := format('⚠️ WARNING: Production data will exceed 5-year limit in %s days. Oldest record: %s. Please prepare to archive old data.', 
                days_until_limit, oldest_prod_date);
            RETURN NEXT;
        END IF;
    END IF;

    -- Check sales table
    SELECT MIN(date) INTO oldest_sales_date FROM sales;
    IF oldest_sales_date IS NOT NULL THEN
        IF oldest_sales_date < retention_limit THEN
            table_name := 'sales';
            oldest_date := oldest_sales_date;
            days_beyond_limit := EXTRACT(DAY FROM (retention_limit - oldest_sales_date))::INTEGER;
            days_until_limit := NULL;
            alert_type := 'critical';
            alert_message := format('⚠️ CRITICAL: Sales data contains records older than 5 years. Oldest record: %s (%s days beyond limit). Please archive or delete old data.', 
                oldest_sales_date, days_beyond_limit);
            RETURN NEXT;
        ELSIF oldest_sales_date <= warning_threshold THEN
            table_name := 'sales';
            oldest_date := oldest_sales_date;
            days_until_limit := EXTRACT(DAY FROM (retention_limit - oldest_sales_date))::INTEGER;
            days_beyond_limit := NULL;
            alert_type := 'warning';
            alert_message := format('⚠️ WARNING: Sales data will exceed 5-year limit in %s days. Oldest record: %s. Please prepare to archive old data.', 
                days_until_limit, oldest_sales_date);
            RETURN NEXT;
        END IF;
    END IF;

    -- Check purchases table
    SELECT MIN(date) INTO oldest_purchases_date FROM purchases;
    IF oldest_purchases_date IS NOT NULL THEN
        IF oldest_purchases_date < retention_limit THEN
            table_name := 'purchases';
            oldest_date := oldest_purchases_date;
            days_beyond_limit := EXTRACT(DAY FROM (retention_limit - oldest_purchases_date))::INTEGER;
            days_until_limit := NULL;
            alert_type := 'critical';
            alert_message := format('⚠️ CRITICAL: Purchases data contains records older than 5 years. Oldest record: %s (%s days beyond limit). Please archive or delete old data.', 
                oldest_purchases_date, days_beyond_limit);
            RETURN NEXT;
        ELSIF oldest_purchases_date <= warning_threshold THEN
            table_name := 'purchases';
            oldest_date := oldest_purchases_date;
            days_until_limit := EXTRACT(DAY FROM (retention_limit - oldest_purchases_date))::INTEGER;
            days_beyond_limit := NULL;
            alert_type := 'warning';
            alert_message := format('⚠️ WARNING: Purchases data will exceed 5-year limit in %s days. Oldest record: %s. Please prepare to archive old data.', 
                days_until_limit, oldest_purchases_date);
            RETURN NEXT;
        END IF;
    END IF;

    -- Check expenses table
    SELECT MIN(date) INTO oldest_expenses_date FROM expenses;
    IF oldest_expenses_date IS NOT NULL THEN
        IF oldest_expenses_date < retention_limit THEN
            table_name := 'expenses';
            oldest_date := oldest_expenses_date;
            days_beyond_limit := EXTRACT(DAY FROM (retention_limit - oldest_expenses_date))::INTEGER;
            days_until_limit := NULL;
            alert_type := 'critical';
            alert_message := format('⚠️ CRITICAL: Expenses data contains records older than 5 years. Oldest record: %s (%s days beyond limit). Please archive or delete old data.', 
                oldest_expenses_date, days_beyond_limit);
            RETURN NEXT;
        ELSIF oldest_expenses_date <= warning_threshold THEN
            table_name := 'expenses';
            oldest_date := oldest_expenses_date;
            days_until_limit := EXTRACT(DAY FROM (retention_limit - oldest_expenses_date))::INTEGER;
            days_beyond_limit := NULL;
            alert_type := 'warning';
            alert_message := format('⚠️ WARNING: Expenses data will exceed 5-year limit in %s days. Oldest record: %s. Please prepare to archive old data.', 
                days_until_limit, oldest_expenses_date);
            RETURN NEXT;
        END IF;
    END IF;

    -- Check balance_sheet_history table
    SELECT MIN(date) INTO oldest_balance_sheet_date FROM balance_sheet_history;
    IF oldest_balance_sheet_date IS NOT NULL THEN
        IF oldest_balance_sheet_date < retention_limit THEN
            table_name := 'balance_sheet_history';
            oldest_date := oldest_balance_sheet_date;
            days_beyond_limit := EXTRACT(DAY FROM (retention_limit - oldest_balance_sheet_date))::INTEGER;
            days_until_limit := NULL;
            alert_type := 'critical';
            alert_message := format('⚠️ CRITICAL: Balance sheet history data contains records older than 5 years. Oldest record: %s (%s days beyond limit). Please archive or delete old data.', 
                oldest_balance_sheet_date, days_beyond_limit);
            RETURN NEXT;
        ELSIF oldest_balance_sheet_date <= warning_threshold THEN
            table_name := 'balance_sheet_history';
            oldest_date := oldest_balance_sheet_date;
            days_until_limit := EXTRACT(DAY FROM (retention_limit - oldest_balance_sheet_date))::INTEGER;
            days_beyond_limit := NULL;
            alert_type := 'warning';
            alert_message := format('⚠️ WARNING: Balance sheet history data will exceed 5-year limit in %s days. Oldest record: %s. Please prepare to archive old data.', 
                days_until_limit, oldest_balance_sheet_date);
            RETURN NEXT;
        END IF;
    END IF;

    -- Check summaries table
    SELECT MIN(date) INTO oldest_summaries_date FROM summaries;
    IF oldest_summaries_date IS NOT NULL THEN
        IF oldest_summaries_date < retention_limit THEN
            table_name := 'summaries';
            oldest_date := oldest_summaries_date;
            days_beyond_limit := EXTRACT(DAY FROM (retention_limit - oldest_summaries_date))::INTEGER;
            days_until_limit := NULL;
            alert_type := 'critical';
            alert_message := format('⚠️ CRITICAL: Summaries data contains records older than 5 years. Oldest record: %s (%s days beyond limit). Please archive or delete old data.', 
                oldest_summaries_date, days_beyond_limit);
            RETURN NEXT;
        ELSIF oldest_summaries_date <= warning_threshold THEN
            table_name := 'summaries';
            oldest_date := oldest_summaries_date;
            days_until_limit := EXTRACT(DAY FROM (retention_limit - oldest_summaries_date))::INTEGER;
            days_beyond_limit := NULL;
            alert_type := 'warning';
            alert_message := format('⚠️ WARNING: Summaries data will exceed 5-year limit in %s days. Oldest record: %s. Please prepare to archive old data.', 
                days_until_limit, oldest_summaries_date);
            RETURN NEXT;
        END IF;
    END IF;

    RETURN;
END;
$$ LANGUAGE plpgsql;

-- ==================== FUNCTION TO UPDATE ALERTS TABLE ====================
CREATE OR REPLACE FUNCTION update_data_retention_alerts()
RETURNS VOID AS $$
DECLARE
    alert_rec RECORD;
BEGIN
    -- Clear existing active alerts
    UPDATE data_retention_alerts SET alert_status = 'resolved' WHERE alert_status = 'active';
    
    -- Insert new alerts
    FOR alert_rec IN SELECT * FROM check_data_retention() LOOP
        INSERT INTO data_retention_alerts (table_name, oldest_date, alert_message, alert_status, alert_type, days_until_limit, days_beyond_limit)
        VALUES (alert_rec.table_name, alert_rec.oldest_date, alert_rec.alert_message, 'active', alert_rec.alert_type, alert_rec.days_until_limit, alert_rec.days_beyond_limit)
        ON CONFLICT (table_name) DO UPDATE SET
            oldest_date = EXCLUDED.oldest_date,
            alert_message = EXCLUDED.alert_message,
            alert_status = 'active',
            alert_type = EXCLUDED.alert_type,
            days_until_limit = EXCLUDED.days_until_limit,
            days_beyond_limit = EXCLUDED.days_beyond_limit,
            updated_at = CURRENT_TIMESTAMP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ==================== TRIGGERS FOR UPDATED_AT ====================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_production_updated_at BEFORE UPDATE ON production
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_salaries_updated_at BEFORE UPDATE ON salaries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_balance_sheet_updated_at BEFORE UPDATE ON balance_sheet
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_balance_sheet_history_updated_at BEFORE UPDATE ON balance_sheet_history
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_summaries_updated_at BEFORE UPDATE ON summaries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== TRIGGER TO CHECK RETENTION ON DATA INSERT ====================
CREATE OR REPLACE FUNCTION trigger_check_retention()
RETURNS TRIGGER AS $$
BEGIN
    -- Run retention check after insert (async check, won't block insert)
    PERFORM update_data_retention_alerts();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: We'll check retention via API calls rather than triggers to avoid performance issues
-- The triggers would slow down inserts significantly

