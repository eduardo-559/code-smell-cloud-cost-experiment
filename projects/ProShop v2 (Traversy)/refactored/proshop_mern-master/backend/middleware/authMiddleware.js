import jwt from 'jsonwebtoken'
import asyncHandler from 'express-async-handler'
import User from '../models/userModel.js'

const getBearerToken = (req) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer')) return null
  const parts = authHeader.split(' ')
  return parts.length > 1 ? parts[1] : null
}

const protect = asyncHandler(async (req, res, next) => {
  const token = getBearerToken(req)

  if (!token) {
    res.status(401)
    throw new Error('Not authorized, no token')
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = await User.findById(decoded.id).select('-password')
    return next()
  } catch (error) {
    console.error(error)
    res.status(401)
    throw new Error('Not authorized, token failed')
  }
})

const admin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    res.status(401)
    throw new Error('Not authorized as an admin')
  }
  return next()
}

export { protect, admin }
