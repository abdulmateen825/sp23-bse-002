const express = require('express');
const router = express.Router();
const { handleQuizSubmission } = require('../controllers/quiz.controller');
const Category = require('../models/category.models');

router.get('/quiz', (req, res) => {
  res.render('quiz');
});

router.get('/quiz/categories', async (req, res) => {
  try {
    const categories = await Category.find({}, 'title _id');
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Error fetching categories' });
  }
});

router.post('/quiz/recommendations', handleQuizSubmission);

module.exports = router;