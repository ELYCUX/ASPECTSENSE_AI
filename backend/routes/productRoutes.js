const express = require('express');
const router = express.Router();
const { getProducts, getProduct } = require('../controllers/productController');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, getProducts);
router.get('/:id', verifyToken, getProduct);

module.exports = router;
