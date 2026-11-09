const ProductModel = require('../models/productModel');

const getProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    const [products, total] = await Promise.all([
      ProductModel.findAll({ limit, offset, search }),
      ProductModel.count(),
    ]);

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    console.error('Products Error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch products.' });
  }
};

const getProduct = async (req, res) => {
  try {
    const product = await ProductModel.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    res.json({ success: true, data: { product } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch product.' });
  }
};

module.exports = { getProducts, getProduct };
