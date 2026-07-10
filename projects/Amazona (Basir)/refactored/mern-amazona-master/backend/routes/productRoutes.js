import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import Product from '../models/productModel.js';
import { isAuth, isAdmin } from '../utils.js';

const productRouter = express.Router();

const PAGE_SIZE = 3;

const averageRating = (reviews) => {
  const total = reviews.reduce((acc, r) => acc + r.rating, 0);
  return total / reviews.length;
};

const buildQueryFilter = (searchQuery) => {
  if (!searchQuery || searchQuery === 'all') return {};
  return {
    name: {
      $regex: searchQuery,
      $options: 'i',
    },
  };
};

const buildCategoryFilter = (category) => {
  if (!category || category === 'all') return {};
  return { category };
};

const buildRatingFilter = (rating) => {
  if (!rating || rating === 'all') return {};
  return { rating: { $gte: Number(rating) } };
};

const buildPriceFilter = (price) => {
  if (!price || price === 'all') return {};
  const [min, max] = price.split('-').map(Number);
  return { price: { $gte: min, $lte: max } };
};

const buildSortOrder = (order) => {
  const sortMap = {
    featured: { featured: -1 },
    lowest: { price: 1 },
    highest: { price: -1 },
    toprated: { rating: -1 },
    newest: { createdAt: -1 },
  };
  return sortMap[order] || { _id: -1 };
};

const getPagination = (query, defaultPageSize) => {
  const pageSize = Number(query.pageSize) || defaultPageSize;
  const page = Number(query.page) || 1;
  return { page, pageSize, skip: pageSize * (page - 1) };
};

productRouter.get(
  '/',
  expressAsyncHandler(async (req, res) => {
    const products = await Product.find();
    res.send(products);
  })
);

productRouter.post(
  '/',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const timestamp = Date.now();
    const newProduct = new Product({
      name: 'sample name ' + timestamp,
      slug: 'sample-name-' + timestamp,
      image: '/images/p1.jpg',
      price: 0,
      category: 'sample category',
      brand: 'sample brand',
      countInStock: 0,
      rating: 0,
      numReviews: 0,
      description: 'sample description',
    });

    const product = await newProduct.save();
    res.send({ message: 'Product Created', product });
  })
);

productRouter.put(
  '/:id',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).send({ message: 'Product Not Found' });
    }

    product.name = req.body.name;
    product.slug = req.body.slug;
    product.price = req.body.price;
    product.image = req.body.image;
    product.images = req.body.images;
    product.category = req.body.category;
    product.brand = req.body.brand;
    product.countInStock = req.body.countInStock;
    product.description = req.body.description;

    await product.save();
    res.send({ message: 'Product Updated' });
  })
);

productRouter.delete(
  '/:id',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).send({ message: 'Product Not Found' });
    }

    await product.remove();
    res.send({ message: 'Product Deleted' });
  })
);

productRouter.post(
  '/:id/reviews',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).send({ message: 'Product Not Found' });
    }

    const alreadyReviewed = product.reviews.some((x) => x.name === req.user.name);
    if (alreadyReviewed) {
      return res
        .status(400)
        .send({ message: 'You already submitted a review' });
    }

    product.reviews.push({
      name: req.user.name,
      rating: Number(req.body.rating),
      comment: req.body.comment,
    });

    product.numReviews = product.reviews.length;
    product.rating = averageRating(product.reviews);

    const updatedProduct = await product.save();
    res.status(201).send({
      message: 'Review Created',
      review: updatedProduct.reviews[updatedProduct.reviews.length - 1],
      numReviews: product.numReviews,
      rating: product.rating,
    });
  })
);

productRouter.get(
  '/admin',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const { page, pageSize, skip } = getPagination(req.query, PAGE_SIZE);

    const [products, countProducts] = await Promise.all([
      Product.find().skip(skip).limit(pageSize),
      Product.countDocuments(),
    ]);

    res.send({
      products,
      countProducts,
      page,
      pages: Math.ceil(countProducts / pageSize),
    });
  })
);

productRouter.get(
  '/search',
  expressAsyncHandler(async (req, res) => {
    const { query } = req;
    const { page, pageSize, skip } = getPagination(query, PAGE_SIZE);

    const queryFilter = buildQueryFilter(query.query || '');
    const categoryFilter = buildCategoryFilter(query.category || '');
    const priceFilter = buildPriceFilter(query.price || '');
    const ratingFilter = buildRatingFilter(query.rating || '');
    const sortOrder = buildSortOrder(query.order || '');

    const filter = {
      ...queryFilter,
      ...categoryFilter,
      ...priceFilter,
      ...ratingFilter,
    };

    const [products, countProducts] = await Promise.all([
      Product.find(filter).sort(sortOrder).skip(skip).limit(pageSize),
      Product.countDocuments(filter),
    ]);

    res.send({
      products,
      countProducts,
      page,
      pages: Math.ceil(countProducts / pageSize),
    });
  })
);

productRouter.get(
  '/categories',
  expressAsyncHandler(async (req, res) => {
    const categories = await Product.find().distinct('category');
    res.send(categories);
  })
);

productRouter.get(
  '/slug/:slug',
  expressAsyncHandler(async (req, res) => {
    const product = await Product.findOne({ slug: req.params.slug });
    if (!product) {
      return res.status(404).send({ message: 'Product Not Found' });
    }
    res.send(product);
  })
);

productRouter.get(
  '/:id',
  expressAsyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).send({ message: 'Product Not Found' });
    }
    res.send(product);
  })
);

export default productRouter;
