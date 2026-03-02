const express = require('express')
const router = express.Router()
const { accessToken, verifyToken } = require('../../middlewares/auth.middleware')

const postdetailController = require('../../controllers/postdetail.controller')

router.post('/getPost',accessToken,verifyToken,postdetailController.getPost)

router.post('/getVoteInfo',accessToken,verifyToken,postdetailController.getVoteInfo)

router.post('/vote',accessToken,verifyToken,postdetailController.vote)

router.post('/cancelVote',accessToken,verifyToken,postdetailController.cancelVote)


module.exports = router
