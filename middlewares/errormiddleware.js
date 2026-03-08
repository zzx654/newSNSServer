const multer = require('multer')
const errorMiddleware = (err, req, res, next) => {
  console.error(err)

   if (err.message === 'TOKEN_INVALID') {
    return res.status(200).json({
      isTokenValid: false,
      resultCode: 401,
      data: null
    })
  }

    if (err instanceof multer.MulterError) {

    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(200).json({
  isTokenValid: true,
  resultCode: 400,
  data: {
    message: '파일 크기는 10MB 이하만 가능합니다.'
  }
      })
    }

  }

  res.status(200).json({
    isTokenValid: true,
    resultCode: 500,
    data: null
  })
}

module.exports = errorMiddleware