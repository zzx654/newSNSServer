const express = require('express')
const router = express.Router()
const { accessToken, verifyToken } = require('../../middlewares/auth.middleware')

const postdetailController = require('../../controllers/postdetail.controller')

router.post('/getPost',accessToken,verifyToken,postdetailController.getPost)

router.post('/getVoteInfo',accessToken,verifyToken,postdetailController.getVoteInfo)

module.exports = router
