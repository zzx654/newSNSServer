const { pool } = require('../config/db')

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

module.exports = { autoLogin }