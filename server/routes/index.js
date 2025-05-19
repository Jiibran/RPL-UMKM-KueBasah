const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Home page route
router.get('/', async (req, res) => {
  try {
    // Fetch featured products
    const [featuredProducts] = await pool.query(
      'SELECT * FROM products WHERE is_featured = TRUE LIMIT 8'
    );
    
    // Fetch categories
    const [categories] = await pool.query('SELECT * FROM categories');
    
    res.render('index', { 
      title: 'UMKM Kue Basah - Home',
      featuredProducts,
      categories,
      user: req.session.user || null
    });
  } catch (error) {
    console.error('Error fetching home page data:', error);
    res.status(500).render('error', { error: 'Failed to load home page' });
  }
});

// About page route
router.get('/about', (req, res) => {
  res.render('about', { 
    title: 'UMKM Kue Basah - About Us',
    user: req.session.user || null
  });
});

// Contact page route
router.get('/contact', (req, res) => {
  res.render('contact', { 
    title: 'UMKM Kue Basah - Contact Us',
    user: req.session.user || null
  });
});

module.exports = router;
