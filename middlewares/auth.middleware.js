const { verifyAccessToken } = require('../utils/jwt')

function accessToken(req, res, next) {
  const authHeader = req.headers.authorization

  console.log(authHeader)
  if (!authHeader) {
    return res.status(401).json({
      isTokenValid: false,
      resultCode: 401,
      data: null
    })
  }

  const [type, token] = authHeader.split(' ')

  if (type !== 'Bearer' || !token) {
    return res.status(401).json({
      isTokenValid: false,
      resultCode: 401,
      data: null
    })
  }

  req.token = token
  next()
}

function verifyToken(req, res, next) {
  try {
    const decoded = verifyAccessToken(req.token)

    console.log(decoded)

    req.user = {
      userId: decoded.userId || null,
      platform: decoded.platform || null,
      account: decoded.account || null,
    }

    next()

  } catch (err) {
    return res.status(401).json({
      isTokenValid: false,
      resultCode: 401,
      data: null
    })
  }
}
module.exports = {
  accessToken,
  verifyToken,
}