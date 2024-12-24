const express = require("express");
const router = express.Router();
const multer=require('multer');
const path=require('path');
const fs=require('fs');
const Product = require("../../models/product.models");
let Category = require("../../models/category.models"); 
const Order = require("../../models/order.models");
const session = require('express-session');
const User = require("../../models/user.models");
const flash = require('connect-flash');



router.use(session({
  secret: 'yourSecretKey', // Replace with a secure secret key
  resave: false,
  saveUninitialized: true,
}));


// Middleware for flash messages
router.use(flash());


//image processing using multer 

const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Uploads directory created:', uploadsDir);
}

// Enhanced image processing using multer 
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir); // Use absolute path for uploads
  },
  filename: function (req, file, cb) {
    // Sanitize filename to prevent security issues
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    cb(null, `${Date.now()}-${sanitizedName}`); // Unique file name
  }
});

// Configure multer with file filter and error handling
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 5MB file size limit
  },
  fileFilter: function (req, file, cb) {
    // Accept image files only
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Error: Images Only! (jpeg, jpg, png, gif, webp)'));
    }
  }
});


// Products Management Routes
// Create Product (POST)
// Product creation route

router.post(
  "/admin/products/create",
  (req, res, next) => {
    // Use multer middleware with error handling
    upload.single('file')(req, res, function(err) {
      // Handle multer errors
      if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading (e.g., file too large)
        return res.status(400).render('admin/product-form', {
          layout: "admin/admin-layout",
          error: err.message,
          categories: []
        });
      } else if (err) {
        // An unknown error occurred
        return res.status(400).render('admin/product-form', {
          layout: "admin/admin-layout",
          error: err.message,
          categories: []
        });
      }
      
      // If no error, continue to the next middleware
      next();
    });
  },
  async (req, res) => {
    try {
      // Fetch categories for potential error rendering
      const categories = await Category.find();

      // Create new product
      let newProduct = new Product(req.body);
      
      // Handle file upload
      if (req.file) {
        console.log('File uploaded successfully:', {
          filename: req.file.filename,
          path: req.file.path,
          size: req.file.size
        });
        
        newProduct.picture = req.file.filename;
      } else {
        console.log('No file uploaded');
      }
      
      // Convert isFeatured to boolean
      newProduct.isFeatured = Boolean(req.body.isFeatured);
      
      // Save product
      await newProduct.save();
      
      // Redirect on success
      return res.redirect("/admin/products");
    } catch (error) {
      console.error('Product creation error:', error);
      
      // Remove uploaded file if product creation failed
      if (req.file) {
        fs.unlink(req.file.path, (unlinkError) => {
          if (unlinkError) console.error('Failed to remove uploaded file:', unlinkError);
        });
      }
      
      // Fetch categories for error rendering
      const categories = await Category.find();

      // Render error page
      return res.status(500).render('admin/product-form', {
        layout: "admin/admin-layout",
        error: 'Failed to create product',
        categories: categories
      });
    }
  }
);




//displaying products
router.get("/admin/products", async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = 5;
    const query = req.query.q || "";
    const sortField = req.query.sortField || "title";
    const sortOrder = req.query.sortOrder || "asc";
    const categoryFilter = req.query.category || "";

    const searchFilter = {
      $and: [
        query ? { title: { $regex: query, $options: 'i' } } : {},
        categoryFilter ? { category: categoryFilter } : {}
      ]
    };

    const sortOptions = { [sortField]: sortOrder === "asc" ? 1 : -1 };

    const [products, totalRecords, categories] = await Promise.all([
      Product.find(searchFilter)
        .populate('category')
        .sort(sortOptions)
        .limit(pageSize)
        .skip((page - 1) * pageSize),
      Product.countDocuments(searchFilter),
      Category.find()  // Fetch categories for the dropdown
    ]);

    const totalPages = Math.ceil(totalRecords / pageSize);

    res.render("admin/products", {
      layout: "admin/admin-layout",
      products,
      categories,  // Categories array passed to the view
      page,
      totalRecords,
      totalPages,
      sortField,
      sortOrder,
      searchQuery: query,
      categoryFilter,  // Passing categoryFilter for selected category
    });
   
  } catch (error) {
    console.error('Products listing error:', error);
    res.status(500).send('Error retrieving products');
  }
});


// Delete Product
router.get("/admin/products/delete/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    return res.redirect("back");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// Edit Product (GET)
router.get("/admin/products/edit/:id", async (req, res) => {
  let product = await Product.findById(req.params.id);
  
  let categories = await Category.find(); 
  res.render("admin/product-edit-form", {
    product,
    categories,
    layout: "admin/admin-layout",
  });
});
router.post("/admin/products/edit/:id", async (req, res) => {
  let product = await Product.findById(req.params.id).populate('category'); ;
  product.title = req.body.title;
  product.description = req.body.description;
  product.price = req.body.price;
  product.isFeatured = Boolean(req.body.isFeatured);
  product.category = req.body.category; 
  await product.save();
  return res.redirect("/admin/products");
});

// Create Product (GET)
router.get("/admin/products/create", async (req, res) => {
  try {
    // Fetch categories from the database
    const categories = await Category.find();
    
    // Render the product form with categories
    res.render("admin/product-form", { 
      layout: "admin/admin-layout", 
      categories: categories 
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});



// Categories Management Routes







router.get("/admin/category", async (req, res) => {
  let categories = await Category.find(); 
  res.render("admin/category", { layout: "admin/admin-layout", categories });
});


router.get("/admin/category/create", (req, res) => {
  res.render("admin/createcategory", { layout: "admin/admin-layout" });
});


router.post("/admin/category/create", async (req, res) => {
  let newCategory = new Category(req.body); 
  await newCategory.save();
  res.redirect("/admin/category");
});


router.get("/admin/category/edit/:id", async (req, res) => {
  let category = await Category.findById(req.params.id); 
  if (!category) {
    return res.status(404).send("Category not found");
  }
  res.render("admin/editcategory", {
    category,
    layout: "admin/admin-layout",
  });
});

router.post("/admin/category/edit/:id", async (req, res) => {
  let category = await Category.findById(req.params.id);
  if (!category) {
    return res.status(404).send("Category not found");
  }
  category.title = req.body.title;
  category.description = req.body.description;
  await category.save();
  res.redirect("/admin/category");
});

router.get("/admin/category/delete/:id", async (req, res) => {
  await Category.findByIdAndDelete(req.params.id);
  res.redirect("/admin/category");
});







// Order Management
router.get("/admin/orders", async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = 10;
    const query = req.query.q || ""; 
    const status = req.query.status || "";
    const sortField = req.query.sortField || "createdAt";
    const sortOrder = req.query.sortOrder || "desc";

    // Build search and filter conditions
    const searchFilter = {
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    };

    // Add status filter if provided
    if (status) {
      searchFilter.status = status;
    }

    const sortOptions = { [sortField]: sortOrder === "asc" ? 1 : -1 };

    const [orders, totalRecords] = await Promise.all([
      Order.find(searchFilter)
        .sort(sortOptions)
        .limit(pageSize)
        .skip((page - 1) * pageSize),
      Order.countDocuments(searchFilter)
    ]);

    const totalPages = Math.ceil(totalRecords / pageSize);

    res.render("admin/orders", {
      layout: "admin/admin-layout",
      orders,
      page,
      totalRecords,
      totalPages,
      sortField,
      sortOrder,
      searchQuery: query,
      statusFilter: status,
      view: 'orderList',
    });
  } catch (error) {
    console.error('Orders listing error:', error);
    res.status(500).send('Error retrieving orders');
  }
});

// Order Statistics Dashboard (with total sales calculation)
router.get("/admin/dashboard", async (req, res) => {
  try {
    // Fetch order statistics
    const totalOrders = await Order.countDocuments();
    const processingOrders = await Order.countDocuments({ status: 'Processing' });
    const shippedOrders = await Order.countDocuments({ status: 'Shipped' });
    const completedOrders = await Order.countDocuments({ status: 'Delivered' });
    const cancelledOrders = await Order.countDocuments({ status: 'Cancelled' });
    const [productCount, orderCount, categoryCount] = await Promise.all([
      Product.countDocuments(), // Total number of products
      Order.countDocuments(),   // Total number of orders
      Category.countDocuments() // Total number of categories
    ]);

    // Calculate total revenue from orders excluding 'Cancelled' status orders
    const totalRevenue = await Order.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } }, // Exclude cancelled orders
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);

    // Calculate total sales of all products (quantity sold)
    const totalSales = await Order.aggregate([
      { $unwind: '$cart.items' },
      { $match: { status: { $ne: 'Cancelled' } } }, // Exclude cancelled orders
      { $group: { _id: '$cart.items.product', totalQuantitySold: { $sum: '$cart.items.quantity' } } }
    ]);

    // If there are total sales data, map them to product names
    const productSales = [];
    for (const sale of totalSales) {
      const product = await Product.findById(sale._id);
      if (product) {
        productSales.push({
          productName: product.title,
          totalQuantitySold: sale.totalQuantitySold,
        });
      }
    }

    // Render the dashboard with data
    res.render("admin/dashboard", {
      layout: "admin/admin-layout",
      totalOrders,
      processingOrders,
      shippedOrders,
      completedOrders,
      cancelledOrders,
      productCount,   // Total products
      orderCount,     // Total orders
      categoryCount,  // Total categories
      totalRevenue: totalRevenue[0]?.total || 0,
      productSales,
      productCount,
      orderCount: totalOrders,
      categoryCount,
    });
  } catch (error) {
    console.error('Order dashboard error:', error);
    res.status(500).send('Error generating order dashboard');
  }
});

// Edit order route
router.get('/admin/orders/edit/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).send('Order not found');
    }
    res.render('admin/editOrder', { order ,layout:'admin/admin-layout'});
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Handle form submission and update order status
router.post('/admin/orders/edit/:id', async (req, res) => {
  try {
    const { status, notes } = req.body;
    const updatedOrder = await Order.findByIdAndUpdate(req.params.id, { status, notes }, { new: true });
    res.redirect('/admin/orders');  // Redirect back to the orders list or another page
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router;


