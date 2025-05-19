const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// API for cart count
router.get('/cart/count', async (req, res) => {
  try {
    // If user is not logged in, return 0
    if (!req.session.user) {
      return res.json({ count: 0 });
    }
    
    const [result] = await pool.query(
      'SELECT SUM(quantity) as count FROM cart WHERE user_id = ?',
      [req.session.user.id]
    );
    
    const count = result[0].count || 0;
    res.json({ count });
  } catch (error) {
    console.error('Error getting cart count:', error);
    res.status(500).json({ error: 'Failed to get cart count' });
  }
});

// Other API routes can be added here

module.exports = router;
