const authMiddleware = {
  isAuthenticated: (req, res, next) => {
    if (req.session && req.session.user) {
      return next();
    }
    
    res.redirect('/auth/login');
  },

  isSuperAdmin: (req, res, next) => {
    if (req.session && req.session.user && req.session.user.role === 'super_admin') {
      return next();
    }
   
    res.redirect('/admin/dashboard');
  },

  isApproved: (req, res, next) => {
    if (req.session && req.session.user && req.session.user.status === 'approved') {
      return next();
    }
   
    res.redirect('/auth/pending');
  }
};

module.exports = authMiddleware;
