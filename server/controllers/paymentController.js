
const pool = require('../config/database');
const paymentGateway = require('../utils/payment');

/**
 * Initiate a payment transaction for an order
 */
exports.initiatePayment = async (req, res) => {
  const { orderId } = req.params;
  const userId = req.session.user.id;

  try {
    // Check if order exists and belongs to the user
    const [orders] = await pool.query(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [orderId, userId]
    );

    if (orders.length === 0) {
      return res.status(404).render('error', { 
        error: 'Order not found',
        user: req.session.user
      });
    }

    const order = orders[0];
    
    // Don't initiate payment if order is already paid or cancelled
    if (order.status !== 'pending') {
      return res.redirect(`/orders/detail/${orderId}`);
    }

    // Get user data for payment
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    
    if (users.length === 0) {
      return res.status(404).render('error', { 
        error: 'User not found',
        user: req.session.user
      });
    }

    // Initiate payment with the payment gateway
    const paymentResult = await paymentGateway.initiatePayment(order, users[0]);

    if (!paymentResult.success) {
      return res.status(500).render('error', { 
        error: 'Failed to initiate payment',
        user: req.session.user
      });
    }

    // Save payment details to database
    await pool.query(
      `INSERT INTO payments 
      (order_id, payment_id, amount, status, created_at, expires_at) 
      VALUES (?, ?, ?, ?, NOW(), ?)`,
      [
        order.id,
        paymentResult.payment_id,
        order.total_amount,
        'pending',
        new Date(paymentResult.expiration)
      ]
    );

    // Redirect to payment page
    res.redirect(`/payment/${paymentResult.payment_id}`);

  } catch (error) {
    console.error('Error initiating payment:', error);
    res.status(500).render('error', { 
      error: 'Server error while processing payment',
      user: req.session.user
    });
  }
};

/**
 * Display payment page
 */
exports.showPaymentPage = async (req, res) => {
  const { paymentId } = req.params;
  
  try {
    // Get payment details
    const [payments] = await pool.query(
      `SELECT p.*, o.id as order_id, o.total_amount 
      FROM payments p
      JOIN orders o ON p.order_id = o.id
      WHERE p.payment_id = ?`,
      [paymentId]
    );

    if (payments.length === 0) {
      return res.status(404).render('error', { 
        error: 'Payment not found',
        user: req.session.user
      });
    }

    const payment = payments[0];
    
    // Check if payment is expired
    if (new Date() > new Date(payment.expires_at)) {
      return res.render('payment/expired', {
        title: 'Payment Expired - UMKM Kue Basah',
        payment,
        user: req.session.user
      });
    }

    // Render payment page
    res.render('payment/index', {
      title: 'Complete Payment - UMKM Kue Basah',
      payment,
      user: req.session.user
    });
  } catch (error) {
    console.error('Error showing payment page:', error);
    res.status(500).render('error', { 
      error: 'Server error while loading payment page',
      user: req.session.user
    });
  }
};

/**
 * Process payment
 */
exports.processPayment = async (req, res) => {
  const { paymentId } = req.params;
  const { payment_method, card_number, card_holder, expiry_date, cvv } = req.body;

  try {
    // Get payment details
    const [payments] = await pool.query(
      `SELECT p.*, o.id as order_id 
      FROM payments p
      JOIN orders o ON p.order_id = o.id
      WHERE p.payment_id = ?`,
      [paymentId]
    );

    if (payments.length === 0) {
      return res.status(404).render('error', { 
        error: 'Payment not found',
        user: req.session.user
      });
    }

    const payment = payments[0];
    
    // Check if payment is already processed
    if (payment.status !== 'pending') {
      return res.redirect(`/orders/detail/${payment.order_id}`);
    }

    // Process payment with payment gateway
    const paymentResult = await paymentGateway.processPayment(paymentId, {
      method: payment_method,
      // In a real implementation, we would send card details securely to payment gateway
      // but we're not storing them in our database
    });

    // Update payment status in database
    await pool.query(
      'UPDATE payments SET status = ?, transaction_id = ?, completed_at = NOW() WHERE payment_id = ?',
      [
        paymentResult.success ? 'completed' : 'failed',
        paymentResult.transaction_id || null,
        paymentId
      ]
    );

    if (paymentResult.success) {
      // Update order status
      await pool.query(
        'UPDATE orders SET status = ?, payment_method = ? WHERE id = ?',
        ['processing', payment_method, payment.order_id]
      );
      
      // Redirect to success page
      res.redirect(`/payment/success/${paymentId}`);
    } else {
      // Redirect to failed page
      res.redirect(`/payment/failed/${paymentId}`);
    }
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).render('error', { 
      error: 'Server error while processing payment',
      user: req.session.user
    });
  }
};

/**
 * Payment success page
 */
exports.paymentSuccess = async (req, res) => {
  const { paymentId } = req.params;
  
  try {
    // Get payment details
    const [payments] = await pool.query(
      `SELECT p.*, o.id as order_id 
      FROM payments p
      JOIN orders o ON p.order_id = o.id
      WHERE p.payment_id = ?`,
      [paymentId]
    );

    if (payments.length === 0) {
      return res.status(404).render('error', { 
        error: 'Payment not found',
        user: req.session.user
      });
    }

    const payment = payments[0];
    
    if (payment.status !== 'completed') {
      return res.redirect(`/payment/${paymentId}`);
    }

    // Render success page
    res.render('payment/success', {
      title: 'Payment Successful - UMKM Kue Basah',
      payment,
      user: req.session.user
    });
  } catch (error) {
    console.error('Error showing success page:', error);
    res.status(500).render('error', { 
      error: 'Server error',
      user: req.session.user
    });
  }
};

/**
 * Payment failed page
 */
exports.paymentFailed = async (req, res) => {
  const { paymentId } = req.params;
  
  try {
    // Get payment details
    const [payments] = await pool.query(
      `SELECT p.*, o.id as order_id 
      FROM payments p
      JOIN orders o ON p.order_id = o.id
      WHERE p.payment_id = ?`,
      [paymentId]
    );

    if (payments.length === 0) {
      return res.status(404).render('error', { 
        error: 'Payment not found',
        user: req.session.user
      });
    }

    const payment = payments[0];
    
    // Render failed page
    res.render('payment/failed', {
      title: 'Payment Failed - UMKM Kue Basah',
      payment,
      user: req.session.user
    });
  } catch (error) {
    console.error('Error showing failed page:', error);
    res.status(500).render('error', { 
      error: 'Server error',
      user: req.session.user
    });
  }
};
