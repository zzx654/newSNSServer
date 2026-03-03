const { verifyAccessToken } = require('../utils/jwt')

function accessToken(req, res, next) {
  const authHeader = req.headers.authorization

  console.log(authHeader)
  if (!authHeader) {
    return next(new Error('TOKEN_INVALID'))
  }

  const [type, token] = authHeader.split(' ')

  if (type !== 'Bearer' || !token) {
    return next(new Error('TOKEN_INVALID'))
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
    return next(new Error('TOKEN_INVALID'))
  
  }
}
module.exports = {
  accessToken,
  verifyToken,
}