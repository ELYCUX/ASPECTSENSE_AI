import os
import ssl
import re
import queue
import threading
import logging
import pg8000.dbapi
from dotenv import load_dotenv

# Ensure .env is always loaded from backend root
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
if os.path.exists(env_path):
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

logger = logging.getLogger(__name__)

POOL_SIZE = 8
_connection_pool = queue.Queue(maxsize=POOL_SIZE)
_pool_lock = threading.Lock()
_created_connections = 0


def _create_raw_connection():
    """Create a new raw SSL connection to Supabase or local PostgreSQL."""
    supabase_host = os.environ.get('SUPABASE_HOST')
    
    if supabase_host:
        host = supabase_host
        port = int(os.environ.get('SUPABASE_PORT', 5432))
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


def _get_pooled_connection():
    """Acquire a connection from the pool or create a new one."""
    global _created_connections
    conn = None
    
    # Try getting an existing idle connection from pool
    try:
        conn = _connection_pool.get_nowait()
    except queue.Empty:
        with _pool_lock:
            if _created_connections < POOL_SIZE:
                _created_connections += 1
                try:
                    conn = _create_raw_connection()
                except Exception as e:
                    _created_connections -= 1
                    raise e
    
    # If pool was full and none were immediately available, wait up to 5s
    if conn is None:
        try:
            conn = _connection_pool.get(timeout=5.0)
        except queue.Empty:
            # Fallback to creating a transient connection
            return _create_raw_connection(), False
            
    return conn, True


def _return_connection(conn, is_pooled, is_broken=False):
    """Return connection back to pool or close if broken."""
    global _created_connections
    if not is_pooled or conn is None:
        if conn:
            try:
                conn.close()
            except Exception:
                pass
        return

    if is_broken:
        with _pool_lock:
            _created_connections = max(0, _created_connections - 1)
        try:
            conn.close()
        except Exception:
            pass
    else:
        try:
            _connection_pool.put_nowait(conn)
        except queue.Full:
            with _pool_lock:
                _created_connections = max(0, _created_connections - 1)
            try:
                conn.close()
            except Exception:
                pass


def get_connection():
    """Legacy compatibility function for raw connection needs."""
    return _create_raw_connection()


def _convert_query_params(query, params):
    """Convert numbered PostgreSQL params ($1, $2) to %s format for pg8000."""
    placeholders = re.findall(r'\$(\d+)', query)
    if placeholders:
        new_params = []
        for p in placeholders:
            idx = int(p) - 1
            if params and idx < len(params):
                new_params.append(params[idx])
            else:
                raise ValueError(f"Parameter index ${p} out of bounds for params size {len(params) if params else 0}")
        converted_params = new_params
        converted_query = re.sub(r'\$\d+', '%s', query)
    else:
        converted_query = query
        converted_params = params or ()
    return converted_query, converted_params


def execute_query(query, params=None, fetch_one=False, fetch_all=False):
    """
    Execute a SQL query using the connection pool with automatic retry on broken connection.
    """
    converted_query, converted_params = _convert_query_params(query, params)
    
    max_retries = 2
    for attempt in range(max_retries):
        conn, is_pooled = _get_pooled_connection()
        is_broken = False
        try:
            cursor = conn.cursor()
            cursor.execute(converted_query, converted_params)
            conn.commit()
            
            if fetch_one:
                row = cursor.fetchone()
                if row:
                    columns = [desc[0] for desc in cursor.description]
                    res = dict(zip(columns, row))
                else:
                    res = None
                _return_connection(conn, is_pooled, is_broken=False)
                return res
            elif fetch_all:
                rows = cursor.fetchall()
                if cursor.description:
                    columns = [desc[0] for desc in cursor.description]
                    res = [dict(zip(columns, row)) for row in rows]
                else:
                    res = []
                _return_connection(conn, is_pooled, is_broken=False)
                return res
            
            rowcount = cursor.rowcount
            _return_connection(conn, is_pooled, is_broken=False)
            return rowcount
            
        except (pg8000.exceptions.InterfaceError, BrokenPipeError, ConnectionResetError) as net_err:
            is_broken = True
            _return_connection(conn, is_pooled, is_broken=True)
            if attempt < max_retries - 1:
                logger.warning(f"Database connection broken ({net_err}), reconnecting and retrying query...")
                continue
            raise net_err
        except Exception as e:
            try:
                conn.rollback()
            except Exception:
                pass
            _return_connection(conn, is_pooled, is_broken=False)
            raise e
