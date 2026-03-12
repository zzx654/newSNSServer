const commentlistService = require('../services/comment/comment.service')
const asyncHandler = require('../utils/asynchandler')

const getComments = asyncHandler(async(req,res)=> {

    const {userId} = req.user
    const {postid,commentid,commentdate} = req.body


    const result = await commentlistService.getComments(userId,postid,commentid,commentdate)

    res.json(result)

})

const getPopularComments = asyncHandler(async(req,res)=> {

     const {userId} = req.user
    const {postid,commentid,score} = req.body

    const result = await commentlistService.getPopularComments(userId,postid,commentid,score)

    res.json(result)
})

const getNotificationComment = asyncHandler(async(req,res)=> {
    const {userId} = req.user

    const {commentid} = req.body

    const result = await commentlistService.getNotificationComment(userId,commentid)
    res.json(result)

})

const postComment = asyncHandler(async(req,res) => {
    const {userId} = req.user

    const {postid,text,anonymousNick} = req.body

    const result = await commentlistService.postComment(userId,postid,text,anonymousNick)

    res.json(result)
})

const toggleLikeComment = asyncHandler(async(req,res) => {
    const {userId} = req.user

    const { commentid }  = req.body

    const result = await commentlistService.toggleLikeComment(userId,commentid)

    res.json(result)
})

const getSelectedComment = asyncHandler(async(req,res) => {

        const {userId} = req.user

    const { commentid }  = req.body

    const result = await commentlistService.getSelectedComment(userId,commentid)

    res.json(result)
})

const getReplies = asyncHandler(async(req,res) => {
    const {userId} = req.user

    const { ref,commentid,commentdate} = req.body

    const result = await commentlistService.getReplies(userId,ref,commentid,commentdate)

    res.json(result)
})

const postReply = asyncHandler(async(req,res) => {

    const {userId} = req.user

    const {ref,postid,text,anonymousNick} = req.body

    const result = await commentlistService.postReply(userId,ref,postid,text,anonymousNick)

    res.json(result)
})


module.exports = { getComments, getPopularComments, getNotificationComment, postComment, toggleLikeComment, getSelectedComment, getReplies, postReply }