import os
from dotenv import load_dotenv
import psycopg2

load_dotenv()

print("--- CHECKING LOCAL DATABASE ---")
try:
    local_conn = psycopg2.connect(
        dbname="feedback_db",
        user="postgres",
        password="postgres",
        host="localhost",
        port="5432"
    )
    cur = local_conn.cursor()
    cur.execute("SELECT * FROM users;")
    records = cur.fetchall()
    print(f"Success! Found {len(records)} user(s) in LOCAL database:")
    for row in records:
        print(row)
    local_conn.close()
except Exception as err:
    print("Local database check failed:", err)

print("\n--- CHECKING SUPABASE DATABASE ---")
try:
    supabase_url = os.getenv("DATABASE_URL")
    if not supabase_url:
        print("DATABASE_URL not found in .env file.")
    else:
        supa_conn = psycopg2.connect(supabase_url)
        cur = supa_conn.cursor()
        cur.execute("SELECT * FROM users;")
        records = cur.fetchall()
        print(f"Success! Found {len(records)} user(s) in SUPABASE database:")
        for row in records:
            print(row)
        supa_conn.close()
except Exception as err:
    print("Supabase database check failed:", err)