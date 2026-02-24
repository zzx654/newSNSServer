const asyncHandler = require("../utils/asynchandler");
const postlistService = require("../services/postlist/postlist.service")

const getNewPosts = asyncHandler(async(req,res) => {
    const {userId} = req.user
    const {postid,postdate,latitude,longitude} = req.body

    const result = await postlistService.getNewPosts(userId,postid,postdate,latitude,longitude)

    res.json(result)
})

module.exports = { getNewPosts}
