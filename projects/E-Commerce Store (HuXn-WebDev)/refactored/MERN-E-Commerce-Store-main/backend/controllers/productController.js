import asyncHandler from "../middlewares/asyncHandler.js";
import Product from "../models/productModel.js";

const REQUIRED_FIELDS = [
  ["name", "Name is required"],
  ["brand", "Brand is required"],
  ["description", "Description is required"],
  ["price", "Price is required"],
  ["category", "Category is required"],
  ["quantity", "Quantity is required"],
];

const validateFields = (fields) => {
  for (const [key, message] of REQUIRED_FIELDS) {
    if (!fields[key]) return { error: message };
  }
  return null;
};

const calculateAverageRating = (reviews) => {
  const total = reviews.reduce((acc, item) => acc + item.rating, 0);
  return total / reviews.length;
};

const buildKeywordFilter = (keyword) => {
  if (!keyword) return {};
  return {
    name: {
      $regex: keyword,
      $options: "i",
    },
  };
};

const buildFilterArgs = ({ checked, radio }) => {
  const args = {};
  if (checked && checked.length > 0) args.category = checked;
  if (radio && radio.length) args.price = { $gte: radio[0], $lte: radio[1] };
  return args;
};

const addProduct = asyncHandler(async (req, res) => {
  try {
    const validation = validateFields(req.fields);
    if (validation) return res.json(validation);

    const product = new Product({ ...req.fields });
    await product.save();
    return res.json(product);
  } catch (error) {
    console.error(error);
    return res.status(400).json(error.message);
  }
});

const updateProductDetails = asyncHandler(async (req, res) => {
  try {
    const validation = validateFields(req.fields);
    if (validation) return res.json(validation);

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { ...req.fields },
      { new: true }
    );

    await product.save();
    return res.json(product);
  } catch (error) {
    console.error(error);
    return res.status(400).json(error.message);
  }
});

const removeProduct = asyncHandler(async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    return res.json(product);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
});

const fetchProducts = asyncHandler(async (req, res) => {
  try {
    const pageSize = 6;
    const keyword = buildKeywordFilter(req.query.keyword);

    const count = await Product.countDocuments({ ...keyword });
    const products = await Product.find({ ...keyword }).limit(pageSize);

    return res.json({
      products,
      page: 1,
      pages: Math.ceil(count / pageSize),
      hasMore: false,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server Error" });
  }
});

const fetchProductById = asyncHandler(async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }
    return res.json(product);
  } catch (error) {
    console.error(error);
    return res.status(404).json({ error: "Product not found" });
  }
});

const fetchAllProducts = asyncHandler(async (req, res) => {
  try {
    const products = await Product.find({})
      .populate("category")
      .limit(12)
      .sort({ createAt: -1 });

    return res.json(products);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server Error" });
  }
});

const addProductReview = asyncHandler(async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    const userId = req.user._id.toString();
    const alreadyReviewed = product.reviews.some(
      (r) => r.user.toString() === userId
    );

    if (alreadyReviewed) {
      res.status(400);
      throw new Error("Product already reviewed");
    }

    product.reviews.push({
      name: req.user.username,
      rating: Number(rating),
      comment,
      user: req.user._id,
    });

    product.numReviews = product.reviews.length;
    product.rating = calculateAverageRating(product.reviews);

    await product.save();
    return res.status(201).json({ message: "Review added" });
  } catch (error) {
    console.error(error);
    return res.status(400).json(error.message);
  }
});

const fetchTopProducts = asyncHandler(async (req, res) => {
  try {
    const products = await Product.find({}).sort({ rating: -1 }).limit(4);
    return res.json(products);
  } catch (error) {
    console.error(error);
    return res.status(400).json(error.message);
  }
});

const fetchNewProducts = asyncHandler(async (req, res) => {
  try {
    const products = await Product.find().sort({ _id: -1 }).limit(5);
    return res.json(products);
  } catch (error) {
    console.error(error);
    return res.status(400).json(error.message);
  }
});

const filterProducts = asyncHandler(async (req, res) => {
  try {
    const args = buildFilterArgs(req.body);
    const products = await Product.find(args);
    return res.json(products);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server Error" });
  }
});

export {
  addProduct,
  updateProductDetails,
  removeProduct,
  fetchProducts,
  fetchProductById,
  fetchAllProducts,
  addProductReview,
  fetchTopProducts,
  fetchNewProducts,
  filterProducts,
};
