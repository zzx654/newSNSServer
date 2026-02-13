const { verifyAccessToken } = require('../utils/jwt')

function accessToken(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res.status(401).json({ message: 'No authorization header' })
  }

  const [type, token] = authHeader.split(' ')
  if (type !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Invalid authorization format' })
  }

  req.token = token
  next()
}

function verifyToken(req, res, next) {
  try {
    const decoded = verifyAccessToken(req.token)

    req.user = {
      userId: decoded.userId || null,
      platform: decoded.platform || null,
      account: decoded.account || null,
    }

    req.isTokenValid = true
    next()
  } catch (err) {
    req.isTokenValid = false
    next()
  }
}

module.exports = {
  accessToken,
  verifyToken,
}