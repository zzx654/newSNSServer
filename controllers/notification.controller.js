const notificationService = require('../services/notification/notification.service')
const asyncHandler = require('../utils/asynchandler')
const getNotifications = asyncHandler(async (req, res) => {


    const { userId } = req.user
    const { notificationid,notificationdate } = req.body



    const result = await notificationService.getNotifications(userId, notificationid,notificationdate)

    return res.json(result)
})

const readNotification = asyncHandler(async (req,res) => {

    const { userId } = req.user
    const { notificationid } = req.body

    const result = await notificationService.readNotification(userId,notificationid)

    return res.json(result)
})

module.exports = { getNotifications, readNotification }