require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const ejsLayouts = require('express-ejs-layouts');
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(ejsLayouts);
app.set('layout', 'layout');

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'umkm-secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Routes
app.use('/', require('./server/routes/index'));
app.use('/auth', require('./server/routes/auth'));
app.use('/products', require('./server/routes/products'));
app.use('/orders', require('./server/routes/orders'));
app.use('/admin', require('./server/routes/admin'));
app.use('/api', require('./server/routes/api'));
app.use('/payment', require('./server/routes/payment'));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { 
    title: 'Error - UMKM Kue Basah', // Add default title
    error: 'Something went wrong!',
    user: req.session.user || null // Add user session
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
