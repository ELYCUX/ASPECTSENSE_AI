const pool = require('../config/db');

const ProductModel = {
  async findAll({ limit = 20, offset = 0, search = '' } = {}) {
    let query = 'SELECT * FROM products';
    const params = [];
    if (search) {
      params.push(`%${search}%`);
      query += ` WHERE name ILIKE $${params.length} OR brand ILIKE $${params.length}`;
    }
    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    const result = await pool.query(query, params);
    return result.rows;
  },

  async findById(id) {
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async count() {
    const result = await pool.query('SELECT COUNT(*) FROM products');
    return parseInt(result.rows[0].count);
  },
};

module.exports = ProductModel;
