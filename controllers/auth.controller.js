const authService = require('../services/auth.service')
const autoLogin = async (req, res) => {
  if (!req.isTokenValid) {
    return res.json({
      resultCode: 200,
      isTokenValid: false,
      data: {
        signInResult: false,
        profileWritten: false,
        userId: 0,
      },
    })
  }

  try {
    const result = await authService.autoLogin(req.user)
    return res.json(result)
  } catch (err) {
    console.error(err)
    return res.status(500).json({
      resultCode: 500,
      isTokenValid: true,
      data: {
        signInResult: false,
        profileWritten: false,
        userId: 0,
      },
    })
  }
}

const requestPhoneAuthCode = async (req, res) => {
  try {
    const { phoneNumber } = req.body
    const result = await authService.requestPhoneAuthCode(phoneNumber)
    res.json(result)
  } catch (err) {
    console.error(err)
    res.status(500).json({
      resultCode: 500,
      data: { isValid: false }
    })
  }
}
const requestEmailAuthCode = async(req, res) => {
  try {
    const { email } = req.body
    const result = await authService.requestEmailAuthCode(email)
    res.json(result)

  } catch(err) {
     console.error(err)
     res.status(500).json({
      resultCode: 500,
      data: { isValid: false }
    })
  }
}
const authenticateCode = async (req, res) => {
  try {
    const { phoneNumber, authCode } = req.body

    const result = await authService.authenticateCode(
      phoneNumber,
      authCode)

    return res.json(result)
  } catch (err) {
    console.error(err)
    return res.status(500).json({
      resultCode: 500,
      data: { isCorrect: false }
    })
  }
}

const emailSignUp = async (req, res) => {
  try {
    const { account, password, phonenumber, authCode } = req.body

    const result = await authService.emailSignUp({
      account,
      password,
      phonenumber,
      authCode
    })

    return res.json(result)

  } catch (err) {
    console.error(err)

    return res.status(500).json({
      resultCode: 500,
      data: { isCorrect: false }
    })
  }
}
const socialSign = async(req, res) => {
  try {
    const { platform, account, fcmtoken } = req.body

    console.log(req.body)


    const result = await authService.socialSign(platform,account,fcmtoken)

    return res.json(result)

  } catch (err) {
    console.error(err)

    return res.status(500).json({
      resultCode: 500,
      data: { isCorrect: false }
    })
  }

}

const socialSignUp = async(req, res) => {
  try {
    const { platform, account, phonenumber,fcmtoken } = req.body

    const result = await authService.socialSignUp(platform,account,phonenumber,fcmtoken)

    return res.json(result)

  } catch (err) {
    console.error(err)

    return res.status(500).json({
      resultCode: 500,
          data: {
          token: ''
      }
    })
  }

}
const emailSignIn = async(req,res) => {
   try {
    const { account, password,fcmtoken } = req.body

    const result = await authService.emailSignIn(account,password,fcmtoken)

    return res.json(result)

  } catch (err) {
    console.error(err)

    return res.status(500).json({
        resultCode: 500,
      data: {
        isMember: false,
        profileWritten: false,
        userId: 0,
        token: ''
      }
    })
  }
}

module.exports = { autoLogin, requestPhoneAuthCode, authenticateCode, requestEmailAuthCode, emailSignUp, socialSign, socialSignUp, emailSignIn }