// const express = require('express');
// const router = express.Router();
// const authMiddleware = require('../middleware/auth'); // Import middleware

// // Admin Dashboard
// router.get('/dashboard', authMiddleware.isAuthenticated, (req, res) => {
//   res.render('admin/dashboard', { user: req.currentUser });
// });

// // Manage Users
// router.get('/manage-users', authMiddleware.isSuperAdmin, (req, res) => {
//   res.render('admin/manage-users');
// });

// // Error Handling Example for Undefined Paths
// router.use((req, res) => {
//   res.status(404).send('Page not found');
// });

// module.exports = router;
