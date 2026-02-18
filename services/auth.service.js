const { pool } = require('../config/db')
const { generateCode } = require('../utils/randomcode')
const mail = require('../utils/mail')
const sms = require('../utils/sms')
const { signAccessToken } = require('../utils/jwt')
const cache = require('../utils/cache')
const bcrypt = require('../utils/bcrypt')
const { request } = require('express')
const { transaction } = require('../utils/transaction')

const autoLogin = async ( userId ) => {
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
  cache.del(phoneNumber)

  // 3. 캐시에 저장 (TTL 3~5분)
  cache.set(phoneNumber, code, 180)
  

  // 4. 문자 전송
  await sms.sendAuthCode(phoneNumber, code)

  return {
    resultCode: 200,
    data: { isValid: true }
  }
}

const authenticateCode = async (phoneNumber, authCode) => {
  const cachedCode = cache.get(phoneNumber)

  if (!cachedCode) {
    return {
      resultCode: 200,
      data: { isCorrect: false }
    }
  }

  const isCorrect = String(authCode) === String(cachedCode)

  if (isCorrect) {
    cache.del(phoneNumber)
  }

  return {
    resultCode: 200,
    data: { isCorrect }
  }
}
const requestEmailAuthCode = async({email}) => {
    const [rows] = await pool.query(
    'SELECT * FROM user WHERE account = ?',
    [email]
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
  cache.set(email, code, 180)
  try {
    await mail.sendEmail(
      email,
      '[고민앱] 메일 인증 코드 발송',
      '인증번호는 '+code+' 입니다'
    )
  } catch(err) {
    console.log(err)
    throw new Error('EMAIL_SEND_FAILED')
  }

    return {
    resultCode: 200,
    data: { isValid: true }
  }
}

const emailSignUp = async ( account, password, phonenumber, authCode ) => {

  //  인증코드 확인
  const cachedCode = cache.get(account)

  if (!cachedCode) {
    return {
      resultCode: 200,
      data: { isCorrect: false, message: 'AUTH_CODE_EXPIRED' }
    }
  }

  if (String(authCode) !== String(cachedCode)) {
    return {
      resultCode: 200,
      data: { isCorrect: false, message: 'AUTH_CODE_INVALID' }
    }
  }

  //  비밀번호 해싱
  const encrypted = await bcrypt.hash(password)


  try {
      const result = await transaction(async (conn) => {
        const [insertResult] = await conn.query(
          `INSERT INTO user 
          (platform, account, password, phonenumber) 
          VALUES (?, ?, ?, ?)`,
          ['email', account, encrypted, phonenumber]
        )
        return insertResult
      })
       //  성공하면 인증코드 삭제
     cache.del(account)
       return {
        resultCode: 200,
        data: {
          isCorrect: true
        }
      }
    } catch(err) {
      throw(err)
    }
}
const emailSignIn = async (account, password, fcmtoken) => {

  const result = await transaction(async (conn) => {

    const [users] = await conn.query(
      'SELECT * FROM user WHERE platform=? AND account=?',
      ['email', account]
    )

    if (!users.length) {
      return { isMember: false }
    }

    const user = users[0]

    const compareResult = await bcrypt.compare(password, user.password)

    if (!compareResult) {
      return { isMember: false }
    }

    await conn.query(
      'UPDATE user SET fcmtoken=? WHERE userid=?',
      [fcmtoken, user.userid]
    )

    return {
      isMember: true,
      user
    }
  })

  if (!result.isMember) {
    return {
      resultCode: 200,
      data: {
        isMember: false,
        profileWritten: false,
        userId: 0,
        token: ''
      }
    }
  }

  const authtoken = signAccessToken({
    userId: result.user.userid,
    platform: result.user.platform,
    account: result.user.account
  })

  return {
    resultCode: 200,
    data: {
      isMember: true,
      profileWritten: result.user.nickname !== null,
      userId: result.user.userid,
      token: authtoken
    }
  }
}
const socialSign = async(platform,account,fcmtoken) => {
 const result = await transaction(async (conn) => {

  const [users] = await conn.query(
    'SELECT * FROM user WHERE platform = ? AND account = ?',
    [platform, account]
  )

  if (!users.length) {
    return {
      isMember: false,
      user: null
    }
  }

  const user = users[0]

  await conn.query(
    'UPDATE user SET fcmtoken=? WHERE userid=?',
    [fcmtoken, user.userid]
  )

  return {
    isMember: true,
    user
  }
})

if (!result.isMember) {
  return {
    resultCode: 200,
    data: {
      isMember: false,
      profileWritten: false,
      token: '',
      userId: 0
    }
  }
}

const authtoken = signAccessToken({
  userId: result.user.userid,
  platform: result.user.platform,
  account: result.user.account
})
return {
    resultCode: 200,
    data: {
      isMember: true,
      profileWritten: result.user.nickname !== null,
      token: authtoken,
      userId: result.user.userid
    }
  }
}
const socialSignUp = async(platform,account,phonenumber,fcmtoken) => {
   const userId = await transaction(async (conn) => {

    const [insertResult] = await conn.query(
      `INSERT INTO user 
       (platform, account, phonenumber, fcmtoken) 
       VALUES (?, ?, ?, ?)`,
      [platform, account, phonenumber, fcmtoken]
    )

    return insertResult.insertId   
  })
   const authtoken = signAccessToken({
    userId:userId,
    platform:platform,
    account:account
  })
  return {
    resultCode: 200,
    data: {
      token: authtoken
    }
  }
}

module.exports = { autoLogin, requestPhoneAuthCode, authenticateCode, requestEmailAuthCode, emailSignUp,
   socialSign, socialSignUp,
  emailSignIn
 }