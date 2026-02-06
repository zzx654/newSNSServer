// auth/auth.route.js
const express = require('express')
const router = express.Router()

const authController = require('../../controllers/auth.controller')
const {
  accessToken,
  verifyToken,
} = require('../../middlewares/auth.middleware')

router.post('/signInWithToken', accessToken, verifyToken,authController.autoLogin)
router.post(
  '/requestPhoneAuthCode',
  authController.requestPhoneAuthCode
)
router.get('/ping', (req, res) => {
  res.json({ pong: true })
})
module.exports = router