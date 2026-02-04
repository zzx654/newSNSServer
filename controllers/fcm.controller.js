const fcmService = require('../services/fcm.service')

const updateFcmToken = async (req, res) => {
  if (!req.isTokenValid) {
    return res.json({
      resultCode: 400,
      isTokenValid: false,
    })
  }

  try {
    const { userId } = req.user
    const { fcmtoken } = req.body

    await fcmService.updateFcmToken(userId, fcmtoken)

    return res.json({
      resultCode: 200,
      isTokenValid: true,
    })
  } catch (err) {
    console.error(err)
    return res.json({
      resultCode: 400,
      isTokenValid: true,
    })
  }
}

module.exports = { updateFcmToken }