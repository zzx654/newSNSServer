const fcmService = require('../services/fcm/fcm.service')
const asyncHandler = require('../utils/asynchandler')
const updateFcmToken = asyncHandler(async (req, res) => {


    const { userId } = req.user
    const { fcmtoken } = req.body



    await fcmService.updateFcmToken(userId, fcmtoken)

    return res.json({
      resultCode: 200,
      isTokenValid: true,
    })
})

module.exports = { updateFcmToken }