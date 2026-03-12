const asyncHandler = require("../utils/asynchandler");
const postService = require("../services/post/post.service");
const { getPostDetail } = require("../services/postdetail/postdetail.service");
const uploadPost = asyncHandler(async(req,res)=> {

    const {userId} = req.user
    const {image,audio} = req.files
    const {latitude,longitude,anonymousNick,text,tags,voteoptions} = req.body



    const result = await postService.uploadPost(userId,latitude,longitude,anonymousNick,text,tags,image,audio,voteoptions)
    res.json(result)


})

const editPost = asyncHandler(async(req,res)=> {

    const {userId} = req.user
    const {image,audio} = req.files

    const {postid,text,tags,latitude,longitude,anonymousNick,deleteImages,deleteAudio} = req.body

    const result = await postService.editPost(postid,userId,latitude,longitude,anonymousNick,text,tags,image,deleteImages,audio,deleteAudio)

    res.json(result)
})

module.exports = {uploadPost,editPost}