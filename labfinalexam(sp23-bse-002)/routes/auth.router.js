
const express = require('express');
const router = express.Router();
const User = require('../models/user.models');
const { isAuthenticated, isSuperAdmin } = require('../middleware/auth');

// Register routes
router.get('/auth/register', (req, res) => {
  res.render('auth/register', { error: null });
});

// Login routes
router.get('/auth/login', (req, res) => {
  res.render('auth/login', { error: null });
});

// Register routes
router.post('/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      req.flash('error_msg', 'Email already registered');
      return res.redirect('/auth/register');
    }

    const user = new User({ username, email, password });
    await user.save();

    req.flash('success_msg', 'Registration successful! You can now log in.');
    res.redirect('/auth/login');
  } catch (error) {
    req.flash('error_msg', error.message);
    res.redirect('/auth/register');
  }
});

router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await user.comparePassword(password))) {
      req.flash('error_msg', 'Invalid email or password');
      return res.redirect('/auth/login');
    }

    // Skip approval check, allow login if credentials are correct
    req.session.user = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    req.flash('success_msg', 'Successfully logged in!');
    res.redirect('/admin/dashboard');
  } catch (error) {
    req.flash('error_msg', 'Login failed');
    res.redirect('/auth/login');
  }
});

// Logout route
router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Error logging out:', err);
      return res.redirect('/'); // Redirect to home page if there's an error
    }
    res.clearCookie('connect.sid'); // Clear the session cookie
    res.redirect('/auth/login'); // Redirect to login page
  });
});

module.exports = router;
