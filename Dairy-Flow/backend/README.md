# Dairy Flow Backend API

Python Flask backend with PostgreSQL database for Dairy Flow management system.

## Setup Instructions

### 1. Install PostgreSQL

Download and install PostgreSQL from: https://www.postgresql.org/download/

### 2. Create Database

Open PostgreSQL command line (psql) and run:

```sql
CREATE DATABASE dairy_flow;
```

### 3. Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 4. Configure Database

Copy `.env.example` to `.env` and update with your database credentials:

```bash
cp .env.example .env
```

Edit `.env` file:
```
DB_HOST=localhost
DB_NAME=dairy_flow
DB_USER=postgres
DB_PASSWORD=your_password
DB_PORT=5432
```

### 5. Initialize Database Schema

Run the SQL schema file:

```bash
psql -U postgres -d dairy_flow -f database/schema.sql
```

Or in psql:
```sql
\c dairy_flow
\i database/schema.sql
```

### 6. Run the Server

```bash
python app.py
```

The API will be available at: `http://localhost:5000`

## API Endpoints

### Production
- `GET /api/production` - Get all production records
- `POST /api/production` - Save production data

### Sales
- `GET /api/sales` - Get all sales records
- `POST /api/sales` - Save sales data

### Purchases
- `GET /api/purchases` - Get all purchase records
- `POST /api/purchases` - Save purchase data

### Expenses
- `GET /api/expenses` - Get all expense records
- `POST /api/expenses` - Save expense data
- `DELETE /api/expenses/<id>` - Delete expense record

### Salaries
- `GET /api/salaries` - Get all salary records
- `POST /api/salaries` - Save salary data (bulk)
- `DELETE /api/salaries/<id>` - Delete salary record

### Balance Sheet
- `GET /api/balance-sheet` - Get all balance sheet records
- `POST /api/balance-sheet` - Save balance sheet data (bulk)
- `DELETE /api/balance-sheet/<id>` - Delete balance sheet record

### Balance Sheet History
- `GET /api/balance-sheet-history` - Get balance sheet history (optional: `?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD&customer_name=NAME`)
- `POST /api/balance-sheet-history` - Save balance sheet history for a specific date
- `POST /api/balance-sheet-history/save-today` - Automatically save today's balance sheet to history

### Summaries
- `GET /api/summaries` - Get all summary records (optional: `?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD`)
- `GET /api/summaries/<date>` - Get summary for a specific date
- `POST /api/summaries` - Save or update summary data
- `POST /api/summaries/calculate` - Calculate summary for a date from all related tables

### Data Retention Alerts
- `GET /api/alerts/retention` - Get all active data retention alerts
- `POST /api/alerts/retention/check` - Manually trigger data retention check
- `PUT /api/alerts/retention/<id>` - Update alert status (dismiss/resolve)
- `GET /api/alerts/retention/stats` - Get statistics about data retention across all tables

### Health Check
- `GET /api/health` - Check API and database connection status

## Data Retention System

The database is optimized to handle 3 years of data efficiently. The system includes:

1. **Automatic Alert System**: Monitors all tables (production, sales, purchases, expenses, summaries) and alerts when data exceeds 3 years
2. **Performance Optimization**: Indexes are optimized for date-based queries within the 3-year retention period
3. **Alert Management**: Alerts can be viewed, dismissed, or resolved through the API

### Alert Features:
- Automatic detection when data goes beyond 3 years
- Alerts displayed in the frontend summaries page
- Statistics endpoint to view data retention status across all tables
- Manual trigger option for on-demand checks

## Example API Usage

### Save Production Data
```bash
curl -X POST http://localhost:5000/api/production \
  -H "Content-Type: application/json" \
  -d '[{"buffaloNumber": 1, "am": 5.5, "pm": 6.2, "total": 11.7}]'
```

### Get All Salaries
```bash
curl http://localhost:5000/api/salaries
```

## Frontend Integration

Update your frontend JavaScript files to use these API endpoints instead of localStorage.

