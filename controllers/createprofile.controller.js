
const createProfileService = require('../services/createprofile/createprofile.service')
const asyncHandler = require('../utils/asynchandler')
const checkNickname = asyncHandler(async(req,res) => {
    
        const {nickname} = req.body
          const result = await createProfileService.checkNickname(nickname)
  return res.json(result)


})
const createProfile = asyncHandler(async(req,res) => {
    
        const imageUrl = req.file
  ? `/profile?filename=${req.file.filename}`
  : null
  console.log()
  const { nickname, birth, gender} = req.body
  const {userId} = req.user

  const result = await createProfileService.createProfile(userId,nickname,birth,gender,imageUrl)
  return res.json(result)





})

module.exports = { createProfile, checkNickname }
