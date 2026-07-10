const Users = require('../models/userModel')
const Payments = require('../models/paymentModel')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  path: '/user/refresh_token',
  maxAge: 7 * 24 * 60 * 60 * 1000
}

const userCtrl = {
  register: async (req, res) => {
    try {
      const { name, email, password } = req.body

      const existingUser = await Users.findOne({ email })
      if (existingUser) {
        return res.status(400).json({ msg: 'The email already exists.' })
      }

      if (password.length < 6) {
        return res
          .status(400)
          .json({ msg: 'Password is at least 6 characters long.' })
      }

      const passwordHash = await bcrypt.hash(password, 10)
      const newUser = new Users({
        name,
        email,
        password: passwordHash
      })

      await newUser.save()

      const accesstoken = createAccessToken({ id: newUser._id })
      const refreshtoken = createRefreshToken({ id: newUser._id })

      res.cookie('refreshtoken', refreshtoken, REFRESH_COOKIE_OPTIONS)
      return res.json({ accesstoken })
    } catch (err) {
      return res.status(500).json({ msg: err.message })
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body

      const user = await Users.findOne({ email })
      if (!user) {
        return res.status(400).json({ msg: 'User does not exist.' })
      }

      const isMatch = await bcrypt.compare(password, user.password)
      if (!isMatch) {
        return res.status(400).json({ msg: 'Incorrect password.' })
      }

      const accesstoken = createAccessToken({ id: user._id })
      const refreshtoken = createRefreshToken({ id: user._id })

      res.cookie('refreshtoken', refreshtoken, REFRESH_COOKIE_OPTIONS)
      return res.json({ accesstoken })
    } catch (err) {
      return res.status(500).json({ msg: err.message })
    }
  },

  logout: async (req, res) => {
    try {
      res.clearCookie('refreshtoken', { path: '/user/refresh_token' })
      return res.json({ msg: 'Logged out' })
    } catch (err) {
      return res.status(500).json({ msg: err.message })
    }
  },

  refreshToken: async (req, res) => {
    try {
      const rfToken = req.cookies.refreshtoken
      if (!rfToken) {
        return res.status(400).json({ msg: 'Please Login or Register' })
      }

      const user = jwt.verify(
        rfToken,
        process.env.REFRESH_TOKEN_SECRET
      )

      const accesstoken = createAccessToken({ id: user.id })
      return res.json({ accesstoken })
    } catch (err) {
      return res.status(400).json({ msg: 'Please Login or Register' })
    }
  },

  getUser: async (req, res) => {
    try {
      const user = await Users.findById(req.user.id).select('-password')
      if (!user) {
        return res.status(400).json({ msg: 'User does not exist.' })
      }

      return res.json(user)
    } catch (err) {
      return res.status(500).json({ msg: err.message })
    }
  },

  addCart: async (req, res) => {
    try {
      const user = await Users.findById(req.user.id)
      if (!user) {
        return res.status(400).json({ msg: 'User does not exist.' })
      }

      await Users.findOneAndUpdate(
        { _id: req.user.id },
        { cart: req.body.cart }
      )

      return res.json({ msg: 'Added to cart' })
    } catch (err) {
      return res.status(500).json({ msg: err.message })
    }
  },

  history: async (req, res) => {
    try {
      const history = await Payments.find({ user_id: req.user.id })
      return res.json(history)
    } catch (err) {
      return res.status(500).json({ msg: err.message })
    }
  }
}

const createAccessToken = user => {
  return jwt.sign(
    user,
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: '11m' }
  )
}

const createRefreshToken = user => {
  return jwt.sign(
    user,
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  )
}

module.exports = userCtrl
