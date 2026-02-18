
const createProfileService = require('../services/createprofile.service')
const asyncHandler = require('../utils/asynchandler')
const checkNickname = async(req,res) => {
    try {
        const {nickname} = req.body
          const result = await createProfileService.checkNickname(nickname)
  return res.json(result)


    } catch(err) {
          console.error(err)
           return res.status(500).json({
        resultCode:500,
        data: {
            isValid:false
        }
      })

    }
}
const createProfile = async(req,res) => {
    if (!req.isTokenValid) {
   return res.status(401).json({
      resultCode: 401,
      isTokenValid: false,
    });
  }
    try {
        const imageUrl = req.file
  ? `/image?filename=${req.file.filename}`
  : null
  console.log()
  const { nickname, birth, gender} = req.body
  const {userId} = req.user

  const result = await createProfileService.createProfile(userId,nickname,birth,gender,imageUrl)
  return res.json(result)



    } catch(err) {
        console.error(err)
           return res.status(500).json({
        isTokenValid:true,
        resultCode:500
      })

    }


}

module.exports = { createProfile, checkNickname }
