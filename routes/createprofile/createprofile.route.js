const express = require('express')
const createProfileController = require('../../controllers/createprofile.controller')
const router = express.Router()
const {
  accessToken,
  verifyToken,
} = require('../../middlewares/auth.middleware')
const fileUpload = require('../../middlewares/fileupload.middleware')
router.post('/createProfile',accessToken,verifyToken,fileUpload.single('media'),createProfileController.createProfile)
router.post('/checkNickname',createProfileController.checkNickname)

module.exports = router