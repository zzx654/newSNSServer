const express = require('express')
const router = express.Router()
const { accessToken, verifyToken } = require('../../middlewares/auth.middleware')
const postController = require('../../controllers/postlist.controller')

router.post('/getNewPosts',accessToken,verifyToken,postController.getNewPosts)

module.exports = router