import os
import ssl
from urllib.parse import urlparse, unquote
import pg8000.dbapi
from dotenv import load_dotenv

load_dotenv()

def setup_database():
    database_url = os.environ.get('DATABASE_URL')
    
    if database_url:
        print("DATABASE_URL provided. Running schema directly on Supabase database...")
        # Parse it
        result = urlparse(database_url)
        username = unquote(result.username) if result.username else None
        password = unquote(result.password) if result.password else None
        database = result.path[1:] if result.path else 'postgres'
        hostname = result.hostname
        port = result.port or 5432
        
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE
        
        conn = pg8000.dbapi.connect(
            user=username,
            password=password,
            host=hostname,
            port=port,
            database=database,
            ssl_context=ssl_context
        )
    else:
        print("Using local PostgreSQL. Setting up database...")
        host = os.environ.get('DB_HOST', 'localhost')
        port = int(os.environ.get('DB_PORT', 5432))
        user = os.environ.get('DB_USER', 'postgres')
        password = os.environ.get('DB_PASSWORD', 'postgres')
        
        # Connect to postgres to create feedback_db
        conn = pg8000.dbapi.connect(
            user=user,
            password=password,
            host=host,
            port=port,
            database='postgres'
        )
        
        # In pg8000, autocommit is set on the connection object, but the dbapi might not support it directly.
        # Actually, conn.autocommit = True works in some versions, or we can just run CREATE DATABASE outside a transaction block (pg8000 doesn't automatically start transactions until you execute a DML/DDL or use cursor, but to be sure we do it and catch if transaction block error occurs).
        # To avoid transaction issues on CREATE DATABASE, we can run commit() before it.
        cursor = conn.cursor()
        try:
            cursor.execute("SELECT 1 FROM pg_database WHERE datname = 'feedback_db'")
            res = cursor.fetchone()
            if not res:
                print("Creating database 'feedback_db'...")
                # We close current conn and open with autocommit-like behavior, or we execute it directly.
                # Actually, in pg8000, simple execution of CREATE DATABASE when no transaction is open works.
                cursor.execute("CREATE DATABASE feedback_db")
                conn.commit()
            else:
                print("feedback_db already exists.")
        except Exception as e:
            print("Failed to check/create database:", e)
        finally:
            conn.close()
            
        # Connect to the created feedback_db
        conn = pg8000.dbapi.connect(
            user=user,
            password=password,
            host=host,
            port=port,
            database='feedback_db'
        )
        
    try:
        cursor = conn.cursor()
        print("Reading schema.sql...")
        schema_path = os.path.join(os.path.dirname(__file__), 'db', 'schema.sql')
        with open(schema_path, 'r', encoding='utf-8') as f:
            schema_sql = f.read()
            
        # Run it
        print("Applying schema and seed data...")
        cursor.execute(schema_sql)
        conn.commit()
        print("Schema and seed data applied successfully!")
    except Exception as e:
        print("Failed to apply schema:", e)
    finally:
        conn.close()

if __name__ == '__main__':
    setup_database()
    # verify
    try:
        from check_tables import main as check_main
        check_main()
    except Exception:
        pass
