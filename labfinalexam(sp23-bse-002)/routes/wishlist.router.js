const express = require('express');
const router = express.Router();
const User = require('../models/user.models'); 
const Product = require('../models/product.models'); 
const authMiddleware = require('../middleware/auth'); 


router.post('/add/:productId', authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const { productId } = req.params;

    const user = req.currentUser;

   
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    
    if (!user.wishlist.includes(productId)) {
      user.wishlist.push(productId);
      await user.save();
    }


    const populatedUser = await User.findById(user._id).populate('wishlist');

    
    return res.render('wishlist', { wishlist: populatedUser.wishlist });
  } catch (error) {
    console.error('Error adding product to wishlist:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});


router.delete('/remove/:productId', authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const { productId } = req.params;

    
    const user = await User.findById(req.session.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

   
    user.wishlist = user.wishlist.filter(id => id.toString() !== productId);
    await user.save();

    
    return res.json({ success: true, message: 'Product removed from wishlist' });
  } catch (error) {
    console.error('Error removing product from wishlist:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});





router.get('/', authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id).populate('wishlist');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ wishlist: user.wishlist });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
