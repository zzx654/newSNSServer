const express = require('express')
const router = express.Router()
const { accessToken, verifyToken } = require('../../middlewares/auth.middleware')
const fileUpload = require('../../middlewares/fileupload.middleware')
const postController = require('../../controllers/post.controller')


/**router.post(
  '/uploadPost',
  accessToken,
  verifyToken,
  fileUpload.fields([
    { name: 'image', maxCount: 10 },  // 이미지 배열
    { name: 'audio', maxCount: 1 },   // 오디오 1개

  ]),
  postController.uploadPost
)**/
router.post(
  '/uploadPost',
  accessToken,
  verifyToken,
  fileUpload.array('media', 10), 
  postController.uploadPost
)

router.post(
  '/editPost',
  accessToken,
  verifyToken,
  fileUpload.fields([
    { name: 'image', maxCount: 10 },  // 이미지 배열
    { name: 'audio', maxCount: 1 },   // 오디오 1개

  ]),
  postController.editPost
)
router.post(
  '/postVideo',
  fileUpload.single('video'), postController.uploadVideo
)
module.exports = router