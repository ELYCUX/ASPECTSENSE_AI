const pool = require('../config/db');

const UserModel = {
  async findByEmail(email) {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
  },

  async findById(id) {
    const result = await pool.query('SELECT id, name, email, role, created_at FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async create({ name, email, passwordHash, role = 'user' }) {
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at',
      [name, email, passwordHash, role]
    );
    return result.rows[0];
  },

  async count() {
    const result = await pool.query('SELECT COUNT(*) FROM users');
    return parseInt(result.rows[0].count);
  },
};

module.exports = UserModel;
