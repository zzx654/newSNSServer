const { pool } = require('../config/db')
const { generateCode } = require('../utils/randomcode')
const sms = require('../utils/sms')
const cache = require('../utils/cache')

const autoLogin = async ({ userId }) => {
  if (!userId) {
    return {
      resultCode: 200,
      isTokenValid: false,
      data: {
        signInResult: false,
        profileWritten: false,
        userId: 0,
      },
    }
  }

  const [rows] = await pool.query(
    'SELECT userid, nickname FROM user WHERE userid = ?',
    [userId]
  )

  if (!rows.length) {
    return {
      resultCode: 200,
      isTokenValid: true,
      data: {
        signInResult: false,
        profileWritten: false,
        userId: 0,
      },
    }
  }

  const user = rows[0]

  return {
    resultCode: 200,
    isTokenValid: true,
    data: {
      signInResult: true,
      profileWritten: user.nickname !== null,
      userId: user.userid,
    },
  }
}
const requestPhoneAuthCode = async (phoneNumber) => {
  // 1. 전화번호 중복 체크
  const [rows] = await pool.query(
    'SELECT userid FROM user WHERE phonenumber = ?',
    [phoneNumber]
  )

  if (rows.length) {
    return {
      resultCode: 200,
      data: { isValid: false }
    }
  }

  // 2. 인증코드 생성
  const code = generateCode()

  // 3. 캐시에 저장 (TTL 3~5분)
  cache.set(phoneNumber, code, 180)

  // 4. 문자 전송
  await sms.sendAuthCode(phoneNumber, code)

  return {
    resultCode: 200,
    data: { isValid: true }
  }
}

module.exports = { autoLogin,requestPhoneAuthCode }