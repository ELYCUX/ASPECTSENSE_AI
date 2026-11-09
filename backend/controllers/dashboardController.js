const UserModel = require('../models/userModel');
const ProductModel = require('../models/productModel');
const ReviewModel = require('../models/reviewModel');

const getStats = async (req, res) => {
  try {
    const [totalReviews, totalProducts, avgRating, sentimentCounts, ratingDist, reviewsPerMonth, aspectSentiment] = await Promise.all([
      ReviewModel.count(),
      ProductModel.count(),
      ReviewModel.getAverageRating(),
      ReviewModel.getSentimentCounts(),
      ReviewModel.getRatingDistribution(),
      ReviewModel.getReviewsPerMonth(),
      ReviewModel.getAspectSentiment(),
    ]);

    const sentimentMap = { positive: 0, negative: 0, neutral: 0 };
    sentimentCounts.forEach(({ sentiment, count }) => {
      sentimentMap[sentiment] = parseInt(count);
    });

    const positiveReviews = sentimentMap.positive;
    const negativeReviews = sentimentMap.negative;
    const neutralReviews = sentimentMap.neutral;
    const aiProcessed = Math.floor(totalReviews * 0.94); // simulated

    res.json({
      success: true,
      data: {
        kpi: {
          totalReviews,
          totalProducts,
          avgRating,
          positiveReviews,
          negativeReviews,
          neutralReviews,
          aiProcessed,
        },
        charts: {
          sentimentDistribution: [
            { name: 'Positive', value: positiveReviews, color: '#22c55e' },
            { name: 'Negative', value: negativeReviews, color: '#ef4444' },
            { name: 'Neutral', value: neutralReviews, color: '#94a3b8' },
          ],
          ratingDistribution: ratingDist.map(r => ({
            rating: `${r.rating}★`,
            count: parseInt(r.count),
          })),
          reviewsPerMonth: reviewsPerMonth.map(r => ({
            month: r.month,
            reviews: parseInt(r.count),
          })),
        },
        aspectSentiment,
      },
    });
  } catch (err) {
    console.error('Dashboard Stats Error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard statistics.' });
  }
};

module.exports = { getStats };
