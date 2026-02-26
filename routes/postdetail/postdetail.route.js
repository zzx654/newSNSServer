const express = require('express')
const router = express.Router()
const { accessToken, verifyToken } = require('../../middlewares/auth.middleware')

const postdetailController = require('../../controllers/postdetail.controller')

router.post('/getPost',accessToken,verifyToken,postdetailController.getPost)

module.exports = router
