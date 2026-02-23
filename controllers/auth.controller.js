const authService = require('../services/auth/auth.service')
const asyncHandler = require('../utils/asynchandler')
const autoLogin = asyncHandler(async (req, res) => {
   const {userId} = req.user
    const result = await authService.autoLogin(userId)
    return res.json(result)

})

const requestPhoneAuthCode = asyncHandler (async(req, res) => {
  
  const {phoneNumber} = req.body
    const result = await authService.requestPhoneAuthCode(phoneNumber)
    res.json(result)
 
})
const requestEmailAuthCode = asyncHandler(async(req, res) => {

    const {email} = req.body

    const result = await authService.requestEmailAuthCode(email)
    res.json(result)
})
const authenticateCode = asyncHandler(async (req, res) => {

 const {phoneNumber, authCode} = req.body
    const result = await authService.authenticateCode(phoneNumber,authCode)

    return res.json(result)
  
})

const emailSignUp = asyncHandler(async (req, res) => {
 
 const { account, password, phonenumber, authCode } = req.body
    const result = await authService.emailSignUp(account,password,phonenumber,authCode)

    return res.json(result)

  
})
const socialSign = asyncHandler(async(req, res) => {

 const {platform,account,fcmtoken} = req.body
    const result = await authService.socialSign(platform,account,fcmtoken)
    return res.json(result)
})

const socialSignUp = asyncHandler(async(req, res) => {

  const {platform,account,phonenumber,fcmtoken} = req.body
    const result = await authService.socialSignUp(platform,account,phonenumber,fcmtoken)

    return res.json(result)


})
const emailSignIn = asyncHandler(async(req,res) => {

const {account, password, fcmtoken} = req.body

    const result = await authService.emailSignIn(account,password,fcmtoken)

    return res.json(result)


})

module.exports = { autoLogin, requestPhoneAuthCode, authenticateCode, requestEmailAuthCode, emailSignUp, socialSign, socialSignUp, emailSignIn }