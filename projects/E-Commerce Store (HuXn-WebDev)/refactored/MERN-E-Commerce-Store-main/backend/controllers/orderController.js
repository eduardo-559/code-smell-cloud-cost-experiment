import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";

const TAX_RATE = 0.15;
const FREE_SHIPPING_THRESHOLD = 100;
const SHIPPING_FEE = 10;

function calcPrices(orderItems) {
  const itemsPriceNumber = orderItems.reduce(
    (acc, item) => acc + item.price * item.qty,
    0
  );

  const shippingPriceNumber =
    itemsPriceNumber > FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;

  const taxPrice = (itemsPriceNumber * TAX_RATE).toFixed(2);

  const totalPrice = (
    itemsPriceNumber +
    shippingPriceNumber +
    parseFloat(taxPrice)
  ).toFixed(2);

  return {
    itemsPrice: itemsPriceNumber.toFixed(2),
    shippingPrice: shippingPriceNumber.toFixed(2),
    taxPrice,
    totalPrice,
  };
}

const buildOrderItemsFromDb = (orderItems, itemsFromDB, res) => {
  return orderItems.map((itemFromClient) => {
    const matchingItemFromDB = itemsFromDB.find(
      (itemFromDB) => itemFromDB._id.toString() === itemFromClient._id
    );

    if (!matchingItemFromDB) {
      res.status(404);
      throw new Error(`Product not found: ${itemFromClient._id}`);
    }

    return {
      ...itemFromClient,
      product: itemFromClient._id,
      price: matchingItemFromDB.price,
      _id: undefined,
    };
  });
};

const getOrderOrThrow = async (req, res, populate) => {
  const query = Order.findById(req.params.id);
  const order = populate ? await query.populate(...populate) : await query;

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  return order;
};

const createOrder = async (req, res) => {
  try {
    const { orderItems, shippingAddress, paymentMethod } = req.body;

    if (orderItems && orderItems.length === 0) {
      res.status(400);
      throw new Error("No order items");
    }

    const ids = orderItems.map((x) => x._id);
    const itemsFromDB = await Product.find({ _id: { $in: ids } });

    const dbOrderItems = buildOrderItemsFromDb(orderItems, itemsFromDB, res);

    const { itemsPrice, taxPrice, shippingPrice, totalPrice } =
      calcPrices(dbOrderItems);

    const order = new Order({
      orderItems: dbOrderItems,
      user: req.user._id,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    });

    const createdOrder = await order.save();
    return res.status(201).json(createdOrder);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).populate("user", "id username");
    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id });
    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const countTotalOrders = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    return res.json({ totalOrders });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const calculateTotalSales = async (req, res) => {
  try {
    const orders = await Order.find();
    const totalSales = orders.reduce(
      (sum, order) => sum + order.totalPrice,
      0
    );
    return res.json({ totalSales });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const calcualteTotalSalesByDate = async (req, res) => {
  try {
    const salesByDate = await Order.aggregate([
      { $match: { isPaid: true } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$paidAt" },
          },
          totalSales: { $sum: "$totalPrice" },
        },
      },
    ]);

    return res.json(salesByDate);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const findOrderById = async (req, res) => {
  try {
    const order = await getOrderOrThrow(req, res, [["user", "username email"]]);
    return res.json(order);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const markOrderAsPaid = async (req, res) => {
  try {
    const order = await getOrderOrThrow(req, res);

    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = {
      id: req.body.id,
      status: req.body.status,
      update_time: req.body.update_time,
      email_address: req.body.payer.email_address,
    };

    const updateOrder = await order.save();
    return res.status(200).json(updateOrder);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const markOrderAsDelivered = async (req, res) => {
  try {
    const order = await getOrderOrThrow(req, res);

    order.isDelivered = true;
    order.deliveredAt = Date.now();

    const updatedOrder = await order.save();
    return res.json(updatedOrder);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export {
  createOrder,
  getAllOrders,
  getUserOrders,
  countTotalOrders,
  calculateTotalSales,
  calcualteTotalSalesByDate,
  findOrderById,
  markOrderAsPaid,
  markOrderAsDelivered,
};
