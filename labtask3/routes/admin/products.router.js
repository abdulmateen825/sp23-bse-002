const express = require("express");
const adminRoutes = express.Router();
const ProductData = require("../../models/product.models");
const CategoryData = require("../../models/category.models");

// ================== Admin Dashboard ==================
adminRoutes.get("/admin/dashboard", (req, res) => {
  res.render("admin/dashboard", { layout: "admin/admin-layout" });
});

// ================== Product Management ==================

// View All Products
adminRoutes.get("/admin/products", async (req, res) => {
  try {
    const productList = await ProductData.find().populate('category');
    res.render("admin/products", { 
      layout: "admin/admin-layout", 
      products: productList 
      
      
    });
  } catch (serverError) {
    console.error(serverError);
    res.status(500).send("Failed to load products");
  }
});

// Create Product (GET)
adminRoutes.get("/admin/products/create", async (req, res) => {
  try {
    const availableCategories = await CategoryData.find();
    res.render("admin/product-form", {
      layout: "admin/admin-layout",
      categories: availableCategories,
    });
  } catch (serverError) {
    console.error(serverError);
    res.status(500).send("Unable to load product form");
  }
});

// Create Product (POST)
adminRoutes.post("/admin/products/create", async (req, res) => {
  try {
    const productRecord = new ProductData(req.body);
    productRecord.isFeatured = Boolean(req.body.isFeatured);
    await productRecord.save();
    res.redirect("/admin/products");
  } catch (serverError) {
    console.error(serverError);
    res.status(500).send("Failed to save new product");
  }
});

// Edit Product (GET)
adminRoutes.get("/admin/products/edit/:itemId", async (req, res) => {
  try {
    const productDetails = await ProductData.findById(req.params.itemId);
    const allCategoryOptions = await CategoryData.find();

    res.render("admin/product-edit-form", {
      product: productDetails,
      categories: allCategoryOptions,
      layout: "admin/admin-layout",
    });
  } catch (serverError) {
    console.error(serverError);
    res.status(500).send("Failed to load product details");
  }
});

// Edit Product (POST)
adminRoutes.post("/admin/products/edit/:itemId", async (req, res) => {
  try {
    const updatedProduct = await ProductData.findById(req.params.itemId).populate("category");

    updatedProduct.title = req.body.title;
    updatedProduct.description = req.body.description;
    updatedProduct.price = req.body.price;
    updatedProduct.isFeatured = Boolean(req.body.isFeatured);
    updatedProduct.category = req.body.category;

    await updatedProduct.save();
    res.redirect("/admin/products");
  } catch (serverError) {
    console.error(serverError);
    res.status(500).send("Unable to update product details");
  }
});

// Delete Product
adminRoutes.get("/admin/products/delete/:itemId", async (req, res) => {
  try {
    await ProductData.findByIdAndDelete(req.params.itemId);
    res.redirect("back");
  } catch (serverError) {
    console.error(serverError);
    res.status(500).send("Failed to delete product");
  }
});

// ================== Category Management ==================

// View All Categories
adminRoutes.get("/admin/category", async (req, res) => {
  try {
    const categoryList = await CategoryData.find();
    res.render("admin/category", { 
      layout: "admin/admin-layout", 
      categories: categoryList 
    });
  } catch (serverError) {
    console.error(serverError);
    res.status(500).send("Unable to fetch categories");
  }
});

// Create Category (GET)
adminRoutes.get("/admin/category/create", (req, res) => {
  res.render("admin/createcategory", { layout: "admin/admin-layout" });
});

// Create Category (POST)
adminRoutes.post("/admin/category/create", async (req, res) => {
  try {
    const newCategoryEntry = new CategoryData(req.body);
    await newCategoryEntry.save();
    res.redirect("/admin/category");
  } catch (serverError) {
    console.error(serverError);
    res.status(500).send("Failed to create new category");
  }
});

// Edit Category (GET)
adminRoutes.get("/admin/category/edit/:catId", async (req, res) => {
  try {
    const categoryInfo = await CategoryData.findById(req.params.catId);
    if (!categoryInfo) {
      return res.status(404).send("Category not found");
    }
    res.render("admin/editcategory", {
      category: categoryInfo,
      layout: "admin/admin-layout",
    });
  } catch (serverError) {
    console.error(serverError);
    res.status(500).send("Error loading category data");
  }
});

// Edit Category (POST)
adminRoutes.post("/admin/category/edit/:catId", async (req, res) => {
  try {
    const categoryToUpdate = await CategoryData.findById(req.params.catId);
    if (!categoryToUpdate) {
      return res.status(404).send("Category not found");
    }
    categoryToUpdate.title = req.body.title;
    categoryToUpdate.description = req.body.description;

    await categoryToUpdate.save();
    res.redirect("/admin/category");
  } catch (serverError) {
    console.error(serverError);
    res.status(500).send("Failed to update category");
  }
});

// Delete Category
adminRoutes.get("/admin/category/delete/:catId", async (req, res) => {
  try {
    await CategoryData.findByIdAndDelete(req.params.catId);
    res.redirect("/admin/category");
  } catch (serverError) {
    console.error(serverError);
    res.status(500).send("Unable to delete category");
  }
});

// ================== Export Router ==================
module.exports = adminRoutes;
