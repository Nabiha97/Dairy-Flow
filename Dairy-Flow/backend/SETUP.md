# Backend Setup Guide

## Quick Start

### 1. Install PostgreSQL
Download from: https://www.postgresql.org/download/

### 2. Create Database
```bash
# Open PostgreSQL command line (psql)
psql -U postgres

# Create database
CREATE DATABASE dairy_flow;

# Exit psql
\q
```

### 3. Install Python Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 4. Create .env File
Create a file named `.env` in the `backend` folder with:

```
DB_HOST=localhost
DB_NAME=dairy_flow
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_PORT=5432
```

Replace `your_postgres_password` with your actual PostgreSQL password.

### 5. Initialize Database
```bash
# Windows (PowerShell)
psql -U postgres -d dairy_flow -f database\schema.sql

# Linux/Mac
psql -U postgres -d dairy_flow -f database/schema.sql
```

Or manually in psql:
```sql
\c dairy_flow
\i database/schema.sql
```

### 6. Run the Server
```bash
python app.py
```

Server will run at: `http://localhost:5000`

## Testing the API

### Health Check
```bash
curl http://localhost:5000/api/health
```

### Test Production Endpoint
```bash
curl -X POST http://localhost:5000/api/production \
  -H "Content-Type: application/json" \
  -d '[{"buffaloNumber": 1, "am": 5.5, "pm": 6.2, "total": 11.7}]'
```

## Troubleshooting

### Database Connection Error
- Check PostgreSQL is running
- Verify database credentials in `.env`
- Ensure database `dairy_flow` exists

### Port Already in Use
Change port in `app.py`:
```python
app.run(debug=True, host='0.0.0.0', port=5001)
```

### CORS Issues
CORS is already enabled in the code. If issues persist, check browser console.

