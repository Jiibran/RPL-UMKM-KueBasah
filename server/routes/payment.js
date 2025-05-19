const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  res.redirect('/auth/login');
};

// Initiate payment for an order
router.get('/initiate/:orderId', isAuthenticated, paymentController.initiatePayment);

// Display payment page
router.get('/:paymentId', isAuthenticated, paymentController.showPaymentPage);

// Process payment
router.post('/process/:paymentId', isAuthenticated, paymentController.processPayment);

// Payment success page
router.get('/success/:paymentId', isAuthenticated, paymentController.paymentSuccess);

// Payment failed page
router.get('/failed/:paymentId', isAuthenticated, paymentController.paymentFailed);

module.exports = router;
