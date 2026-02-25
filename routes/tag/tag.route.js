const express = require('express')
const router = express.Router()
const tagController = require('../../controllers/tag.controller')
const {
  accessToken,
  verifyToken,
} = require('../../middlewares/auth.middleware')
router.post(
    '/searchTag',
     accessToken,
      verifyToken,
      tagController.searchTag

)

router.post(
  '/getTags',accessToken,verifyToken,tagController.getTags
)

router.post(
  '/toggleFavoriteTag',accessToken,verifyToken,tagController.toggleFavoriteTag
)

module.exports = router