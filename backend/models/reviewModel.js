const pool = require('../config/db');

const ReviewModel = {
  async findAll({ limit = 10, offset = 0, productId = null, sentiment = null, search = '' } = {}) {
    const params = [];
    const conditions = [];

    if (productId) {
      params.push(productId);
      conditions.push(`r.product_id = $${params.length}`);
    }
    if (sentiment) {
      params.push(sentiment);
      conditions.push(`r.sentiment = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(r.body ILIKE $${params.length} OR r.user_name ILIKE $${params.length})`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const query = `
      SELECT r.*, p.name as product_name, p.category, p.brand
      FROM reviews r
      JOIN products p ON r.product_id = p.id
      ${where}
      ORDER BY r.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    params.push(limit, offset);
    const result = await pool.query(query, params);
    return result.rows;
  },

  async count({ productId = null, sentiment = null } = {}) {
    const params = [];
    const conditions = [];
    if (productId) {
      params.push(productId);
      conditions.push(`product_id = $${params.length}`);
    }
    if (sentiment) {
      params.push(sentiment);
      conditions.push(`sentiment = $${params.length}`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await pool.query(`SELECT COUNT(*) FROM reviews ${where}`, params);
    return parseInt(result.rows[0].count);
  },

  async getSentimentCounts() {
    const result = await pool.query(
      `SELECT sentiment, COUNT(*) as count FROM reviews GROUP BY sentiment`
    );
    return result.rows;
  },

  async getRatingDistribution() {
    const result = await pool.query(
      `SELECT rating, COUNT(*) as count FROM reviews GROUP BY rating ORDER BY rating`
    );
    return result.rows;
  },

  async getAspectSentiment(productId = null) {
    let query = `SELECT aspects FROM reviews WHERE aspects IS NOT NULL`;
    const params = [];
    if (productId) {
      params.push(productId);
      query += ` AND product_id = $1`;
    }
    const result = await pool.query(query, params);
    
    const aspectMap = {};
    result.rows.forEach(({ aspects }) => {
      if (!aspects) return;
      Object.entries(aspects).forEach(([aspect, sentiment]) => {
        if (!aspectMap[aspect]) aspectMap[aspect] = { positive: 0, negative: 0, neutral: 0 };
        if (aspectMap[aspect][sentiment] !== undefined) aspectMap[aspect][sentiment]++;
      });
    });
    return Object.entries(aspectMap).map(([aspect, counts]) => ({ aspect, ...counts }));
  },

  async getReviewsPerMonth() {
    const result = await pool.query(
      `SELECT TO_CHAR(created_at, 'Mon') as month, COUNT(*) as count
       FROM reviews
       WHERE created_at >= NOW() - INTERVAL '6 months'
       GROUP BY TO_CHAR(created_at, 'Mon'), EXTRACT(MONTH FROM created_at)
       ORDER BY EXTRACT(MONTH FROM created_at)`
    );
    return result.rows;
  },

  async getAverageRating() {
    const result = await pool.query('SELECT ROUND(AVG(rating)::numeric, 1) as avg_rating FROM reviews');
    return parseFloat(result.rows[0].avg_rating) || 0;
  },
};

module.exports = ReviewModel;
