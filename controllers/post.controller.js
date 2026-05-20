const asyncHandler = require("../utils/asynchandler");
const postService = require("../services/post/post.service");
const { getPostDetail } = require("../services/postdetail/postdetail.service");

const uploadVideo = asyncHandler(async(req,res) => {

     try {
    if (!req.file) {
      return res.status(400).send('파일 없음');
    }

    const result = await postService.uploadVideo(req.file);

    res.json(result);

  } catch (err) {
    console.error(err);
    res.status(500).send('업로드 실패');
  }

})
const uploadPost = asyncHandler(async(req,res)=> {

    const {userId} = req.user
    //const {image,audio} = req.files
    const {latitude,longitude,anonymousNick,text,tags,voteoptions} = req.body

    const files = req.files || []
    let mediaTypes = req.body.mediaTypes || []
if (!Array.isArray(mediaTypes)) {
    mediaTypes = [mediaTypes]
}
    console.log("files:", req.files)
console.log("mediaTypes:", mediaTypes)
    const mediaList = files.map((file, index) => ({
    file,
    type: String(mediaTypes[index]).trim().toUpperCase()
}))


    const result = await postService.uploadPost(userId,latitude,longitude,anonymousNick,text,tags,mediaList,voteoptions)
    res.json(result)


})

const editPost = asyncHandler(async(req,res)=> {

    const {userId} = req.user
    const {image,audio} = req.files

    const {postid,text,tags,latitude,longitude,anonymousNick,deleteImages,deleteAudio} = req.body

    const result = await postService.editPost(postid,userId,latitude,longitude,anonymousNick,text,tags,image,deleteImages,audio,deleteAudio)

    res.json(result)
})

module.exports = {uploadPost,editPost,uploadVideo}