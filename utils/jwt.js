const jwt = require('jsonwebtoken')

const signAccessToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: '20d' }
  )
}

const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET)
}

module.exports = {
  signAccessToken,
  verifyAccessToken
}
