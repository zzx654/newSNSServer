const postdetailService = require ('../services/postdetail/postdetail.service')
const asyncHandler = require('../utils/asynchandler')

const getPost = asyncHandler(async(req,res)=> {

    const {userId} = req.user
    const {postid,latitude,longitude} = req.body

    const result = await postdetailService.getPostDetail(userId,postid,latitude,longitude)

    res.json(result)



})

const getVoteInfo = asyncHandler(async(req,res)=> {

    const {userId} = req.user
    const {postid} = req.body

    const result = await postdetailService.getVoteInfo(userId,postid)

    res.json(result)

})

module.exports = { getPost, getVoteInfo }