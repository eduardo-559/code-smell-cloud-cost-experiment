import asyncHandler from 'express-async-handler'
import Order from '../models/orderModel.js'

const throwWithStatus = (res, status, message) => {
  res.status(status)
  throw new Error(message)
}

const getOrderOrThrow = async (req, res, populate) => {
  const query = Order.findById(req.params.id)
  const order = populate ? await query.populate(...populate) : await query
  if (!order) throwWithStatus(res, 404, 'Order not found')
  return order
}

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const addOrderItems = asyncHandler(async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
  } = req.body

  if (!orderItems || orderItems.length === 0) {
    throwWithStatus(res, 400, 'No order items')
  }

  const order = new Order({
    orderItems,
    user: req.user._id,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
  })

  const createdOrder = await order.save()
  res.status(201).json(createdOrder)
})

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
  const order = await getOrderOrThrow(req, res, [['user', 'name email']])
  res.json(order)
})

// @desc    Update order to paid
// @route   GET /api/orders/:id/pay
// @access  Private
const updateOrderToPaid = asyncHandler(async (req, res) => {
  const order = await getOrderOrThrow(req, res)

  order.isPaid = true
  order.paidAt = Date.now()
  order.paymentResult = {
    id: req.body.id,
    status: req.body.status,
    update_time: req.body.update_time,
    email_address: req.body.payer.email_address,
  }

  const updatedOrder = await order.save()
  res.json(updatedOrder)
})

// @desc    Update order to delivered
// @route   GET /api/orders/:id/deliver
// @access  Private/Admin
const updateOrderToDelivered = asyncHandler(async (req, res) => {
  const order = await getOrderOrThrow(req, res)

  order.isDelivered = true
  order.deliveredAt = Date.now()

  const updatedOrder = await order.save()
  res.json(updatedOrder)
})

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
  res.json(orders)
})

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({}).populate('user', 'id name')
  res.json(orders)
})

export {
  addOrderItems,
  getOrderById,
  updateOrderToPaid,
  updateOrderToDelivered,
  getMyOrders,
  getOrders,
}
