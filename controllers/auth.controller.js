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

module.exports = { autoLogin, requestPhoneAuthCode, authenticateCode }