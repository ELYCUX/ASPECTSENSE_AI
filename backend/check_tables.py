from config.db import execute_query

def main():
    users = execute_query('SELECT id, name, email, role, account_status FROM users', fetch_all=True)
    print('Existing Users in Supabase:')
    for u in users or []:
        print(f"  ID: {u['id']}, Name: {u['name']}, Email: {u['email']}, Role: {u['role']}, Status: {u.get('account_status')}")

if __name__ == '__main__':
    main()
