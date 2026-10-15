const asyncHandler = require("../utils/asynchandler");
const postlistService = require("../services/postlist/postlist.service")

const getNewPosts = asyncHandler(async(req,res) => {
    const {userId} = req.user
    const {postid,postdate,latitude,longitude} = req.body
await new Promise(resolve => setTimeout(resolve, 2000))
    const result = await postlistService.getNewPosts(userId,postid,postdate,latitude,longitude)

    res.json(result)
})

const getNearPosts = asyncHandler(async(req,res) => {
    const {userId} = req.user
    const {postid,postdate,maxdistance,latitude,longitude} = req.body
    console.log('sdfgg')
    console.log(maxdistance)
await new Promise(resolve => setTimeout(resolve, 2000))
    const result = await postlistService.getNearPosts(userId,postid,postdate,maxdistance,latitude,longitude)

    res.json(result)
})

const getNewTagPosts = asyncHandler(async(req,res) => {
    const {userId} = req.user
    const {tagid,postid,postdate,latitude,longitude} = req.body

    const result = await postlistService.getNewTagPosts(userId,tagid,postid,postdate,latitude,longitude)

    res.json(result)
})

const getPopularTagPosts = asyncHandler(async(req,res) => {
    const {userId} = req.user
    const {tagid,postid,score,latitude,longitude} = req.body

    const result = await postlistService.getPopularTagPosts(userId,tagid,postid,score,latitude,longitude)

    res.json(result)
})

const getUserPosts = asyncHandler(async(req,res) => {
    const {userId} = req.user
    const {userid,postid,postdate,latitude,longitude} = req.body
await new Promise(resolve => setTimeout(resolve, 2000))
    const result = await postlistService.getUserPosts(userId,userid,postid,postdate,latitude,longitude)

    res.json(result)
})

module.exports = { getNewPosts, getNearPosts, getNewTagPosts, getPopularTagPosts, getUserPosts }
