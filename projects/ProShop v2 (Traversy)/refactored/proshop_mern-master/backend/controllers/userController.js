import asyncHandler from 'express-async-handler'
import generateToken from '../utils/generateToken.js'
import User from '../models/userModel.js'

const buildAuthResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  isAdmin: user.isAdmin,
  token: generateToken(user._id),
})

const buildUserResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  isAdmin: user.isAdmin,
})

const throwWithStatus = (res, status, message) => {
  res.status(status)
  throw new Error(message)
}

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  const user = await User.findOne({ email })

  if (!user) {
    throwWithStatus(res, 401, 'Invalid email or password')
  }

  const isMatch = await user.matchPassword(password)
  if (!isMatch) {
    throwWithStatus(res, 401, 'Invalid email or password')
  }

  res.json(buildAuthResponse(user))
})

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body

  const userExists = await User.findOne({ email })
  if (userExists) {
    throwWithStatus(res, 400, 'User already exists')
  }

  const user = await User.create({ name, email, password })

  if (!user) {
    throwWithStatus(res, 400, 'Invalid user data')
  }

  res.status(201).json(buildAuthResponse(user))
})

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)

  if (!user) {
    throwWithStatus(res, 404, 'User not found')
  }

  res.json(buildUserResponse(user))
})

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)

  if (!user) {
    throwWithStatus(res, 404, 'User not found')
  }

  user.name = req.body.name || user.name
  user.email = req.body.email || user.email
  if (req.body.password) user.password = req.body.password

  const updatedUser = await user.save()
  res.json(buildAuthResponse(updatedUser))
})

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({})
  res.json(users)
})

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)

  if (!user) {
    throwWithStatus(res, 404, 'User not found')
  }

  await user.remove()
  res.json({ message: 'User removed' })
})

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password')

  if (!user) {
    throwWithStatus(res, 404, 'User not found')
  }

  res.json(user)
})

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)

  if (!user) {
    throwWithStatus(res, 404, 'User not found')
  }

  user.name = req.body.name || user.name
  user.email = req.body.email || user.email
  user.isAdmin = req.body.isAdmin

  const updatedUser = await user.save()
  res.json(buildUserResponse(updatedUser))
})

export {
  authUser,
  registerUser,
  getUserProfile,
  updateUserProfile,
  getUsers,
  deleteUser,
  getUserById,
  updateUser,
}
