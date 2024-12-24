
const User = require('../models/user.models');
const authMiddleware = {
  isAuthenticated: async (req, res, next) => {
    if (req.session && req.session.user) {
      const user = await User.findById(req.session.user.id);
      if (!user) {
       
        return res.redirect('/auth/login');
      }
      req.currentUser = user; 
      return next();
    }
    
    res.redirect('/auth/login');
  }
};

module.exports = authMiddleware;

