require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
  .then(res => {
    const tables = res.rows.map(r => r.table_name);
    console.log('Tables in DB:', tables.length ? tables.join(', ') : 'None');
  })
  .catch(e => console.error('DB Error:', e.message))
  .finally(() => pool.end());
