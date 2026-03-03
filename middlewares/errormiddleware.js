const errorMiddleware = (err, req, res, next) => {
  console.error(err)

   if (err.message === 'TOKEN_INVALID') {
    return res.status(200).json({
      isTokenValid: false,
      resultCode: 401,
      data: null
    })
  }

  res.status(200).json({
    isTokenValid: true,
    resultCode: 500,
    data: null
  })
}

module.exports = errorMiddleware