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

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.role === 'admin') {
    return next();
  }
  res.status(403).render('error', { error: 'Unauthorized access' });
};

// Admin dashboard
router.get('/dashboard', isAuthenticated, isAdmin, async (req, res) => {
  try {
    // Get counts for dashboard
    const [productCount] = await pool.query('SELECT COUNT(*) as count FROM products');
    const [orderCount] = await pool.query('SELECT COUNT(*) as count FROM orders');
    const [userCount] = await pool.query('SELECT COUNT(*) as count FROM users WHERE role = "user"');
    const [recentOrders] = await pool.query(`
      SELECT o.*, u.name AS user_name 
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC LIMIT 5
    `);
    
    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      user: req.session.user,
      currentPath: req.path, // Add this line
      stats: {
        products: productCount[0].count,
        orders: orderCount[0].count,
        customers: userCount[0].count
      },
      recentOrders
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).render('error', { 
      title: 'Error', 
      user: req.session.user, 
      currentPath: req.path, // Add this line
      error: 'Failed to load dashboard data' 
    });
  }
});

// Products management
router.get('/products', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const [products] = await pool.query(`
      SELECT p.*, c.name AS category_name 
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.created_at DESC
    `);
    
    const [categories] = await pool.query('SELECT * FROM categories');
    
    res.render('admin/products', {
      title: 'Product Management',
      user: req.session.user,
      currentPath: req.path, // Add this line
      products,
      categories
    });
  } catch (error) {
    console.error('Products management error:', error);
    res.status(500).render('error', { 
      title: 'Error', 
      user: req.session.user, 
      currentPath: req.path, // Add this line
      error: 'Failed to load products data' 
    });
  }
});

// Add product
router.post('/products', isAuthenticated, isAdmin, async (req, res) => {
  const { name, description, price, category_id, stock, is_featured } = req.body;
  const image = req.body.image || 'default-product.jpg';
  
  try {
    await pool.query(
      'INSERT INTO products (name, description, price, image, category_id, stock, is_featured) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, description, price, image, category_id, stock, is_featured ? 1 : 0]
    );
    
    res.redirect('/admin/products');
  } catch (error) {
    console.error('Add product error:', error);
    res.status(500).render('error', { error: 'Failed to add product' });
  }
});

// Edit product
router.post('/products/:id', isAuthenticated, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, description, price, category_id, stock, is_featured } = req.body;
  const image = req.body.image;
  
  try {
    if (image) {
      await pool.query(
        'UPDATE products SET name = ?, description = ?, price = ?, image = ?, category_id = ?, stock = ?, is_featured = ? WHERE id = ?',
        [name, description, price, image, category_id, stock, is_featured ? 1 : 0, id]
      );
    } else {
      await pool.query(
        'UPDATE products SET name = ?, description = ?, price = ?, category_id = ?, stock = ?, is_featured = ? WHERE id = ?',
        [name, description, price, category_id, stock, is_featured ? 1 : 0, id]
      );
    }
    
    res.redirect('/admin/products');
  } catch (error) {
    console.error('Edit product error:', error);
    res.status(500).render('error', { error: 'Failed to update product' });
  }
});

// Delete product
router.get('/products/:id/delete', isAuthenticated, isAdmin, async (req, res) => {
  const { id } = req.params;
  
  try {
    await pool.query('DELETE FROM products WHERE id = ?', [id]);
    res.redirect('/admin/products');
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).render('error', { error: 'Failed to delete product' });
  }
});

// Orders management
router.get('/orders', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const [orders] = await pool.query(`
      SELECT o.*, u.name AS customer_name 
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `);
    
    res.render('admin/orders', {
      title: 'Order Management',
      user: req.session.user,
      currentPath: req.path, // Add this line
      orders
    });
  } catch (error) {
    console.error('Orders management error:', error);
    res.status(500).render('error', { 
      title: 'Error', 
      user: req.session.user, 
      currentPath: req.path, // Add this line
      error: 'Failed to load orders data' 
    });
  }
});

// Order details
router.get('/orders/:id', isAuthenticated, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const [orderRows] = await pool.query(`
      SELECT o.id, o.user_id, o.total_amount, o.status, o.payment_method,
             o.shipping_address AS shipping_full_address,
             o.created_at, o.updated_at, o.admin_notes,
             u.name AS customer_name, u.email AS customer_email, u.phone AS customer_phone,
             u.name AS shipping_recipient_name, -- Default recipient to customer's name
             'N/A' AS shipping_city,
             'N/A' AS shipping_postal_code,
             'N/A' AS shipping_phone_number
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `, [id]);

    if (!orderRows || orderRows.length === 0) {
      return res.status(404).render('error', { 
        title: 'Pesanan Tidak Ditemukan',
        user: req.session.user,
        currentPath: req.path,
        error: 'Pesanan tidak ditemukan.' 
      });
    }
    const order = orderRows[0]; // Mengambil objek pesanan tunggal

    const [orderItems] = await pool.query(`
      SELECT oi.*, p.name AS product_name, p.image AS product_image, oi.price AS item_price, oi.quantity
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [id]);
    
    res.render('admin/order-detail', {
      title: `Detail Pesanan - #${order.id}`,
      user: req.session.user,
      currentPath: req.path,
      order: order, // Objek pesanan tunggal
      items: orderItems, // Array item pesanan
      admin_notes: order.admin_notes || '' // Pass admin_notes to the view
    });
  } catch (error) {
    console.error('Kesalahan detail pesanan:', error);
    res.status(500).render('error', { 
      title: 'Kesalahan Server',
      user: req.session.user, 
      currentPath: req.path,
      error: 'Gagal memuat detail pesanan.' 
    });
  }
});

// Update order status
router.post('/orders/:id/status', isAuthenticated, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  try {
    await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
    res.redirect(`/admin/orders/${id}`);
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).render('error', { error: 'Failed to update order status' });
  }
});

// Add/Update admin notes for an order
router.post('/orders/:id/notes', isAuthenticated, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { admin_notes } = req.body;

  try {
    await pool.query('UPDATE orders SET admin_notes = ? WHERE id = ?', [admin_notes, id]);
    res.redirect(`/admin/orders/${id}?note_saved=true`);
  } catch (error) {
    console.error('Update admin notes error:', error);
    res.status(500).render('error', { 
      title: 'Kesalahan Server',
      user: req.session.user,
      currentPath: req.path, // It's good practice to pass currentPath to error views too
      error: 'Gagal menyimpan catatan admin.' 
    });
  }
});

// Categories management
router.get('/categories', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const [categories] = await pool.query('SELECT * FROM categories ORDER BY name ASC');
    
    res.render('admin/categories', { // Assuming you will create 'admin/categories.ejs'
      title: 'Category Management',
      user: req.session.user,
      currentPath: req.path,
      categories: categories,
      message: req.query.message // For success/error messages after actions
    });
  } catch (error) {
    console.error('Categories management error:', error);
    res.status(500).render('error', { 
      title: 'Error', 
      user: req.session.user, 
      currentPath: req.path,
      error: 'Failed to load categories data' 
    });
  }
});

// Add new category form (optional, can be part of the main categories page)
router.get('/categories/add', isAuthenticated, isAdmin, (req, res) => {
  res.render('admin/add-category', { // Assuming you will create 'admin/add-category.ejs'
    title: 'Add New Category',
    user: req.session.user,
    currentPath: req.path,
    error: null
  });
});

// Add new category
router.post('/categories', isAuthenticated, isAdmin, async (req, res) => {
  const { name, description } = req.body;
  try {
    await pool.query('INSERT INTO categories (name, description) VALUES (?, ?)', [name, description]);
    res.redirect('/admin/categories?message=Category added successfully');
  } catch (error) {
    console.error('Add category error:', error);
    // Render the add category form again with an error message
    res.render('admin/add-category', { 
        title: 'Add New Category',
        user: req.session.user,
        currentPath: '/admin/categories/add', 
        error: 'Failed to add category. Please try again. Make sure the name is unique.'
    });
  }
});

// Edit category form
router.get('/categories/:id/edit', isAuthenticated, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const [categoryRows] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
    if (categoryRows.length === 0) {
      return res.status(404).render('error', { title: 'Error', user: req.session.user, currentPath: req.path, error: 'Category not found' });
    }
    res.render('admin/edit-category', { // Assuming you will create 'admin/edit-category.ejs'
      title: 'Edit Category',
      user: req.session.user,
      currentPath: req.path,
      category: categoryRows[0],
      error: null
    });
  } catch (error) {
    console.error('Edit category form error:', error);
    res.status(500).render('error', { title: 'Error', user: req.session.user, currentPath: req.path, error: 'Failed to load category for editing' });
  }
});

// Update category
router.post('/categories/:id/edit', isAuthenticated, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  try {
    await pool.query('UPDATE categories SET name = ?, description = ? WHERE id = ?', [name, description, id]);
    res.redirect('/admin/categories?message=Category updated successfully');
  } catch (error) {
    console.error('Update category error:', error);
    const [categoryRows] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]); // Refetch for form repopulation
     res.render('admin/edit-category', { 
        title: 'Edit Category',
        user: req.session.user,
        currentPath: req.path,
        category: categoryRows.length > 0 ? categoryRows[0] : { id, name, description }, // provide category data back to form
        error: 'Failed to update category. Please try again. Make sure the name is unique.'
    });
  }
});

// Delete category
router.get('/categories/:id/delete', isAuthenticated, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    // Optional: Check if any products are using this category before deleting
    const [products] = await pool.query('SELECT COUNT(*) as count FROM products WHERE category_id = ?', [id]);
    if (products[0].count > 0) {
        return res.redirect('/admin/categories?message=Cannot delete category: It is currently in use by products.');
    }
    await pool.query('DELETE FROM categories WHERE id = ?', [id]);
    res.redirect('/admin/categories?message=Category deleted successfully');
  } catch (error) {
    console.error('Delete category error:', error);
    res.redirect('/admin/categories?message=Error deleting category: ' + error.message);
  }
});

// Customer Management
router.get('/customers', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const [customers] = await pool.query(
      "SELECT id, name, email, phone, created_at FROM users WHERE role = 'user' ORDER BY created_at DESC"
    );
    res.render('admin/customers', {
      title: 'Manajemen Pelanggan',
      user: req.session.user,
      currentPath: req.path,
      customers: customers,
      message: req.query.message
    });
  } catch (error) {
    console.error('Kesalahan manajemen pelanggan:', error);
    res.status(500).render('error', {
      title: 'Kesalahan Server',
      user: req.session.user,
      currentPath: req.path,
      error: 'Gagal memuat data pelanggan.'
    });
  }
});

// Reports Page
router.get('/reports', isAuthenticated, isAdmin, async (req, res) => {
  try {
    res.render('admin/reports', {
      title: 'Laporan',
      user: req.session.user,
      currentPath: req.path
    });
  } catch (error) {
    console.error('Kesalahan halaman laporan:', error);
    res.status(500).render('error', {
      title: 'Kesalahan Server',
      user: req.session.user,
      currentPath: req.path,
      error: 'Gagal memuat halaman laporan.'
    });
  }
});

module.exports = router;
