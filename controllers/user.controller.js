const userService = require('../services/user/user.service')
const asyncHandler = require('../utils/asynchandler')

const getSearchedUsers = asyncHandler(async(req,res)=> {
      const { nickname,lastuserid } = req.body
        const { userId } = req.user
        const result = await userService.getSearchedUsers(userId,nickname,lastuserid)
        res.json(result)

})

const toggleFollowUser = asyncHandler(async(req,res)=> {
      const { userid } = req.body
        const { userId } = req.user
        const result = await userService.toggleFollowUser(userId,userid)
        res.json(result)
    
})

const getUserInfo = asyncHandler(async(req,res) => {
   const { userid } = req.body
   const { userId } = req.user
   const result = await userService.getUserInfo(userId,userid)

   res.json(result)
})

const getMedia = asyncHandler(async(req,res) => {
  const { userid,type,mediaid,latitude,longitude } = req.body
  
  await new Promise(resolve => setTimeout(resolve, 2000))
  const result = await userService.getMediaList(userid,type,mediaid,latitude,longitude)

  res.json(result)

})

module.exports = { getSearchedUsers, toggleFollowUser,getUserInfo,getMedia }