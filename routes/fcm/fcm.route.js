const express = require('express')
const router = express.Router()
const { accessToken, verifyToken } = require('../../middlewares/auth.middleware')
const fcmController = require('../../controllers/fcm.controller')

router.post(
  '/fcmToken',
  accessToken,
  verifyToken,
  fcmController.updateFcmToken
)

module.exports = router