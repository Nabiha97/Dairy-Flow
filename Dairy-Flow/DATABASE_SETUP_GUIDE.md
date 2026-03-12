# Database Setup Guide - Dairy Flow System

## Overview
This guide will help you set up a fresh PostgreSQL database with a 5-year data retention limit and alert system for the Dairy Flow management system.

## Prerequisites
1. PostgreSQL installed and running
2. Python 3.7+ installed
3. Access to PostgreSQL command line (psql) or pgAdmin

## Step 1: Reset Database (Fresh Start)

### Option A: Using the Reset Script (Windows)
1. Open Command Prompt or PowerShell
2. Navigate to the `backend` folder:
   ```bash
   cd Dairy-Flow\backend
   ```
3. Run the reset script:
   ```bash
   reset_database.bat
   ```
4. Follow the prompts. The script will:
   - Drop the existing `dairy_flow` database (if it exists)
   - Create a new `dairy_flow` database
   - Initialize all tables with the 5-year retention schema

### Option B: Manual Setup (All Platforms)
1. Open PostgreSQL command line (psql):
   ```bash
   psql -U postgres
   ```
2. Drop existing database (if it exists):
   ```sql
   DROP DATABASE IF EXISTS dairy_flow;
   ```
3. Create new database:
   ```sql
   CREATE DATABASE dairy_flow;
   ```
4. Exit psql:
   ```sql
   \q
   ```
5. Initialize schema:
   ```bash
   psql -U postgres -d dairy_flow -f database/schema.sql
   ```

## Step 2: Configure Database Connection

1. Navigate to the `backend` folder
2. Create or update the `.env` file:
   ```
   DB_HOST=localhost
   DB_NAME=dairy_flow
   DB_USER=postgres
   DB_PASSWORD=your_postgres_password
   DB_PORT=5432
   ```
   Replace `your_postgres_password` with your actual PostgreSQL password.

## Step 3: Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

Required packages:
- flask
- flask-cors
- psycopg2
- python-dotenv

## Step 4: Start the Backend Server

```bash
python app.py
```

The server will run at `http://localhost:5000`

## Step 5: Verify Setup

1. Test the health endpoint:
   ```bash
   curl http://localhost:5000/api/health
   ```
   Should return: `{"status": "healthy", "database": "connected"}`

2. Check data retention alerts:
   ```bash
   curl http://localhost:5000/api/alerts/retention
   ```

## Database Structure

The system includes 7 main tables:

1. **production** - Buffalo milk production records
2. **sales** - Customer sales records (AM/PM)
3. **purchases** - Purchase records (khalli, chunni, kutti, grass)
4. **expenses** - Expense records
5. **salaries** - Employee salary records
6. **balance_sheet** - Current balance sheet data
7. **summaries** - Daily summary records

## Data Retention System

### 5-Year Retention Limit
- All tables are configured to retain data for **5 years**
- Data older than 5 years will trigger alerts

### Alert System
The system automatically monitors data retention and provides alerts:

- **Warning Alerts**: Triggered 30 days before data reaches the 5-year limit
- **Critical Alerts**: Triggered when data exceeds the 5-year limit

### Checking Alerts
- API Endpoint: `GET /api/alerts/retention`
- Frontend: Alerts are automatically displayed when you load any page (if `utils/api-utils.js` is included)

### Alert Management
- View alerts: `GET /api/alerts/retention`
- Update alert status: `PUT /api/alerts/retention/<alert_id>`
- Check retention stats: `GET /api/alerts/retention/stats`

## Frontend Integration

All frontend pages are now connected to the database:

1. **Sales** (`sales/index.html`) - ✅ Connected
2. **Production** - Update script.js to use API
3. **Purchase** - Update script.js to use API
4. **Expenses** - Update script.js to use API
5. **Salaries** - Update script.js to use API
6. **Balance Sheet** - Update script.js to use API
7. **Summaries** - Update script.js to use API

### API Base URL
All frontend pages use: `http://localhost:5000/api`

### Adding Alert Notifications
Include the alert utility in your HTML:
```html
<script src="../utils/api-utils.js"></script>
```

## Features

### ✅ Implemented
- 5-year data retention limit
- Automatic alert system
- Database reset script
- Sales page fully connected to database
- Export to Excel/PDF functionality
- Edit mode functionality
- Search functionality

### 🔄 In Progress
- Production page database connection
- Purchase page database connection
- Expenses page database connection
- Salaries page database connection
- Balance Sheet page database connection
- Summaries page database connection

## Troubleshooting

### Database Connection Error
- Ensure PostgreSQL is running
- Check `.env` file credentials
- Verify database `dairy_flow` exists

### Port Already in Use
Change port in `app.py`:
```python
app.run(debug=True, host='0.0.0.0', port=5001)
```

### CORS Issues
CORS is enabled by default. If issues persist:
- Check browser console for errors
- Verify backend server is running
- Ensure API_BASE_URL matches backend port

## Support

For issues or questions, check:
- `backend/README.md` - Backend documentation
- `backend/SETUP.md` - Setup instructions
- `backend/DATABASE_MIGRATION.md` - Migration guide
