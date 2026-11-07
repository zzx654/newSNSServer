// auth/auth.route.js
const express = require('express')
const router = express.Router()

const chatController = require('../../controllers/chat.controller')


const {
  accessToken,
  verifyToken,
} = require('../../middlewares/auth.middleware')

router.post(
    '/createChatRequest',
    accessToken,
    verifyToken,
    chatController.createChatRequest
)

module.exports = router