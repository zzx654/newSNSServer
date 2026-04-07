const express = require('express')
const router = express.Router()
const { accessToken, verifyToken } = require('../../middlewares/auth.middleware')
const postlistController = require('../../controllers/postlist.controller')

router.post('/getNewPosts',accessToken,verifyToken,postlistController.getNewPosts)

router.post('/getNewTagPosts',accessToken,verifyToken,postlistController.getNewTagPosts)

router.post('/getPopularTagPosts',accessToken,verifyToken,postlistController.getPopularTagPosts)

router.post('/getUserPosts',accessToken,verifyToken,postlistController.getUserPosts)

module.exports = router