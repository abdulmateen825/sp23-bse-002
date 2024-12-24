const mongoose = require('mongoose');
const Product = require('../models/product.models');

exports.handleQuizSubmission = async (req, res) => {
  try {
    const { answers } = req.body;
    const [categoryId, budgetRange] = answers;

    // Parse price range
    let priceQuery;
    switch (budgetRange) {
      case 'Under $50':
        priceQuery = { $lt: 50 };
        break;
      case '$50-$100':
        priceQuery = { $gte: 50, $lte: 100 };
        break;
      case 'Above $100':
        priceQuery = { $gt: 100 };
        break;
    }

    const recommendations = await Product.find({
      category: new mongoose.Types.ObjectId(categoryId),
      price: priceQuery
    }).populate('category', 'title');

    res.json(recommendations);
  } catch (error) {
    console.error('Error in quiz submission:', error);
    res.status(500).json({ error: 'Error getting recommendations' });
  }
};