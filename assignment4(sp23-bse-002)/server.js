const express = require("express");
const mongoose = require("mongoose");
const expressLayouts = require("express-ejs-layouts");
const cookieParser = require("cookie-parser");
const session=require("express-session");
const ProductModel = require("./models/product.models");
const ordermodel=require("./models/order.models")
let productsRouter = require("./routes/admin/products.router");
const MongoStore=require("connect-mongo");
const authRoutes=require('./routes/auth.router');
const adminRoutes = require('./routes/admin.router');
const {isAuthenticated}=require('./middleware/auth');
const quizrouter=require('./routes/quiz.router');
let app = express();
const flash = require("connect-flash");
app.use("/uploads", express.static("uploads"));






// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

// View engine setup
app.set("view engine", "ejs");
app.use(expressLayouts);
//session
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production' }
    
  }));
  app.use((req, res, next) => {
    // Apply isAuthenticated middleware only for protected routes
    if (req.path.startsWith('/admin') ) {
        return isAuthenticated(req, res, next);
    }
    next();
});
  app.use(productsRouter);

  app.get('/admin/dashboard', isAuthenticated, (req, res) => {
    res.render('admin/dashboard', { 
        layout: 'admin/admin-layout',
        user: req.session.user 
    });
    
});



// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

// Set up view engine
app.set("view engine", "ejs");
app.use(expressLayouts);

// Session and Flash middleware
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production' }
}));
app.use(flash());

// Middleware to pass flash messages to all views
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    next();
});

app.use('/', authRoutes);
app.use(adminRoutes);
app.use('/',quizrouter);

// Middleware to add cart items count to all views
app.use((req, res, next) => {
    const cartItemsCount = req.cookies.cart ? Object.keys(JSON.parse(req.cookies.cart)).length : 0;
    res.locals.cartItemsCount = cartItemsCount;
    next();
});

// Routes
app.get("/", async (req, res) => {
    let products = await ProductModel.find();
    res.render("home", { products });
});

// Helper function to get cart from cookies
function getCartFromCookies(req) {
    try {
        return req.cookies.cart ? JSON.parse(req.cookies.cart) : {};
    } catch (error) {
        console.error("Error parsing cart cookie:", error);
        return {};
    }
}

// Cart route
app.get("/cart", async (req, res) => {
  try {
      let cart = getCartFromCookies(req);
      const productIds = Object.keys(cart).map(id => new mongoose.Types.ObjectId(id));
      let products = await ProductModel.find({ _id: { $in: productIds } });
      
      const productsWithQuantity = products.map(product => ({
          ...product.toObject(),
          quantity: cart[product._id] || 1
      }));

      res.render("cart", { products: productsWithQuantity });
  } catch (error) {
      console.error("Cart loading error:", error);
      res.status(500).send("Error loading cart");
  }
});

// Add to cart route
app.get("/add-to-cart/:id", async (req, res) => {
  try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
          req.flash('error_msg', 'Invalid product ID');
          return res.redirect('/');
      }

      let cart = getCartFromCookies(req);
      const productId = req.params.id.toString();
      cart[productId] = (cart[productId] || 0) + 1;
      res.cookie('cart', JSON.stringify(cart), { maxAge: 24 * 60 * 60 * 1000 }); 

      req.flash('success_msg', 'Item added to cart successfully!');
      res.redirect("/cart");
  } catch (error) {
      console.error("Add to cart error:", error);
      req.flash('error_msg', 'Error adding item to cart.');
      res.redirect('/');
  }
});

// Remove from cart route
app.get("/remove-from-cart/:id", async (req, res) => {
  try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
          req.flash('error_msg', 'Invalid product ID');
          return res.redirect('/cart');
      }

      let cart = getCartFromCookies(req);
      const productId = req.params.id.toString();
      delete cart[productId];
      res.cookie('cart', JSON.stringify(cart), { maxAge: 24 * 60 * 60 * 1000 });

      req.flash('success_msg', 'Item removed from cart.');
      res.redirect("/cart");
  } catch (error) {
      console.error("Remove from cart error:", error);
      req.flash('error_msg', 'Error removing item from cart.');
      res.redirect('/cart');
  }
});

// Update cart quantity route
app.post("/update-cart-quantity", async (req, res) => {
  try {
      const { productId, quantity } = req.body;
      
      if (!mongoose.Types.ObjectId.isValid(productId) || isNaN(quantity) || quantity < 1) {
          req.flash('error_msg', 'Invalid quantity.');
          return res.redirect("/cart");
      }

      let cart = getCartFromCookies(req);
      cart[productId.toString()] = parseInt(quantity);
      res.cookie('cart', JSON.stringify(cart), { maxAge: 24 * 60 * 60 * 1000 });

      req.flash('success_msg', 'Cart updated successfully.');
      res.redirect("/cart");
  } catch (error) {
      console.error("Update cart quantity error:", error);
      req.flash('error_msg', 'Error updating cart quantity.');
      res.redirect("/cart");
  }
});

// Checkout route
app.get('/checkout', (req, res) => {
    res.render('checkout', { cart: getCartFromCookies(req) });
});

// Calculate Total Function (Database Version)
async function calculateTotalFromCart(cart) {
    let total = 0;
    const productIds = Object.keys(cart);
    const products = await ProductModel.find({ _id: { $in: productIds } });

    products.forEach(product => {
        const quantity = cart[product._id.toString()] || 1;
        total += product.price * quantity;
    });

    return total;
}

// Handle Checkout Form Submission
app.post('/confirmation', async (req, res) => {
    const { name, email, address, paymentMethod } = req.body;

    if (!name || !email || !address || !paymentMethod) {
        req.flash('error_msg', 'All fields are required');
        return res.redirect('/checkout');
    }

    try {
        const cart = getCartFromCookies(req);

        if (!cart || Object.keys(cart).length === 0) {
            req.flash('error_msg', 'Your cart is empty.');
            return res.redirect('/checkout');
        }

        const total = await calculateTotalFromCart(cart);

        const order = new ordermodel({
            name,
            email,
            address,
            paymentMethod,
            cart,
            total,
        });

        await order.save();

        res.cookie('cart', JSON.stringify({}), { maxAge: 0 });

        req.flash('success_msg', 'Your order has been placed successfully!');
        res.redirect('/confirmation');
    } catch (error) {
        console.error('Checkout Error:', error);
        req.flash('error_msg', 'Something went wrong. Please try again.');
        res.redirect('/checkout');
    }
});

// Confirmation route
app.get('/confirmation', (req, res) => {
    req.flash('success_msg', 'Your order has been placed successfully!');
    res.render('confirmation', { message: 'Your order has been placed successfully!' });
});

let connectionString = "mongodb://localhost:27017/ideas";
mongoose
    .connect(connectionString)
    .then(() => console.log(`Connected To: ${connectionString}`))
    .catch((err) => console.log(err.message));

// Start server
app.listen(8000, () => {
    console.log("Server started at localhost:8000");
});
