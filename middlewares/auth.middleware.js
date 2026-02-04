const jwt = require('jsonwebtoken')

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
    const decoded = jwt.verify(req.token, process.env.JWT_SECRET)

    req.user = {
      userId: decoded.userId || null,
      platform: decoded.platform || decoded.user?.platform || null,
      account: decoded.account || decoded.user?.account || null,
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