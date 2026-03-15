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
router.post(
    '/readAllNotifications',
      accessToken,
  verifyToken,
  notificationController.readAllNotifications

)

router.post(
    '/deleteNotifications',
      accessToken,
  verifyToken,
  notificationController.deleteNotifications

)





module.exports = router