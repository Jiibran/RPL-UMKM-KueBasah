const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  res.redirect('/auth/login');
};

// Get cart items
router.get('/cart', async (req, res) => {
  if (!req.session.user) {
    return res.render('orders/cart', { 
      title: 'Shopping Cart - UMKM Kue Basah',
      cartItems: [],
      total: 0,
      user: null
    });
  }
  
  try {
    const [cartItems] = await pool.query(`
      SELECT c.*, p.name, p.price, p.image, (c.quantity * p.price) as subtotal
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ?
    `, [req.session.user.id]);
    
    const total = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
    
    res.render('orders/cart', { 
      title: 'Shopping Cart - UMKM Kue Basah',
      cartItems,
      total,
      user: req.session.user
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).render('error', { error: 'Failed to load shopping cart' });
  }
});

// Add to cart
router.post('/cart/add', isAuthenticated, async (req, res) => {
  const { product_id, quantity } = req.body;
  const userId = req.session.user.id;
  
  try {
    // Check if product exists and has stock
    const [product] = await pool.query('SELECT * FROM products WHERE id = ?', [product_id]);
    
    if (product.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    if (product[0].stock < quantity) {
      return res.status(400).json({ error: 'Not enough stock available' });
    }
    
    // Check if product already in cart
    const [cartItem] = await pool.query(
      'SELECT * FROM cart WHERE user_id = ? AND product_id = ?',
      [userId, product_id]
    );
    
    if (cartItem.length > 0) {
      // Update quantity
      const newQuantity = cartItem[0].quantity + parseInt(quantity);
      await pool.query(
        'UPDATE cart SET quantity = ? WHERE id = ?',
        [newQuantity, cartItem[0].id]
      );
    } else {
      // Add new cart item
      await pool.query(
        'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)',
        [userId, product_id, quantity]
      );
    }
    
    res.redirect('/orders/cart');
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).render('error', { error: 'Failed to add item to cart' });
  }
});

// Update cart item quantity
router.post('/cart/update', isAuthenticated, async (req, res) => {
  const { cart_id, quantity } = req.body;
  
  try {
    if (parseInt(quantity) <= 0) {
      await pool.query('DELETE FROM cart WHERE id = ? AND user_id = ?', [cart_id, req.session.user.id]);
    } else {
      await pool.query(
        'UPDATE cart SET quantity = ? WHERE id = ? AND user_id = ?',
        [quantity, cart_id, req.session.user.id]
      );
    }
    
    res.redirect('/orders/cart');
  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).render('error', { error: 'Failed to update cart' });
  }
});

// Remove item from cart
router.post('/cart/remove', isAuthenticated, async (req, res) => {
  const { cart_id } = req.body;
  
  try {
    await pool.query(
      'DELETE FROM cart WHERE id = ? AND user_id = ?',
      [cart_id, req.session.user.id]
    );
    
    res.redirect('/orders/cart');
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).render('error', { error: 'Failed to remove item from cart' });
  }
});

// Checkout page
router.get('/checkout', isAuthenticated, async (req, res) => {
  try {
    const [cartItems] = await pool.query(`
      SELECT c.*, p.name, p.price, p.image, (c.quantity * p.price) as subtotal
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ?
    `, [req.session.user.id]);
    
    if (cartItems.length === 0) {
      return res.redirect('/orders/cart');
    }
    
    const total = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
    
    // Get user details for shipping info
    const [user] = await pool.query('SELECT * FROM users WHERE id = ?', [req.session.user.id]);
    
    res.render('orders/checkout', { 
      title: 'Checkout - UMKM Kue Basah',
      cartItems,
      total,
      user: req.session.user,
      userDetails: user[0]
    });
  } catch (error) {
    console.error('Error loading checkout:', error);
    res.status(500).render('error', { error: 'Failed to load checkout page' });
  }
});

// Place order
router.post('/place-order', isAuthenticated, async (req, res) => {
  const { shipping_address, payment_method } = req.body;
  const userId = req.session.user.id;
  
  // Start transaction
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  
  try {
    // Get cart items
    const [cartItems] = await connection.query(`
      SELECT c.*, p.price, p.stock
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ?
    `, [userId]);
    
    if (cartItems.length === 0) {
      await connection.rollback();
      return res.redirect('/orders/cart');
    }
    
    // Calculate total
    const total = cartItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    
    // Check stock availability
    for (const item of cartItems) {
      if (item.stock < item.quantity) {
        await connection.rollback();
        return res.status(400).render('error', { 
          error: `Not enough stock available for some products. Please update your cart.` 
        });
      }
    }
    
    // Create order
    const [orderResult] = await connection.query(
      'INSERT INTO orders (user_id, total_amount, status, payment_method, shipping_address) VALUES (?, ?, ?, ?, ?)',
      [userId, total, 'pending', payment_method, shipping_address]
    );
    
    const orderId = orderResult.insertId;
    
    // Create order items and update stock
    for (const item of cartItems) {
      await connection.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [orderId, item.product_id, item.quantity, item.price]
      );
      
      // Update product stock
      await connection.query(
        'UPDATE products SET stock = stock - ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }
    
    // Clear cart
    await connection.query('DELETE FROM cart WHERE user_id = ?', [userId]);
    
    // Commit transaction
    await connection.commit();
    
    res.redirect(`/orders/${orderId}/success`);
  } catch (error) {
    await connection.rollback();
    console.error('Error placing order:', error);
    res.status(500).render('error', { error: 'Failed to place order' });
  } finally {
    connection.release();
  }
});

// Order success page
router.get('/:id/success', isAuthenticated, async (req, res) => {
  const orderId = req.params.id;
  const userId = req.session.user.id;
  
  try {
    // Verify order belongs to user
    const [order] = await pool.query(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [orderId, userId]
    );
    
    if (order.length === 0) {
      return res.status(404).render('error', { error: 'Order not found' });
    }
    
    res.render('orders/success', { 
      title: 'Order Success - UMKM Kue Basah',
      order: order[0],
      user: req.session.user
    });
  } catch (error) {
    console.error('Error loading order success:', error);
    res.status(500).render('error', { error: 'Failed to load order confirmation' });
  }
});

// User orders history
router.get('/history', isAuthenticated, async (req, res) => {
  try {
    const [orders] = await pool.query(`
      SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC
    `, [req.session.user.id]);
    
    res.render('orders/history', { 
      title: 'Order History - UMKM Kue Basah',
      orders,
      user: req.session.user
    });
  } catch (error) {
    console.error('Error loading order history:', error);
    res.status(500).render('error', { error: 'Failed to load order history' });
  }
});

// Order details
router.get('/:id', isAuthenticated, async (req, res) => {
  const orderId = req.params.id;
  const userId = req.session.user.id;
  
  try {
    // Verify order belongs to user
    const [order] = await pool.query(`
      SELECT * FROM orders WHERE id = ? AND user_id = ?
    `, [orderId, userId]);
    
    if (order.length === 0) {
      return res.status(404).render('error', { error: 'Order not found' });
    }
    
    // Get order items
    const [items] = await pool.query(`
      SELECT oi.*, p.name, p.image
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [orderId]);
    
    res.render('orders/detail', { 
      title: 'Order Detail - UMKM Kue Basah',
      order: order[0],
      items,
      user: req.session.user
    });
  } catch (error) {
    console.error('Error loading order details:', error);
    res.status(500).render('error', { error: 'Failed to load order details' });
  }
});

module.exports = router;
