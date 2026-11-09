const express = require('express');
const router = express.Router();
const { getReviews, getAspectSentiment, getDistribution } = require('../controllers/reviewController');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, getReviews);
router.get('/aspect-sentiment', verifyToken, getAspectSentiment);
router.get('/distribution', verifyToken, getDistribution);

module.exports = router;
