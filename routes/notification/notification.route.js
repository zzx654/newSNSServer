const express = require('express')
const router = express.Router()
const { accessToken, verifyToken } = require('../../middlewares/auth.middleware')
const notificationController = require('../../controllers/notification.controller')

router.post(
  '/getNotifications',
  accessToken,
  verifyToken,
  notificationController.getNotifications)

router.post(
    '/readNotification',
      accessToken,
  verifyToken,
  notificationController.readNotification

)

module.exports = router