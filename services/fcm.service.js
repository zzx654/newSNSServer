const { transaction } = require('../utils/transaction')

const updateFcmToken = (userId, fcmToken) => {
  return transaction(async (conn) => {
    const [result] = await conn.execute(
      'UPDATE user SET fcmtoken = ? WHERE userid = ?',
      [fcmToken, userId]
    )
    return result
  })
}

module.exports = {
  updateFcmToken,
}