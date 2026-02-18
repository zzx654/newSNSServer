const { pool } = require('../config/db')

const createProfile = async(userId,nickname,birth,gender,imageUrl) => {
    await pool.query(
        'UPDATE user SET nickname=?,gender=?,birthyear=?,profileimage=? WHERE userid=?',
          [
            nickname,
            gender,
            birth,
            imageUrl,
            userId
          ]

    )
    return {
           isTokenValid:true,
        resultCode:200

    }
 
   




}
const checkNickname = async(nickname) => {
    const [users] =  await pool.query(
        'SELECT * FROM user WHERE nickname=?',
        [nickname]
    )
    return {
        resultCode:200,
        data: {
            isValid:users.length==0
        }
    }
}
module.exports = { createProfile, checkNickname }