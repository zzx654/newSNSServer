const asyncHandler = require("../utils/asynchandler");
const postService = require("../services/post/post.service")
const uploadPost = asyncHandler(async(req,res)=> {

    const {userId} = req.user
    const {image,audio} = req.files
    const {latitude,longitude,anonymousNick,text,tags,voteoptions} = req.body

    const result = await postService.uploadPost(userId,latitude,longitude,anonymousNick,text,tags,image,audio,voteoptions)
    res.json(result)


})

module.exports = {uploadPost}