import mongoose from 'mongoose'
import dotenv from 'dotenv'
import colors from 'colors'
import users from './data/users.js'
import products from './data/products.js'
import User from './models/userModel.js'
import Product from './models/productModel.js'
import Order from './models/orderModel.js'
import connectDB from './config/db.js'

dotenv.config()

connectDB()

const exitWithError = (error) => {
  console.error(`${error}`.red.inverse)
  process.exit(1)
}

const clearDatabase = async () => {
  await Order.deleteMany()
  await Product.deleteMany()
  await User.deleteMany()
}

const importData = async () => {
  try {
    await clearDatabase()

    const createdUsers = await User.insertMany(users)
    const adminUserId = createdUsers[0]._id

    const sampleProducts = products.map((product) => ({
      ...product,
      user: adminUserId,
    }))

    await Product.insertMany(sampleProducts)

    console.log('Data Imported!'.green.inverse)
    process.exit()
  } catch (error) {
    exitWithError(error)
  }
}

const destroyData = async () => {
  try {
    await clearDatabase()

    console.log('Data Destroyed!'.red.inverse)
    process.exit()
  } catch (error) {
    exitWithError(error)
  }
}

const shouldDestroy = process.argv[2] === '-d'
;(shouldDestroy ? destroyData : importData)()
