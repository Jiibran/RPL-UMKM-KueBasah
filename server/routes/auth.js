const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../config/database');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  res.redirect('/auth/login');
};

// Login page
router.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/');
  }
  res.render('auth/login', { 
    title: 'Login - UMKM Kue Basah',
    user: req.session.user || null, // Add this line
    error: null 
  });
});

// Register page
router.get('/register', (req, res) => {
  if (req.session.user) {
    return res.redirect('/');
  }
  res.render('auth/register', { 
    title: 'Register - UMKM Kue Basah',
    user: req.session.user || null, // Add this line
    error: null 
  });
});

// Login process
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (rows.length === 0) {
      return res.render('auth/login', { 
        title: 'Login - UMKM Kue Basah',
        user: req.session.user || null, // Add this line
        error: 'Invalid email or password' 
      });
    }
    
    const user = rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return res.render('auth/login', { 
        title: 'Login - UMKM Kue Basah',
        user: req.session.user || null, // Add this line
        error: 'Invalid email or password' 
      });
    }
    
    // Store user in session
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };
    
    if (user.role === 'admin') {
      return res.redirect('/admin/dashboard');
    }
    
    res.redirect('/');
  } catch (error) {
    console.error('Login error:', error);
    res.render('auth/login', { 
      title: 'Login - UMKM Kue Basah',
      user: req.session.user || null, // Add this line
      error: 'Server error, please try again later' 
    });
  }
});

// Register process
router.post('/register', async (req, res) => {
  const { name, email, password, phone, address } = req.body;
  
  try {
    // Check if email already exists
    const [existingUsers] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (existingUsers.length > 0) {
      return res.render('auth/register', { 
        title: 'Register - UMKM Kue Basah',
        error: 'Email already in use' 
      });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Insert new user
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, phone, address) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, phone, address]
    );
    
    if (result.affectedRows === 1) {
      // Auto login after registration
      const [newUser] = await pool.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
      
      req.session.user = {
        id: newUser[0].id,
        name: newUser[0].name,
        email: newUser[0].email,
        role: newUser[0].role
      };
      
      res.redirect('/');
    } else {
      throw new Error('Failed to create user');
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.render('auth/register', { 
      title: 'Register - UMKM Kue Basah',
      error: 'Server error, please try again later' 
    });
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// Profile page
router.get('/profile', isAuthenticated, async (req, res) => {
  try {
    // Get user details
    const [userDetails] = await pool.query(
      'SELECT * FROM users WHERE id = ?', 
      [req.session.user.id]
    );
    
    if (userDetails.length === 0) {
      return res.redirect('/auth/logout');
    }
    
    // Get user orders
    const [orders] = await pool.query(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', 
      [req.session.user.id]
    );
    
    // Get user addresses
    const [addresses] = await pool.query(
      'SELECT * FROM user_addresses WHERE user_id = ?', 
      [req.session.user.id]
    );
    
    // Messages for success/error feedback
    const messages = {
      success: req.session.success,
      error: req.session.error,
      passwordSuccess: req.session.passwordSuccess,
      passwordError: req.session.passwordError
    };
    
    // Clear session messages
    delete req.session.success;
    delete req.session.error;
    delete req.session.passwordSuccess;
    delete req.session.passwordError;
    
    res.render('auth/profile', {
      title: 'My Account - UMKM Kue Basah',
      user: userDetails[0],
      orders,
      addresses: addresses || [],
      messages
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).render('error', { 
      error: 'Failed to load profile data',
      user: req.session.user
    });
  }
});

// Update profile information
router.post('/profile/update', isAuthenticated, async (req, res) => {
  const { name, phone } = req.body;
  
  try {
    await pool.query(
      'UPDATE users SET name = ?, phone = ? WHERE id = ?',
      [name, phone, req.session.user.id]
    );
    
    // Update session data
    req.session.user.name = name;
    req.session.success = 'Profile information updated successfully';
    
    res.redirect('/auth/profile');
  } catch (error) {
    console.error('Profile update error:', error);
    req.session.error = 'Failed to update profile information';
    res.redirect('/auth/profile');
  }
});

// Change password
router.post('/profile/change-password', isAuthenticated, async (req, res) => {
  const { current_password, new_password, confirm_password } = req.body;
  
  // Validate password match
  if (new_password !== confirm_password) {
    req.session.passwordError = 'New passwords do not match';
    return res.redirect('/auth/profile#password');
  }
  
  try {
    // Get current user
    const [user] = await pool.query(
      'SELECT password FROM users WHERE id = ?',
      [req.session.user.id]
    );
    
    if (user.length === 0) {
      req.session.passwordError = 'User not found';
      return res.redirect('/auth/profile#password');
    }
    
    // Check current password
    const isMatch = await bcrypt.compare(current_password, user[0].password);
    
    if (!isMatch) {
      req.session.passwordError = 'Current password is incorrect';
      return res.redirect('/auth/profile#password');
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(new_password, salt);
    
    // Update password
    await pool.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, req.session.user.id]
    );
    
    req.session.passwordSuccess = 'Password changed successfully';
    res.redirect('/auth/profile#password');
  } catch (error) {
    console.error('Password change error:', error);
    req.session.passwordError = 'Failed to change password';
    res.redirect('/auth/profile#password');
  }
});

// Add address
router.post('/address/add', isAuthenticated, async (req, res) => {
  const { address_name, recipient_name, full_address, city, postal_code, phone } = req.body;
  
  try {
    await pool.query(
      `INSERT INTO user_addresses 
       (user_id, address_name, recipient_name, full_address, city, postal_code, phone) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.session.user.id, address_name, recipient_name, full_address, city, postal_code, phone]
    );
    
    req.session.success = 'Address added successfully';
    res.redirect('/auth/profile#addresses');
  } catch (error) {
    console.error('Add address error:', error);
    req.session.error = 'Failed to add address';
    res.redirect('/auth/profile#addresses');
  }
});

// Delete address
router.post('/address/delete/:id', isAuthenticated, async (req, res) => {
  const addressId = req.params.id;
  
  try {
    // Check if address belongs to user
    const [address] = await pool.query(
      'SELECT * FROM user_addresses WHERE id = ? AND user_id = ?',
      [addressId, req.session.user.id]
    );
    
    if (address.length === 0) {
      req.session.error = 'Address not found';
      return res.redirect('/auth/profile#addresses');
    }
    
    // Delete address
    await pool.query(
      'DELETE FROM user_addresses WHERE id = ?',
      [addressId]
    );
    
    req.session.success = 'Address deleted successfully';
    res.redirect('/auth/profile#addresses');
  } catch (error) {
    console.error('Delete address error:', error);
    req.session.error = 'Failed to delete address';
    res.redirect('/auth/profile#addresses');
  }
});

module.exports = router;
