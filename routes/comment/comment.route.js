const express = require('express')
const router = express.Router()
const { accessToken, verifyToken } = require('../../middlewares/auth.middleware')

const commentController = require('../../controllers/comment.controller')

router.post('/getComments',accessToken,verifyToken,commentController.getComments)

router.post('/getPopularComments',accessToken,verifyToken,commentController.getPopularComments)

router.post('/getNotificationComment',accessToken,verifyToken,commentController.getNotificationComment)

router.post('/postComment',accessToken,verifyToken,commentController.postComment)

router.post('/toggleLikeComment',accessToken,verifyToken,commentController.toggleLikeComment)

module.exports = router