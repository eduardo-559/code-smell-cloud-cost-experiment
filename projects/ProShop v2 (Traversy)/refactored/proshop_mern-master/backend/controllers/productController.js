import asyncHandler from 'express-async-handler'
import Product from '../models/productModel.js'

const PAGE_SIZE = 10

const getKeywordFilter = (keyword) => {
  if (!keyword) return {}
  return {
    name: {
      $regex: keyword,
      $options: 'i',
    },
  }
}

const throwWithStatus = (res, status, message) => {
  res.status(status)
  throw new Error(message)
}

const updateProductFields = (product, fields) => {
  product.name = fields.name
  product.price = fields.price
  product.description = fields.description
  product.image = fields.image
  product.brand = fields.brand
  product.category = fields.category
  product.countInStock = fields.countInStock
}

const calcAverageRating = (reviews) => {
  const total = reviews.reduce((acc, item) => acc + item.rating, 0)
  return total / reviews.length
}

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
  const page = Number(req.query.pageNumber) || 1
  const keyword = getKeywordFilter(req.query.keyword)

  const count = await Product.countDocuments({ ...keyword })
  const products = await Product.find({ ...keyword })
    .limit(PAGE_SIZE)
    .skip(PAGE_SIZE * (page - 1))

  res.json({ products, page, pages: Math.ceil(count / PAGE_SIZE) })
})

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
  if (!product) throwWithStatus(res, 404, 'Product not found')
  res.json(product)
})

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
  if (!product) throwWithStatus(res, 404, 'Product not found')

  await product.remove()
  res.json({ message: 'Product removed' })
})

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = asyncHandler(async (req, res) => {
  const product = new Product({
    name: 'Sample name',
    price: 0,
    user: req.user._id,
    image: '/images/sample.jpg',
    brand: 'Sample brand',
    category: 'Sample category',
    countInStock: 0,
    numReviews: 0,
    description: 'Sample description',
  })

  const createdProduct = await product.save()
  res.status(201).json(createdProduct)
})

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = asyncHandler(async (req, res) => {
  const fields = {
    name: req.body.name,
    price: req.body.price,
    description: req.body.description,
    image: req.body.image,
    brand: req.body.brand,
    category: req.body.category,
    countInStock: req.body.countInStock,
  }

  const product = await Product.findById(req.params.id)
  if (!product) throwWithStatus(res, 404, 'Product not found')

  updateProductFields(product, fields)

  const updatedProduct = await product.save()
  res.json(updatedProduct)
})

// @desc    Create new review
// @route   POST /api/products/:id/reviews
// @access  Private
const createProductReview = asyncHandler(async (req, res) => {
  const ratingNumber = Number(req.body.rating)
  const { comment } = req.body

  const product = await Product.findById(req.params.id)
  if (!product) throwWithStatus(res, 404, 'Product not found')

  const userId = req.user._id.toString()
  const alreadyReviewed = product.reviews.some(
    (r) => r.user.toString() === userId
  )
  if (alreadyReviewed) throwWithStatus(res, 400, 'Product already reviewed')

  product.reviews.push({
    name: req.user.name,
    rating: ratingNumber,
    comment,
    user: req.user._id,
  })

  product.numReviews = product.reviews.length
  product.rating = calcAverageRating(product.reviews)

  await product.save()
  res.status(201).json({ message: 'Review added' })
})

// @desc    Get top rated products
// @route   GET /api/products/top
// @access  Public
const getTopProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({}).sort({ rating: -1 }).limit(3)
  res.json(products)
})

export {
  getProducts,
  getProductById,
  deleteProduct,
  createProduct,
  updateProduct,
  createProductReview,
  getTopProducts,
}
