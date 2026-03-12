# Database Migration Guide

This guide explains how to update your existing database to support the new features including summaries table and data retention alerts.

## Prerequisites

- PostgreSQL database `dairy_flow` already exists
- You have access to psql or pgAdmin

## Migration Steps

### Option 1: Using psql Command Line

1. Connect to your database:
```bash
psql -U postgres -d dairy_flow
```

2. Run the updated schema:
```sql
\i database/schema.sql
```

### Option 2: Using pgAdmin

1. Open pgAdmin and connect to your PostgreSQL server
2. Right-click on the `dairy_flow` database
3. Select "Query Tool"
4. Open the file `backend/database/schema.sql`
5. Execute the entire script

### Option 3: Manual Migration (if you have existing data)

If you already have data and want to preserve it, run these commands:

```sql
-- Connect to database
\c dairy_flow;

-- Create summaries table
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

-- Create data retention alerts table
CREATE TABLE IF NOT EXISTS data_retention_alerts (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    oldest_date DATE NOT NULL,
    retention_limit_years INTEGER DEFAULT 3,
    alert_status VARCHAR(20) DEFAULT 'active' CHECK (alert_status IN ('active', 'dismissed', 'resolved')),
    alert_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add new indexes (these are safe to add even if they exist)
CREATE INDEX IF NOT EXISTS idx_summaries_date ON summaries(date DESC);
CREATE INDEX IF NOT EXISTS idx_summaries_date_range ON summaries(date) WHERE date >= CURRENT_DATE - INTERVAL '3 years';
CREATE INDEX IF NOT EXISTS idx_data_retention_alerts_status ON data_retention_alerts(alert_status);

-- Create functions (will replace if they exist)
-- Copy the functions from schema.sql: check_data_retention() and update_data_retention_alerts()

-- Create triggers (will replace if they exist)
-- Copy the trigger from schema.sql for summaries table
```

## Verifying the Migration

After running the migration, verify everything is set up correctly:

```sql
-- Check if summaries table exists
SELECT * FROM information_schema.tables WHERE table_name = 'summaries';

-- Check if data_retention_alerts table exists
SELECT * FROM information_schema.tables WHERE table_name = 'data_retention_alerts';

-- Test the retention check function
SELECT * FROM check_data_retention();

-- Check indexes
SELECT indexname, indexdef FROM pg_indexes WHERE tablename IN ('summaries', 'data_retention_alerts');
```

## Post-Migration

1. Restart your Flask backend server
2. Test the API endpoints:
   - `GET /api/summaries` - Should return empty array initially
   - `GET /api/alerts/retention` - Should return any active alerts
   - `POST /api/summaries/calculate` - Calculate today's summary

3. The frontend summaries page will now:
   - Load data from the database
   - Display alerts if data exceeds 3 years
   - Allow searching historical summaries

## Troubleshooting

### Error: "relation already exists"
- This means the table already exists. The `IF NOT EXISTS` clause should prevent this, but if it occurs, you can drop and recreate (WARNING: This will delete data):
  ```sql
  DROP TABLE IF EXISTS summaries CASCADE;
  DROP TABLE IF EXISTS data_retention_alerts CASCADE;
  ```
  Then re-run the schema.

### Error: "function already exists"
- The functions will be replaced by `CREATE OR REPLACE FUNCTION`. This is safe.

### Performance Issues
- The new indexes may take time to build on large tables
- Consider running `ANALYZE` after migration:
  ```sql
  ANALYZE production;
  ANALYZE sales;
  ANALYZE purchases;
  ANALYZE expenses;
  ANALYZE summaries;
  ```

## Data Retention Policy

The system is configured for a 3-year retention period. To change this:

1. Update the retention limit in the `check_data_retention()` function
2. Update the `retention_limit_years` default value in `data_retention_alerts` table
3. Update the index WHERE clauses to match the new retention period

Example to change to 2 years:
```sql
-- In check_data_retention() function, change:
retention_limit DATE := CURRENT_DATE - INTERVAL '2 years';
```

