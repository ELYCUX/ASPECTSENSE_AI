import os
import socket
import ssl
import traceback
from urllib.parse import urlparse, unquote
import pg8000.dbapi
from dotenv import load_dotenv

load_dotenv()

# Set default socket timeout so it doesn't hang forever
socket.setdefaulttimeout(5.0)

def test_supabase():
    url = os.environ.get('DATABASE_URL')
    if not url:
        print("No DATABASE_URL found in env.")
        return
    url = url.strip('"').strip("'")
    print(f"Testing Supabase connection...")
    try:
        res = urlparse(url)
        username = unquote(res.username) if res.username else None
        password = unquote(res.password) if res.password else None
        database = res.path[1:] if res.path else 'postgres'
        hostname = res.hostname
        port = res.port or 5432
        
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE
        
        print(f"Connecting to host={hostname}, port={port}, user={username}, db={database}...")
        conn = pg8000.dbapi.connect(
            user=username,
            password=password,
            host=hostname,
            port=port,
            database=database,
            ssl_context=ssl_context,
            timeout=5
        )
        print("✅ Supabase connection SUCCESS!")
        conn.close()
    except Exception as e:
        print(f"❌ Supabase connection FAILED: {e}")
        traceback.print_exc()

if __name__ == '__main__':
    test_supabase()
