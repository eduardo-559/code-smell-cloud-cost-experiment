const Products = require('../models/productModel')

// Filter, sorting and paginating

class APIfeatures {
  constructor(query, queryString) {
    this.query = query
    this.queryString = queryString
  }

  filtering() {
    const excludedFields = ['page', 'sort', 'limit']

    const queryObj = Object.keys(this.queryString).reduce((acc, key) => {
      if (!excludedFields.includes(key)) {
        acc[key] = this.queryString[key]
      }
      return acc
    }, {})

    let queryStr = JSON.stringify(queryObj)
    queryStr = queryStr.replace(
      /\b(gte|gt|lt|lte|regex)\b/g,
      match => `$${match}`
    )

    this.query = this.query.find(JSON.parse(queryStr))
    return this
  }

  sorting() {
    const sort = this.queryString.sort
    const sortBy = sort ? sort.split(',').join(' ') : '-createdAt'

    this.query = this.query.sort(sortBy)
    return this
  }

  paginating() {
    const page = Number(this.queryString.page) || 1
    const limit = Number(this.queryString.limit) || 9
    const skip = (page - 1) * limit

    this.query = this.query.skip(skip).limit(limit)
    return this
  }
}

const productCtrl = {
  getProducts: async (req, res) => {
    try {
      const features = new APIfeatures(Products.find(), req.query)
        .filtering()
        .sorting()
        .paginating()

      const products = await features.query

      return res.json({
        status: 'success',
        result: products.length,
        products
      })
    } catch (err) {
      return res.status(500).json({ msg: err.message })
    }
  },

  createProduct: async (req, res) => {
    try {
      const {
        product_id,
        title,
        price,
        description,
        content,
        images,
        category
      } = req.body

      if (!images) return res.status(400).json({ msg: 'No image upload' })

      const existingProduct = await Products.findOne({ product_id })
      if (existingProduct) {
        return res
          .status(400)
          .json({ msg: 'This product already exists.' })
      }

      const newProduct = new Products({
        product_id,
        title: title.toLowerCase(),
        price,
        description,
        content,
        images,
        category
      })

      await newProduct.save()
      return res.json({ msg: 'Created a product' })
    } catch (err) {
      return res.status(500).json({ msg: err.message })
    }
  },

  deleteProduct: async (req, res) => {
    try {
      await Products.findByIdAndDelete(req.params.id)
      return res.json({ msg: 'Deleted a Product' })
    } catch (err) {
      return res.status(500).json({ msg: err.message })
    }
  },

  updateProduct: async (req, res) => {
    try {
      const {
        title,
        price,
        description,
        content,
        images,
        category
      } = req.body

      if (!images) return res.status(400).json({ msg: 'No image upload' })

      await Products.findOneAndUpdate(
        { _id: req.params.id },
        {
          title: title.toLowerCase(),
          price,
          description,
          content,
          images,
          category
        }
      )

      return res.json({ msg: 'Updated a Product' })
    } catch (err) {
      return res.status(500).json({ msg: err.message })
    }
  }
}

module.exports = productCtrl
