
const express = require("express");

let app = express();

const mongoose = require("mongoose");

var expressLayouts = require("express-ejs-layouts");

app.use(express.static("public"));


app.use(express.urlencoded());

app.set("view engine", "ejs");
app.use(expressLayouts);

let productsRouter = require("./routes/admin/products.router");


app.use(productsRouter);


app.get("/", async (req, res) => {
  let ProductModel = require("./models/product.models");
  let products = await ProductModel.find();
  res.render("home", { products });
});

let connectionString = "mongodb://localhost:27017/ideas";
mongoose
  .connect(connectionString)
  .then(() => {
    console.log(`Connected To: ${connectionString}`);
  })
  .catch((err) => {
    console.log(err.message);
  });
app.listen(5000, () => {
  console.log("Server started at localhost:5000");
});

