const { MessagingConfigurationListInstance } = require('twilio/lib/rest/verify/v2/service/messagingConfiguration')
const chatService = require('../services/chat/chat.service')
const asyncHandler = require('../utils/asynchandler')

const createChatRequest = asyncHandler(async(req,res) => {
    const { userId } = req.user
    const { targetuserid,postid,commentid } = req.body

    const result = chatService.createChatRequest(
        requesterId = userId,
        targetId = targetuserid,
        postId = postid,
        commentId = commentid
     )

     res.json(result)
})

module.exports = { createChatRequest }