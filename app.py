from unittest import result
from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
from numpy import record
from flask import make_response 
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta
from flask import send_from_directory
def parse_date(date_str):
    if date_str:
        return datetime.strptime(date_str, "%Y-%m-%d").date()
    return datetime.now().date()
import os
from dotenv import load_dotenv

load_dotenv()
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
app = Flask(__name__)
@app.after_request
def add_ngrok_header(response):
    response.headers['ngrok-skip-browser-warning'] = 'true'
    return response
from flask_cors import CORS
CORS(app)

# Database configuration
# Database configuration
DATABASE_URL = os.environ.get('DATABASE_URL')

def get_db_connection():
    """Create and return a database connection"""
    try:
        if DATABASE_URL:
            conn = psycopg2.connect(DATABASE_URL, sslmode='require')
        else:
            conn = psycopg2.connect(
                host=os.getenv('DB_HOST', 'localhost'),
                database=os.getenv('DB_NAME', 'dairy_management'),
                user=os.getenv('DB_USER', 'postgres'),
                password=os.getenv('DB_PASSWORD', 'postgres'),
                port=os.getenv('DB_PORT', '5432')
            )
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        return None
@app.route('/test-db')
def test_db():
    try:
        conn = get_db_connection()
        conn.close()
        return "Database connected successfully!"
    except Exception as e:
        return f"Database connection failed: {str(e)}"
# def get_db_connection():
#     """Create and return a database connection"""
#     try:
#         conn = psycopg2.connect(**DB_CONFIG)
    #     return conn
    # except Exception as e:
    #     print(f"Error connecting to database: {e}")
    #     return None

# ==================== PRODUCTION ENDPOINTS ====================

@app.route('/api/production', methods=['GET'])
def get_production():
    """Get all production records"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        # Get optional filters
        year = request.args.get('year')
        month = request.args.get('month')
        date = request.args.get('date')
        buffalo_name = request.args.get('buffalo_name')
        
        query = "SELECT * FROM production WHERE 1=1"  # No date filter!

        params = []
        
        if year:
            query += " AND EXTRACT(YEAR FROM date) = %s"
            params.append(int(year))
        if month:
            query += " AND EXTRACT(MONTH FROM date) = %s"
            params.append(int(month))
        if date:
            query += " AND date = %s"  # Full date match
            params.append(date)  # Full date string "2026-03-06"

        if buffalo_name:
            query += " AND buffalo_name ILIKE %s"
            params.append(f'%{buffalo_name}%')
        
        query += " ORDER BY date DESC"
        
        cur.execute(query, params)
        records = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify([dict(record) for record in records]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/production', methods=['POST'])
def save_production():
    """Save production data to PostgreSQL"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    cur = None
    try:
        data = request.json
        cur = conn.cursor()

        # Ensure we have a list of records
        records = data.get('buffaloes') if 'buffaloes' in data else [data]
        date_str = data.get('date') or datetime.now().strftime("%Y-%m-%d")
        date_obj = datetime.strptime(date_str, "%Y-%m-%d").date()

        for record in records:
            buffalo_name = record.get('name') or record.get('buffalo_name', '')
            
            # Optional: extract buffalo number from name (e.g., "Buffalo 3" → 3)
            import re
            buffalo_number = None
            if buffalo_name:
                match = re.search(r'\d+', buffalo_name)
                if match:
                    buffalo_number = int(match.group())

            am_liters = float(
    record.get('am') or 
    record.get('amLiters') or 
    record.get('am_liters') or 0
)
            pm_liters = float(
    record.get('pm') or 
    record.get('pmLiters') or 
    record.get('pm_liters') or 0
)

            cur.execute("""
                INSERT INTO production (buffalo_name, buffalo_number, am_liters, pm_liters, date)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id
            """, (
                buffalo_name,
                buffalo_number,
                am_liters,
                pm_liters,
                date_obj
            ))

        conn.commit()
        cur.close()
        conn.close()
        return jsonify({'message': 'Production data saved successfully'}), 201

    except Exception as e:
        print("❌ ERROR:", e)
        if conn:
            conn.rollback()
        if cur:
            cur.close()
        if conn:
            conn.close()
        return jsonify({'error': str(e)}), 500
@app.route('/api/production/set-avg', methods=['POST'])
def set_avg():
    data = request.get_json()
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        UPDATE production SET avg_milk = %s 
        WHERE buffalo_name = %s
    """, (data['avg'], data['buffalo_name']))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"success": True})
@app.route('/api/production/get-avg', methods=['GET'])
def get_avg():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT buffalo_name, MAX(avg_milk) as avg_milk 
        FROM production 
        GROUP BY buffalo_name
    """)
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify([{
        "buffalo_name": r[0], 
        "avg_milk": float(r[1]) if r[1] else 0
    } for r in rows])
@app.route('/api/production/<int:production_id>', methods=['PUT', 'DELETE'])
def update_or_delete_production(production_id):
    """Update or delete a production record"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    cur = None
    try:
        cur = conn.cursor()
        
        if request.method == 'PUT':
            data = request.json
            # ✅ FIXED: Handle customerName too
            buffalo_name = (data.get('customerName') or 
                           data.get('buffaloName') or 
                           data.get('buffalo_name', ''))
            
            buffalo_number = None
            if buffalo_name:
                import re
                match = re.search(r'\d+', buffalo_name)
                if match:
                    buffalo_number = int(match.group())
            
            cur.execute("""
                UPDATE production 
                SET buffalo_name = %s, buffalo_number = %s, am_liters = %s, pm_liters = %s, date = %s, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """, (
                buffalo_name,
                buffalo_number,
                data.get('am') or data.get('amLiters', 0),
                data.get('pm') or data.get('pmLiters', 0),
                data.get('date'),
                production_id
            ))
            conn.commit()
            cur.close()
            conn.close()
            return jsonify({'message': 'Production record updated successfully'}), 200
        else:  # DELETE
            cur.execute("DELETE FROM production WHERE id = %s", (production_id,))
            conn.commit()
            cur.close()
            conn.close()
            return jsonify({'message': 'Production record deleted successfully'}), 200
            
    except Exception as e:
        print("❌ UPDATE/DELETE ERROR:", str(e))
        if conn:
            conn.rollback()
        if cur:
            cur.close()
        if conn:
            conn.close()
        return jsonify({'error': str(e)}), 500

# ==================== SALES ENDPOINTS ====================

@app.route('/api/sales', methods=['GET'])
def get_sales():
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        table_type = request.args.get('table_type', '').upper()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        if table_type in ['AM', 'PM']:
            cur.execute("""
                SELECT * FROM sales 
                WHERE UPPER(table_type) = %s 
                ORDER BY date DESC, id ASC
            """, (table_type,))
        else:
            cur.execute("SELECT * FROM sales ORDER BY date DESC, id ASC")
            
        records = cur.fetchall()
        result = []
        
        for record in records:          # ✅ indented properly
           # REPLACE WITH:
            result.append({
            'id': record['id'],
            'customer_name': record['customer_name'] or 'Unknown Customer',
            'liters_purchased': float(record['am_quantity'] or 0) + float(record['pm_quantity'] or 0),
            'am_quantity': float(record['am_quantity'] or 0),
            'pm_quantity': float(record['pm_quantity'] or 0),
            'rpl': float(record['price_per_liter'] or 0),
            'table_type': (record['table_type'] or 'AM').upper(),
            'date': str(record['date']),
            'total_amount': float(record['total_amount'] or 0),
            'paid_amount': float(record['paid_amount'] or 0),
            'balance': float(record['balance'] or 0)
})
        
        cur.close()
        conn.close()
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500



@app.route('/api/sales', methods=['POST'])
def save_sales():
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    cur = None
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        cur = conn.cursor()
        
        customer_name = data.get('customerName') or data.get('customer_name') or 'Unknown'
        if not customer_name.strip():
            return jsonify({'error': 'customerName is required'}), 400
        
        price_per_liter = float(data.get('rpl') or data.get('pricePerLiter') or 0)
        liters_purchased = float(data.get('litersPurchased') or data.get('liters') or 0)
        am_quantity = float(data.get('am_quantity') or data.get('amQuantity') or 0)
        pm_quantity = float(data.get('pm_quantity') or data.get('pmQuantity') or 0)
        table_type = data.get('table_type', 'AM').upper()
        total_amount = float(data.get('amountDue') or data.get('totalAmount') or ((am_quantity + pm_quantity) * price_per_liter))
        paid_amount = float(data.get('amountPaid') or data.get('amount_paid') or 0)
        balance = max(0, total_amount - paid_amount)
        
        sale_date = parse_date(data.get('date'))
        
        print(f"Saving sale: {customer_name}, type={table_type}, AM={am_quantity}, PM={pm_quantity}, ₹{total_amount}")
        
        cur.execute("""
            INSERT INTO sales 
            (customer_name, price_per_liter, total_amount, paid_amount, balance, date, table_type, am_quantity, pm_quantity)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (customer_name.strip(), price_per_liter, total_amount, paid_amount, balance, sale_date, table_type, am_quantity, pm_quantity))
        
        record_id = cur.fetchone()[0]
        conn.commit()
        
        return jsonify({
            'message': 'Sales data saved successfully', 
            'id': record_id,
            'data': {
                'customer': customer_name,
                'total': total_amount,
                'paid': paid_amount,
                'balance': balance
            }
        }), 201
        
    except ValueError as ve:
        print(f"ValueError: {ve}")
        return jsonify({'error': 'Invalid numeric data (check liters/rpl/amounts)'}), 400
    except KeyError as ke:
        print(f"KeyError: {ke}")
        return jsonify({'error': f'Missing required field: {str(ke)}'}), 400
    except Exception as e:
        print(f"Sales save error: {str(e)}")
        if conn:
            conn.rollback()
        return jsonify({'error': 'Failed to save sales data'}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@app.route('/api/sales/<int:sale_id>', methods=['PUT', 'DELETE'])
def update_or_delete_sale(sale_id):
    """Update or delete a sales record"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    cur = None
    try:
        cur = conn.cursor()

        if request.method == 'PUT':
            data = request.json

            # ✅ Recalculate amount_due correctly
            quantity = float(data.get('quantity', 0))
            rpl = float(data.get('rpl', 0))
            amount_due = quantity * rpl

            cur.execute("""
                UPDATE sales 
                SET customer_name = %s, 
                    liters_purchased = %s, 
                    rpl = %s, 
                    quantity = %s, 
                    amount_due = %s,
                    amount_paid = %s, 
                    table_type = %s, 
                    date = %s, 
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """, (
                data.get('customerName'),
                data.get('litersPurchased'),
                rpl,
                quantity,
                amount_due,
                data.get('amountPaid', 0),
                data.get('tableType', 'AM'),
                data.get('date'),
                sale_id
            ))

            conn.commit()
            return jsonify({'message': 'Sales record updated successfully'}), 200

        else:  # DELETE
            cur.execute("DELETE FROM sales WHERE id = %s", (sale_id,))
            conn.commit()
            return jsonify({'message': 'Sales record deleted successfully'}), 200

    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({'error': str(e)}), 500

    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()
# ==================== PURCHASES ENDPOINTS ====================

@app.route('/api/purchases', methods=['GET'])
def get_purchases():
    """Get all purchase records with optional filters"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        # Get optional filters
        date_filter = request.args.get('date')
        
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        if date_filter:
            cur.execute("SELECT * FROM purchases WHERE date = %s ORDER BY id ASC", (date_filter,))
        else:
            cur.execute("SELECT * FROM purchases ORDER BY date DESC, id ASC")
        
        records = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify([dict(record) for record in records]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/purchases', methods=['POST'])
def save_purchases():
    """Save purchase data - MATCHES YOUR DATABASE"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        data = request.json
        cur = conn.cursor()
        
        # Handle single record or array
        records = data if isinstance(data, list) else [data]
        saved_ids = []
        
        for record in records:
            # ✅ MATCH YOUR ACTUAL DATABASE COLUMNS
            supplier_name = record.get('supplier_name') or record.get('supplierName') or 'Unknown'
            quantity = float(record.get('quantity', 0))
            price = float(record.get('price', 0))
            total_amount = quantity * price
            mtd_amount = float(record.get('mtd_amount', 0))
            paid_amount = float(record.get('paid_amount', 0))
            date = parse_date(record.get('date'))
            
            cur.execute("""
                INSERT INTO purchases (supplier_name, quantity, price, total_amount, mtd_amount, paid_amount, date)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (supplier_name, quantity, price, total_amount, mtd_amount, paid_amount, date))
            
            saved_ids.append(cur.fetchone()[0])
        
        conn.commit()
        cur.close()
        conn.close()
        
        if len(saved_ids) == 1:
            return jsonify({'message': 'Purchase saved successfully', 'id': saved_ids[0]}), 201
        else:
            return jsonify({'message': 'Purchases saved successfully', 'ids': saved_ids}), 201
            
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/purchases/<int:purchase_id>', methods=['PUT', 'DELETE'])
def update_or_delete_purchase(purchase_id):
    """Update or delete a purchase record"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cur = conn.cursor()
        
        if request.method == 'PUT':
            data = request.json
            quantity = float(data.get('quantity', 0))
            price = float(data.get('price', 0))
            total_amount = quantity * price
            cur.execute("""
                UPDATE purchases 
                SET supplier_name = %s, quantity = %s, price = %s, 
                    total_amount = %s, mtd_amount = %s, paid_amount = %s, date = %s
                WHERE id = %s
            """, (
                data.get('supplier_name'),
                quantity,
                price,
                total_amount,
                float(data.get('mtd_amount', 0)),
                float(data.get('paid_amount', 0)),
                data.get('date'),
                purchase_id
            ))
            conn.commit()
            cur.close()
            conn.close()
            return jsonify({'message': 'Purchase record updated successfully'}), 200
        
        else:  # DELETE
            cur.execute("DELETE FROM purchases WHERE id = %s", (purchase_id,))
            conn.commit()
            cur.close()
            conn.close()
            return jsonify({'message': 'Purchase record deleted successfully'}), 200

    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({'error': str(e)}), 500

# ==================== EXPENSES ENDPOINTS ====================

@app.route('/api/expenses', methods=['GET'])
def get_expenses():
    """Get all expense records"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT * FROM expenses ORDER BY date DESC, id ASC")
        records = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify([dict(record) for record in records]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/expenses', methods=['POST'])
def save_expenses():
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    cur = None
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400

        cur = conn.cursor()

        description = data.get('description') or data.get('expenses') or ''
        if not description.strip():
            return jsonify({'error': 'description is required'}), 400

        total        = float(data.get('total') or data.get('amount') or 0)
        mtd          = float(data.get('mtd') or 0)
        grand_total  = float(data.get('grand_total') or data.get('grandTotal') or (total + mtd))
        expense_date = parse_date(data.get('date'))

        cur.execute("""
            INSERT INTO expenses (description, amount, date, total, mtd, grand_total)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (description.strip(), total, expense_date, total, mtd, grand_total))

        record_id = cur.fetchone()[0]
        conn.commit()

        return jsonify({
            'message': 'Expense saved successfully',
            'id': record_id
        }), 201

    except Exception as e:
        print(f"❌ Expense save error: {str(e)}")
        if conn:
            conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if cur:
            cur.close()   # ✅ only cleanup here, NO return!
        if conn:
            conn.close()

@app.route('/api/expenses/<int:expense_id>', methods=['PUT', 'DELETE'])
def update_or_delete_expense(expense_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    cur = None
    try:
        cur = conn.cursor()

        if request.method == 'PUT':
            data = request.json
            print(f"📥 PUT data received: {data}")  # ✅ debug log

            description = data.get('description') or data.get('expenses') or ''
            total       = float(data.get('total') or data.get('amount') or 0)
            mtd         = float(data.get('mtd') or 0)
            grand_total = float(data.get('grand_total') or data.get('grandTotal') or (total + mtd))
            date        = data.get('date')

            print(f"📝 Updating expense {expense_id}: {description}, {total}, {date}")  # ✅ debug

            cur.execute("""
                UPDATE expenses 
                SET description = %s,
                    amount      = %s,
                    total       = %s,
                    mtd         = %s,
                    grand_total = %s,
                    date        = %s
                WHERE id = %s
                RETURNING id
            """, (description, total, total, mtd, grand_total, date, expense_id))

            updated = cur.fetchone()
            if not updated:
                return jsonify({'error': f'Expense {expense_id} not found'}), 404

            conn.commit()
            return jsonify({'message': 'Expense updated successfully', 'id': expense_id}), 200

        else:  # DELETE
            cur.execute("DELETE FROM expenses WHERE id = %s RETURNING id", (expense_id,))
            deleted = cur.fetchone()
            if not deleted:
                return jsonify({'error': f'Expense {expense_id} not found'}), 404
            conn.commit()
            return jsonify({'message': 'Expense deleted successfully'}), 200

    except Exception as e:
        print(f"❌ Expense PUT/DELETE error: {str(e)}")  # ✅ shows exact error
        if conn:
            conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()
# ==================== SALARIES ENDPOINTS ====================

@app.route('/api/salaries', methods=['GET'])
def get_salaries():
    """Get all salary records"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT * FROM salaries ORDER BY employee_name ASC")
        records = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify([dict(record) for record in records]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/salaries', methods=['POST'])
def save_salaries():
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    cur = None
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        employees = data.get('employees', [])
        if not employees:
            return jsonify({'error': 'No employees provided'}), 400

        cur = conn.cursor()

        for employee in employees:
            # ✅ Safe field extraction with fallbacks
            name   = employee.get('name') or employee.get('employee_name', '').strip()
            amount = float(employee.get('amount') or employee.get('total_amount') or 0)
            paid   = float(employee.get('paid') or employee.get('paid_amount') or 0)
            balance = amount - paid
            salary_date = employee.get('date') or str(datetime.now().date())

            if not name:
                continue  # ✅ skip empty names instead of crashing

            print(f"💾 Saving salary: {name}, amount={amount}, paid={paid}, date={salary_date}")

            # Check if employee already exists
            cur.execute("SELECT id FROM salaries WHERE employee_name = %s", (name,))
            existing = cur.fetchone()

            if existing:
                cur.execute("""
                    UPDATE salaries
                    SET total_amount = %s,
                        paid_amount  = %s,
                        balance      = %s,
                        date         = %s,
                        updated_at   = CURRENT_TIMESTAMP
                    WHERE employee_name = %s
                """, (amount, paid, balance, salary_date, name))
            else:
                cur.execute("""
                    INSERT INTO salaries (employee_name, total_amount, paid_amount, balance, date)
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING id
                """, (name, amount, paid, balance, salary_date))

        conn.commit()
        return jsonify({'message': 'Salaries saved successfully'}), 201

    except Exception as e:
        print(f"❌ Salary save error: {str(e)}")
        if conn:
            conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()
@app.route('/api/salaries/<int:salary_id>', methods=['PUT', 'DELETE'])
def update_or_delete_salary(salary_id):
    """Update or delete a salary record"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cur = conn.cursor()
        
        if request.method == 'PUT':
            data = request.json

            total = float(data.get('totalAmount', 0))
            paid = float(data.get('paidAmount', 0))
            balance = total - paid

            # Get date from frontend or use today's date
            salary_date = data.get('date') or datetime.now().date()

            cur.execute("""
                UPDATE salaries 
                SET employee_name = %s, 
                    total_amount = %s, 
                    paid_amount = %s,
                    balance = %s,
                    date = %s,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """, (
                data.get('employeeName'),
                total,
                paid,
                balance,
                salary_date,
                salary_id
            ))

            conn.commit()
            cur.close()
            conn.close()

            return jsonify({
                'message': 'Salary updated successfully',
                'balance': balance
            }), 200

        else:  # DELETE
            cur.execute("DELETE FROM salaries WHERE id = %s", (salary_id,))
            conn.commit()
            cur.close()
            conn.close()

            return jsonify({'message': 'Salary record deleted successfully'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== BALANCE SHEET ENDPOINTS ====================

@app.route('/api/balance-sheet', methods=['GET'])
def get_balance_sheet():
    """Get all balance sheet records"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT * FROM balance_sheet ORDER BY customer_name ASC")
        records = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify([dict(record) for record in records]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/balance-sheet', methods=['POST'])
def save_balance_sheet():
    """Save balance sheet data (bulk update)"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        data = request.json
        customers = data.get('customers', [])
        cur = conn.cursor()
        
        for customer in customers:
            # Check if customer exists
            cur.execute("SELECT id FROM balance_sheet WHERE customer_name = %s", (customer['customerName'],))
            existing = cur.fetchone()
            
            if existing:
                # Update existing
                cur.execute("""
                    UPDATE balance_sheet 
                    SET litres_mtd = %s, litres_today = %s, litres_total = %s,
                        sales_mtd = %s, sales_today = %s, sales_total = %s,
                        cash_mtd = %s, cash_today = %s, cash_total = %s,
                        credit_today = %s, credit_mtd = %s, credit_total = %s
                    WHERE customer_name = %s
                """, (
                    customer['litres']['mtd'],
                    customer['litres']['today'],
                    customer['litres']['mtd'] + customer['litres']['today'],
                    customer['sales']['mtd'],
                    customer['sales']['today'],
                    customer['sales']['mtd'] + customer['sales']['today'],
                    customer['paidCash']['mtd'],
                    customer['paidCash']['today'],
                    customer['paidCash']['mtd'] + customer['paidCash']['today'],
                    customer['credit']['today'],
                    customer['credit']['mtd'],
                    customer['credit']['today'] + customer['credit']['mtd'],
                    customer['customerName']
                ))
            else:
                # Insert new
                cur.execute("""
                    INSERT INTO balance_sheet 
                    (customer_name, litres_mtd, litres_today, litres_total,
                     sales_mtd, sales_today, sales_total,
                     cash_mtd, cash_today, cash_total,
                     credit_today, credit_mtd, credit_total)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    customer['customerName'],
                    customer['litres']['mtd'],
                    customer['litres']['today'],
                    customer['litres']['mtd'] + customer['litres']['today'],
                    customer['sales']['mtd'],
                    customer['sales']['today'],
                    customer['sales']['mtd'] + customer['sales']['today'],
                    customer['paidCash']['mtd'],
                    customer['paidCash']['today'],
                    customer['paidCash']['mtd'] + customer['paidCash']['today'],
                    customer['credit']['today'],
                    customer['credit']['mtd'],
                    customer['credit']['today'] + customer['credit']['mtd']
                ))
        
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({'message': 'Balance sheet data saved successfully'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/balance-sheet/<int:customer_id>', methods=['PUT', 'DELETE'])
def update_or_delete_balance_sheet(customer_id):
    """Update or delete a balance sheet record"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cur = conn.cursor()
        
        if request.method == 'PUT':
            data = request.json
            cur.execute("""
                UPDATE balance_sheet 
                SET customer_name = %s, litres_mtd = %s, litres_today = %s,
                    sales_mtd = %s, sales_today = %s,
                    cash_mtd = %s, cash_today = %s,
                    credit_today = %s, credit_mtd = %s,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """, (
                data.get('customerName'),
                data.get('litresMTD'),
                data.get('litresToday'),
                data.get('salesMTD'),
                data.get('salesToday'),
                data.get('paidMTD'),
                data.get('paidToday'),
                data.get('creditToday'),
                data.get('creditMTD'),
                customer_id
            ))
            conn.commit()
            cur.close()
            conn.close()
            return jsonify({'message': 'Balance sheet record updated successfully'}), 200
        else:  # DELETE
            cur.execute("DELETE FROM balance_sheet WHERE id = %s", (customer_id,))
            conn.commit()
            cur.close()
            conn.close()
            return jsonify({'message': 'Balance sheet record deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== BALANCE SHEET HISTORY ENDPOINTS ====================

@app.route('/api/balance-sheet-history', methods=['GET'])
def get_balance_sheet_history():
    """Get balance sheet history records"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        # Get optional filters
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        customer_name = request.args.get('customer_name')
        
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        query = "SELECT * FROM balance_sheet_history WHERE 1=1"
        params = []
        
        if date_from:
            query += " AND date >= %s"
            params.append(date_from)
        if date_to:
            query += " AND date <= %s"
            params.append(date_to)
        if customer_name:
            query += " AND customer_name = %s"
            params.append(customer_name)
        
        query += " ORDER BY date DESC, customer_name ASC"
        
        cur.execute(query, params)
        records = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify([dict(record) for record in records]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/balance-sheet-history', methods=['POST'])
def save_balance_sheet_history():
    """Save balance sheet history data for a specific date"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        data = request.json
        history_date = parse_date(data.get('date'))
        customers = data.get('customers', [])
        cur = conn.cursor()
        
        for customer in customers:
            # Insert or update history record
            cur.execute("""
                INSERT INTO balance_sheet_history 
                (customer_name, date, litres_mtd, litres_today, litres_total,
                 sales_mtd, sales_today, sales_total,
                 cash_mtd, cash_today, cash_total,
                 credit_today, credit_mtd, credit_total)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (customer_name, date) DO UPDATE SET
                    litres_mtd = EXCLUDED.litres_mtd,
                    litres_today = EXCLUDED.litres_today,
                    sales_mtd = EXCLUDED.sales_mtd,
                    sales_today = EXCLUDED.sales_today,
                    cash_mtd = EXCLUDED.cash_mtd,
                    cash_today = EXCLUDED.cash_today,
                    credit_today = EXCLUDED.credit_today,
                    credit_mtd = EXCLUDED.credit_mtd,
                    updated_at = CURRENT_TIMESTAMP
            """, (
                customer['customerName'],
                history_date,
                customer['litres']['mtd'],
                customer['litres']['today'],
                customer['litres']['mtd'] + customer['litres']['today'],
                customer['sales']['mtd'],
                customer['sales']['today'],
                customer['sales']['mtd'] + customer['sales']['today'],
                customer['paidCash']['mtd'],
                customer['paidCash']['today'],
                customer['paidCash']['mtd'] + customer['paidCash']['today'],
                customer['credit']['today'],
                customer['credit']['mtd'],
                customer['credit']['today'] + customer['credit']['mtd']
            ))
        
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({'message': 'Balance sheet history saved successfully'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/balance-sheet-history/save-today', methods=['POST'])
def save_today_balance_sheet_history():
    """Automatically save today's balance sheet data to history"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        today = datetime.now().date()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get all current balance sheet records
        cur.execute("SELECT * FROM balance_sheet")
        current_records = cur.fetchall()
        
        # Save each to history
        saved_count = 0
        for record in current_records:
            cur.execute("""
                INSERT INTO balance_sheet_history 
                (customer_name, date, litres_mtd, litres_today, litres_total,
                 sales_mtd, sales_today, sales_total,
                 cash_mtd, cash_today, cash_total,
                 credit_today, credit_mtd, credit_total)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (customer_name, date) DO UPDATE SET
                    litres_mtd = EXCLUDED.litres_mtd,
                    litres_today = EXCLUDED.litres_today,
                    sales_mtd = EXCLUDED.sales_mtd,
                    sales_today = EXCLUDED.sales_today,
                    cash_mtd = EXCLUDED.cash_mtd,
                    cash_today = EXCLUDED.cash_today,
                    credit_today = EXCLUDED.credit_today,
                    credit_mtd = EXCLUDED.credit_mtd,
                    updated_at = CURRENT_TIMESTAMP
            """, (
                record['customer_name'],
                today,
                record['litres_mtd'],
                record['litres_today'],
                record['litres_total'],
                record['sales_mtd'],
                record['sales_today'],
                record['sales_total'],
                record['cash_mtd'],
                record['cash_today'],
                record['cash_total'],
                record['credit_today'],
                record['credit_mtd'],
                record['credit_total']
            ))
            saved_count += 1
        
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({
            'message': f'Balance sheet history saved successfully for {saved_count} customers',
            'date': str(today),
            'count': saved_count
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== SUMMARIES ENDPOINTS ====================

# ==================== SUMMARIES ENDPOINTS ====================

@app.route('/api/summaries', methods=['GET'])
def get_summaries():
    """Get auto-calculated summaries + manual entries, grouped by date"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        date_filter = request.args.get('date')
        cur = conn.cursor(cursor_factory=RealDictCursor)
        where = "WHERE date = %s" if date_filter else ""
        params = [date_filter] if date_filter else []

        # --- Auto-calculated rows from each table ---
        cur.execute(f"SELECT date, COALESCE(SUM(total_amount),0) AS val FROM sales {where} GROUP BY date", params)
        sales_rows = {str(r['date']): float(r['val']) for r in cur.fetchall()}

        cur.execute(f"SELECT date, COALESCE(SUM(am_liters+pm_liters),0) AS val FROM production {where} GROUP BY date", params)
        prod_rows = {str(r['date']): float(r['val']) for r in cur.fetchall()}

        cur.execute(f"SELECT date, COALESCE(SUM(total_amount),0) AS val FROM purchases {where} GROUP BY date", params)
        purch_rows = {str(r['date']): float(r['val']) for r in cur.fetchall()}

        cur.execute(f"SELECT date, COALESCE(SUM(amount),0) AS val FROM expenses {where} GROUP BY date", params)
        exp_rows = {str(r['date']): float(r['val']) for r in cur.fetchall()}

        cur.execute(f"SELECT date, COALESCE(SUM(total_amount),0) AS val FROM salaries {where} GROUP BY date", params)
        sal_rows = {str(r['date']): float(r['val']) for r in cur.fetchall()}

        # --- Manual entries ---
        cur.execute(f"SELECT * FROM summaries_manual {where} ORDER BY id ASC", params)
        manual_records = cur.fetchall()

        cur.close()
        conn.close()

        # --- Merge all dates ---
        all_dates = set(
            list(sales_rows) + list(prod_rows) + list(purch_rows) +
            list(exp_rows) + list(sal_rows) +
            [str(r['date']) for r in manual_records]
        )

        results = []
        for d in sorted(all_dates, reverse=True):
            total_sales     = sales_rows.get(d, 0)
            total_prod      = prod_rows.get(d, 0)
            total_purch     = purch_rows.get(d, 0)
            total_exp       = exp_rows.get(d, 0)
            total_sal       = sal_rows.get(d, 0)
            net_profit      = total_sales - total_purch - total_exp - total_sal

            # Auto rows (read-only, negative id so frontend can distinguish)
            auto_rows = [
                {'id': -1, 'date': d, 'description': 'Total Sales',             'amount': total_sales,  'readonly': True},
                {'id': -2, 'date': d, 'description': 'Total Production (L)',     'amount': total_prod,   'readonly': True},
                {'id': -3, 'date': d, 'description': 'Total Purchases',          'amount': -total_purch, 'readonly': True},
                {'id': -4, 'date': d, 'description': 'Total Expenses',           'amount': -total_exp,   'readonly': True},
                {'id': -5, 'date': d, 'description': 'Total Salaries',           'amount': -total_sal,   'readonly': True},
                {'id': -6, 'date': d, 'description': 'Net Profit',               'amount': net_profit,   'readonly': True},
            ]

            # Manual rows for this date
            manual_rows = [
                {'id': r['id'], 'date': str(r['date']), 'description': r['description'], 'amount': float(r['amount']), 'readonly': False}
                for r in manual_records if str(r['date']) == d
            ]

            results.append({
                'date': d,
                'rows': auto_rows + manual_rows
            })

        return jsonify(results), 200

    except Exception as e:
        print(f"❌ Summaries error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/summaries/manual', methods=['POST'])
def save_manual_summary():
    """Save a manual summary row"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        data = request.json
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO summaries_manual (date, description, amount)
            VALUES (%s, %s, %s) RETURNING id
        """, (parse_date(data.get('date')), data.get('description'), float(data.get('amount', 0))))
        new_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({'message': 'Saved', 'id': new_id}), 201
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/summaries/manual/<int:row_id>', methods=['PUT', 'DELETE'])
def update_delete_manual_summary(row_id):
    """Update or delete a manual summary row"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cur = conn.cursor()
        if request.method == 'PUT':
            data = request.json
            cur.execute("""
                UPDATE summaries_manual
                SET description = %s, amount = %s, date = %s, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """, (data.get('description'), float(data.get('amount', 0)), data.get('date'), row_id))
            conn.commit()
            cur.close()
            conn.close()
            return jsonify({'message': 'Updated'}), 200
        else:
            cur.execute("DELETE FROM summaries_manual WHERE id = %s", (row_id,))
            conn.commit()
            cur.close()
            conn.close()
            return jsonify({'message': 'Deleted'}), 200
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/summaries/<date>', methods=['GET'])
def get_summary_by_date(date):
    """Get summary for a specific date"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT * FROM summaries WHERE date = %s", (date,))
        record = cur.fetchone()
        cur.close()
        conn.close()
        
        if record:
            return jsonify(dict(record)), 200
        else:
            return jsonify({'error': 'Summary not found for the specified date'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/summaries', methods=['POST'])
def save_summary():
    """Save or update summary data for a specific date"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        data = request.json
        summary_date = parse_date(data.get('date'))
        cur = conn.cursor()
        
        # Check if summary exists for this date
        cur.execute("SELECT id FROM summaries WHERE date = %s", (summary_date,))
        existing = cur.fetchone()
        
        if existing:
            # Update existing
            cur.execute("""
                UPDATE summaries 
                SET total_sales = %s, total_expenses = %s, 
                    total_purchases = %s, total_salaries = %s,
                    updated_at = CURRENT_TIMESTAMP
                WHERE date = %s
            """, (
                data.get('totalSales', 0),
                data.get('totalExpenses', 0),
                data.get('totalPurchases', 0),
                data.get('totalSalaries', 0),
                summary_date
            ))
        else:
            # Insert new
            cur.execute("""
                INSERT INTO summaries (date, total_sales, total_expenses, total_purchases, total_salaries)
                VALUES (%s, %s, %s, %s, %s)
            """, (
                summary_date,
                data.get('totalSales', 0),
                data.get('totalExpenses', 0),
                data.get('totalPurchases', 0),
                data.get('totalSalaries', 0)
            ))
        
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({'message': 'Summary saved successfully'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/summaries/calculate', methods=['POST'])
def calculate_summary():
    """Calculate summary for a specific date from all related tables"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        data = request.json
        summary_date = parse_date(data.get('date'))
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Calculate totals from all tables for the date
        # Total Sales
        cur.execute("""
            SELECT COALESCE(SUM(liters_purchased * rpl), 0) as total 
            FROM sales WHERE date = %s
        """, (summary_date,))
        total_sales = cur.fetchone()['total']
        
        # Total Expenses
        cur.execute("""
            SELECT COALESCE(SUM(amount), 0) as total 
            FROM expenses WHERE date = %s
        """, (summary_date,))
        total_expenses = cur.fetchone()['total']
        
        # Total Purchases
        cur.execute("""
            SELECT COALESCE(SUM(quantity * price_per_unit), 0) as total 
            FROM purchases WHERE date = %s
        """, (summary_date,))
        total_purchases = cur.fetchone()['total']
        
        # Total Salaries (for the date, if salaries are date-based)
        # Note: Current schema doesn't have date for salaries, so we'll use current month total
        cur.execute("""
    SELECT COALESCE(SUM(total_amount), 0) as total 
    FROM salaries
    WHERE date = %s
""", (summary_date,))
        total_salaries = cur.fetchone()['total']
        
        # Calculate net profit
        net_profit = float(total_sales) - float(total_expenses) - float(total_purchases) - float(total_salaries)
        
        # Save to summaries table
        cur.execute("""
            INSERT INTO summaries (date, total_sales, total_expenses, total_purchases, total_salaries)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (date) DO UPDATE SET
                total_sales = EXCLUDED.total_sales,
                total_expenses = EXCLUDED.total_expenses,
                total_purchases = EXCLUDED.total_purchases,
                total_salaries = EXCLUDED.total_salaries,
                updated_at = CURRENT_TIMESTAMP
        """, (summary_date, total_sales, total_expenses, total_purchases, total_salaries))
        
        conn.commit()
        
        # Fetch the saved summary
        cur.execute("SELECT * FROM summaries WHERE date = %s", (summary_date,))
        summary = cur.fetchone()
        
        cur.close()
        conn.close()
        
        return jsonify(dict(summary)), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 50

# ==================== DATA RETENTION ALERTS ENDPOINTS ====================

@app.route('/api/alerts/retention', methods=['GET'])
def get_retention_alerts():
    """Get all active data retention alerts"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # First, update alerts by checking current data
        cur.execute("SELECT update_data_retention_alerts()")
        conn.commit()
        
        # Get active alerts
        cur.execute("""
            SELECT * FROM data_retention_alerts 
            WHERE alert_status = 'active'
            ORDER BY oldest_date ASC, created_at DESC
        """)
        alerts = cur.fetchall()
        
        cur.close()
        conn.close()
        return jsonify([dict(alert) for alert in alerts]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/alerts/retention/check', methods=['POST'])
def check_retention():
    """Manually trigger data retention check"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Run retention check
        cur.execute("SELECT * FROM check_data_retention()")
        results = cur.fetchall()
        
        # Update alerts table
        cur.execute("SELECT update_data_retention_alerts()")
        conn.commit()
        
        cur.close()
        conn.close()
        
        return jsonify({
            'alerts': [dict(result) for result in results],
            'message': 'Retention check completed'
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/alerts/retention/<int:alert_id>', methods=['PUT'])
def update_alert_status(alert_id):
    """Update alert status (dismiss or resolve)"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        data = request.json
        new_status = data.get('status', 'dismissed')
        
        if new_status not in ['active', 'dismissed', 'resolved']:
            return jsonify({'error': 'Invalid status'}), 400
        
        cur = conn.cursor()
        cur.execute("""
            UPDATE data_retention_alerts 
            SET alert_status = %s, updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
        """, (new_status, alert_id))
        
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({'message': 'Alert status updated successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/alerts/retention/stats', methods=['GET'])
def get_retention_stats():
    """Get statistics about data retention across all tables"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        retention_limit = datetime.now().date() - timedelta(days=1825)  # 5 years
        
        stats = {}
        tables = ['production', 'sales', 'purchases', 'expenses', 'summaries', 'balance_sheet_history']
        
        for table in tables:
            cur.execute(f"""
                SELECT 
                    MIN(date) as oldest_date,
                    MAX(date) as newest_date,
                    COUNT(*) as total_records,
                    COUNT(*) FILTER (WHERE date < %s) as records_beyond_limit
                FROM {table}
            """, (retention_limit,))
            result = cur.fetchone()
            stats[table] = dict(result)
        
        cur.close()
        conn.close()
        return jsonify({
            'retention_limit_date': str(retention_limit),
            'retention_limit_years': 5,
            'tables': stats
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== HEALTH CHECK ====================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    conn = get_db_connection()
    if conn:
        conn.close()
        return jsonify({'status': 'healthy', 'database': 'connected'}), 200
    else:
        return jsonify({'status': 'unhealthy', 'database': 'disconnected'}), 500
@app.route('/')
def index():
    return send_from_directory(BASE_DIR, 'index.html')

@app.route('/manifest.json')
def manifest():
    return send_from_directory('.', 'manifest.json', mimetype='application/manifest+json')

@app.route('/service-worker.js')
def service_worker():
    return send_from_directory('.', 'service-worker.js')

@app.route('/<path:filename>')
def serve_static(filename):
    filepath = os.path.join(BASE_DIR, filename)
    
    # Check if direct file exists
    if os.path.exists(filepath) and os.path.isfile(filepath):
        return send_from_directory(BASE_DIR, filename)
    
    # Check if it's a folder → serve its index.html
    index_path = os.path.join(BASE_DIR, filename, 'index.html')
    if os.path.exists(index_path):
        return send_from_directory(os.path.join(BASE_DIR, filename), 'index.html')
    
    return "Not Found", 404

# Handle files requested relative to a subfolder page
@app.route('/<folder>/<file>')
def serve_subfolder_file(folder, file):
    filepath = os.path.join(BASE_DIR, folder, file)
    if os.path.exists(filepath):
        return send_from_directory(os.path.join(BASE_DIR, folder), file)
    return "Not Found", 404
@app.route('/api/check-license')
def check_license():
    from datetime import date
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT expiry_date, balance FROM app_license LIMIT 1")
    row = cur.fetchone()
    cur.close()
    conn.close()
    expiry = row[0]
    balance = float(row[1])
    is_active = expiry >= date.today()
    return jsonify({
        "active": is_active,
        "expiry": str(expiry),
        "balance": balance
    })
@app.route('/lockscreen')
def lockscreen():
    return send_from_directory('lockscreen', 'index.html')

@app.route('/lockscreen/<path:filename>')
def lockscreen_static(filename):
    return send_from_directory('lockscreen', filename)
if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=False, host='0.0.0.0', port=port)
