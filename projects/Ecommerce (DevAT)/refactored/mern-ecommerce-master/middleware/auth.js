const jwt = require('jsonwebtoken')
const { promisify } = require('util')

const verifyToken = promisify(jwt.verify)

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')
    if (!token) {
      return res.status(400).json({ msg: 'Invalid Authentication' })
    }

    const user = await verifyToken(
      token,
      process.env.ACCESS_TOKEN_SECRET
    )

    req.user = user
    return next()
  } catch (err) {
    return res.status(400).json({ msg: 'Invalid Authentication' })
  }
}

module.exports = auth