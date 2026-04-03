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

module.exports = { getSearchedUsers, toggleFollowUser,getUserInfo }