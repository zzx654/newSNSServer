const express = require('express')
const router = express.Router()
const userController = require('../../controllers/user.controller')
const {
  accessToken,
  verifyToken,
} = require('../../middlewares/auth.middleware')

router.post(
    '/getSearchedUsers',
     accessToken,
      verifyToken,
      userController.getSearchedUsers
)

router.post(
    '/toggleFollowUser',
    accessToken,
    verifyToken,
    userController.toggleFollowUser
)

router.post(
  '/getUserInfo',
  accessToken,
  verifyToken,
  userController.getUserInfo
)

module.exports = router
