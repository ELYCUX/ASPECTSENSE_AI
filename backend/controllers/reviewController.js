const ReviewModel = require('../models/reviewModel');

const getReviews = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;
    const productId = req.query.productId || null;
    const sentiment = req.query.sentiment || null;
    const search = req.query.search || '';

    const [reviews, total] = await Promise.all([
      ReviewModel.findAll({ limit, offset, productId, sentiment, search }),
      ReviewModel.count({ productId, sentiment }),
    ]);

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    console.error('Reviews Error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch reviews.' });
  }
};

const getAspectSentiment = async (req, res) => {
  try {
    const productId = req.query.productId || null;
    const data = await ReviewModel.getAspectSentiment(productId);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch aspect sentiment.' });
  }
};

const getDistribution = async (req, res) => {
  try {
    const [sentiment, rating, monthly] = await Promise.all([
      ReviewModel.getSentimentCounts(),
      ReviewModel.getRatingDistribution(),
      ReviewModel.getReviewsPerMonth(),
    ]);
    res.json({ success: true, data: { sentiment, rating, monthly } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch distribution data.' });
  }
};

module.exports = { getReviews, getAspectSentiment, getDistribution };
