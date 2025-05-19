const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get all products
router.get('/', async (req, res) => {
  try {
    const categoryId = req.query.category;
    const search = req.query.search;
    
    let query = `
      SELECT p.*, c.name AS category_name 
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
    `;
    
    let queryParams = [];
    
    // Apply filters
    if (categoryId) {
      query += ' WHERE p.category_id = ?';
      queryParams.push(categoryId);
      
      if (search) {
        query += ' AND p.name LIKE ?';
        queryParams.push(`%${search}%`);
      }
    } else if (search) {
      query += ' WHERE p.name LIKE ?';
      queryParams.push(`%${search}%`);
    }
    
    query += ' ORDER BY p.created_at DESC';
    
    const [products] = await pool.query(query, queryParams);
    const [categories] = await pool.query('SELECT * FROM categories');
    
    res.render('products/index', {
      title: 'Products - UMKM Kue Basah',
      products,
      categories,
      categoryId: categoryId || '',
      search: search || '',
      user: req.session.user || null
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).render('error', { error: 'Failed to load products' });
  }
});

// Get product details
router.get('/:id', async (req, res) => {
  const productId = req.params.id;
  
  try {
    const [product] = await pool.query(`
      SELECT p.*, c.name AS category_name 
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `, [productId]);
    
    if (product.length === 0) {
      return res.status(404).render('error', { error: 'Product not found' });
    }
    
    // Get related products from same category
    const [relatedProducts] = await pool.query(`
      SELECT * FROM products 
      WHERE category_id = ? AND id != ? 
      LIMIT 4
    `, [product[0].category_id, productId]);
    
    // Get product reviews
    const [reviews] = await pool.query(`
      SELECT r.*, u.name as user_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ?
      ORDER BY r.created_at DESC
    `, [productId]);
    
    // Calculate average rating
    const avgRating = reviews.length > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
      : 0;
    
    res.render('products/detail', {
      title: `${product[0].name} - UMKM Kue Basah`,
      product: product[0],
      relatedProducts,
      reviews,
      avgRating,
      user: req.session.user || null
    });
  } catch (error) {
    console.error('Error fetching product details:', error);
    res.status(500).render('error', { error: 'Failed to load product details' });
  }
});

// Add product review (authentication required)
router.post('/:id/reviews', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  
  const productId = req.params.id;
  const { rating, comment } = req.body;
  const userId = req.session.user.id;
  
  try {
    // Check if user already reviewed this product
    const [existingReview] = await pool.query(
      'SELECT * FROM reviews WHERE product_id = ? AND user_id = ?',
      [productId, userId]
    );
    
    if (existingReview.length > 0) {
      // Update existing review
      await pool.query(
        'UPDATE reviews SET rating = ?, comment = ? WHERE product_id = ? AND user_id = ?',
        [rating, comment, productId, userId]
      );
    } else {
      // Create new review
      await pool.query(
        'INSERT INTO reviews (product_id, user_id, rating, comment) VALUES (?, ?, ?, ?)',
        [productId, userId, rating, comment]
      );
    }
    
    res.redirect(`/products/${productId}`);
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).render('error', { error: 'Failed to add review' });
  }
});

module.exports = router;
