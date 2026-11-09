import os
import ssl
import re
import pg8000.dbapi
from dotenv import load_dotenv

load_dotenv()

def get_connection():
    # Use individual Supabase params directly — avoids URL parsing mangling special chars in passwords
    supabase_host = os.environ.get('SUPABASE_HOST')
    
    if supabase_host:
        host = supabase_host
        port = int(os.environ.get('SUPABASE_PORT', 6543))
        database = os.environ.get('SUPABASE_DB', 'postgres')
        user = os.environ.get('SUPABASE_USER', 'postgres')
        password = os.environ.get('SUPABASE_PASSWORD', '')
        
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE
        
        return pg8000.dbapi.connect(
            user=user,
            password=password,
            host=host,
            port=port,
            database=database,
            ssl_context=ssl_context
        )
    else:
        # Local PostgreSQL fallback
        host = os.environ.get('DB_HOST', 'localhost')
        port = int(os.environ.get('DB_PORT', 5432))
        database = os.environ.get('DB_NAME', 'feedback_db')
        user = os.environ.get('DB_USER', 'postgres')
        password = os.environ.get('DB_PASSWORD', 'postgres')
        
        return pg8000.dbapi.connect(
            user=user,
            password=password,
            host=host,
            port=port,
            database=database
        )

def execute_query(query, params=None, fetch_one=False, fetch_all=False):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        
        # In pg8000, placeholders are %s, but in node pg it was $1, $2.
        # We need to replace $1, $2, etc. with %s in the queries!
        # Wait, instead of manually editing everywhere, we can convert queries dynamically,
        # or write the queries using %s in models. Let's make sure our execute_query does this conversion,
        # or we write query placeholders as %s.
        # Actually doing query conversion in execute_query makes it extremely robust.
        # Let's see: node uses $1, $2... which is positional and numbered.
        # PostgreSQL protocol uses $1, $2, but some DB drivers in python use %s.
        # Wait! pg8000 uses %s or paramstyle 'format/numeric'.
        # Let's check pg8000 paramstyle: pg8000 uses 'numeric' (i.e. :1, :2) or pyformat/qmark?
        # Actually, in pg8000:
        # pg8000.paramstyle is 'numeric' (e.g. :1, :2) or format/pyformat?
        # Let's check: paramstyle for pg8000 is 'format' (i.e. %s), meaning psycopg2 style.
        # Wait, if we use pg8000.dbapi, does it support $1, $2? No, standard dbapi uses %s or :1.
        # Let's check if we can format the query. If the query contains $1, $2, we can convert it to %s.
        # BUT wait! If we do regex substitution for parameter replacement (e.g., replace $1, $2 with %s):
        # We can do this in Python:
        # import re
        # query = re.sub(r'\$\d+', '%s', query)
        # This will convert "SELECT * FROM users WHERE email = $1 AND role = $2" to "SELECT * FROM users WHERE email = %s AND role = %s"!
        # This is incredibly elegant because we can copy-paste the SQL queries EXACTLY as they are in Node.js
        # and they will run perfectly! Let's do that!
        
        import re
        # Map sequential PostgreSQL style parameters ($1, $2, etc.) to positional parameters (%s)
        placeholders = re.findall(r'\$(\d+)', query)
        if placeholders:
            new_params = []
            for p in placeholders:
                idx = int(p) - 1
                if params and idx < len(params):
                    new_params.append(params[idx])
                else:
                    raise ValueError(f"Parameter index ${p} is out of bounds for params list of size {len(params) if params else 0}")
            converted_params = new_params
            converted_query = re.sub(r'\$\d+', '%s', query)
        else:
            converted_query = query
            converted_params = params or ()
        
        cursor.execute(converted_query, converted_params)
        conn.commit()
        
        if fetch_one:
            row = cursor.fetchone()
            if row:
                columns = [desc[0] for desc in cursor.description]
                return dict(zip(columns, row))
            return None
        elif fetch_all:
            rows = cursor.fetchall()
            if cursor.description:
                columns = [desc[0] for desc in cursor.description]
                return [dict(zip(columns, row)) for row in rows]
            return []
        
        return cursor.rowcount
    except Exception as e:
        try:
            conn.rollback()
        except Exception:
            pass
        raise e
    finally:
        try:
            conn.close()
        except Exception:
            pass
