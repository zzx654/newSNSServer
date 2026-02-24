const asyncHandler = require("../utils/asynchandler");
const postlistService = require("../services/postlist/postlist.service")

const getNewPosts = asyncHandler(async(req,res) => {
    const {userId} = req.user
    const {postid,postdate,latitude,longitude} = req.body

    const result = await postlistService.getNewPosts(userId,postid,postdate,latitude,longitude)

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

module.exports = { getNewPosts, getNewTagPosts, getPopularTagPosts }
