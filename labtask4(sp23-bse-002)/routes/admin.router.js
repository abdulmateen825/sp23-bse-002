const express = require('express');
const router = express.Router();
const User = require('../models/user.models');
const { isAuthenticated, isSuperAdmin, isApproved } = require('../middleware/auth');

// Protected admin dashboard
router.get('/admin/dashboard', [isAuthenticated, isApproved], (req, res) => {
  res.render('admin/dashboard', {
    user: req.session.user
  });
});

// Super admin user management routes
router.get('/admin/users', [isAuthenticated, isSuperAdmin], async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.session.user.id } });
    res.render('admin/users', { users , layout : 'admin/admin-layout'});
  } catch (error) {
    req.flash('error_msg', 'Error fetching users');
    res.redirect('/admin/dashboard');
  }
});

router.post('/admin/users/:userId/approve', [isAuthenticated, isSuperAdmin], async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.userId, { status: 'approved' });
    req.flash('success_msg', 'User approved successfully');
    res.redirect('/admin/users');
  } catch (error) {
    req.flash('error_msg', 'Error approving user');
    res.redirect('/admin/users');
  }
});

router.post('/admin/users/:userId/reject', [isAuthenticated, isSuperAdmin], async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.userId, { status: 'rejected' });
    req.flash('success_msg', 'User rejected successfully');
    res.redirect('/admin/users');
  } catch (error) {
    req.flash('error_msg', 'Error rejecting user');
    res.redirect('/admin/users');
  }
});

router.post('/admin/users/:userId/delete', [isAuthenticated, isSuperAdmin], async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.userId);
    req.flash('success_msg', 'User deleted successfully');
    res.redirect('/admin/users');
  } catch (error) {
    req.flash('error_msg', 'Error deleting user');
    res.redirect('/admin/users');
  }
});

module.exports = router;