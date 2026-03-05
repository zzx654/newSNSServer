const express = require('express')
const router = express.Router()
const { accessToken, verifyToken } = require('../../middlewares/auth.middleware')

const commentController = require('../../controllers/comment.controller')

router.post('/getComments',accessToken,verifyToken,commentController.getComments)

router.post('/getPopularComment',accessToken,verifyToken,commentController.getPopularComments)

module.exports = router