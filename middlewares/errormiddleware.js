const errorMiddleware = (err, req, res, next) => {
  console.error(err)

  res.status(500).json({
    isTokenValid:true,
    resultCode: 500,
    data: null
  })
}

module.exports = errorMiddleware