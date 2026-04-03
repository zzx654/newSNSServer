const { pool } = require("../../config/db")

const notification = require('../notification/notification.service')
const getSearchedUsers = async(myuserId,nickname,lastuserid) => {

    
    let whereCondition = ''
    const params = [myuserId,"%"+nickname+"%"]
    if(lastuserid) {
        whereCondition = 'AND userid < ?'
        params.push(lastuserid)
    }
    const query =  `SELECT
        userid,
        nickname,
        gender,
        profileimage,
        IF(ISNULL(myfollow.followerid),0,1) AS following,
        follow.followercount
    FROM
        user
    LEFT OUTER JOIN
        (SELECT * FROM follows WHERE followerid = ?) myfollow
    ON 
        user.userid = myfollow.followingid
    LEFT OUTER JOIN
        (SELECT followingid,COUNT(*) AS followercount FROM follows GROUP BY followingid) follow
    ON
        user.userid = follow.followingid
    WHERE
        nickname LIKE ? ${whereCondition}
    ORDER BY 
        userid DESC LIMIT 12

    `
    const [userRows] = await pool.query(query,params)

    return {
        isTokenValid:true,
        resultCode:200,
        data: {
            users:userRows
        }

    }


}

const toggleFollowUser = async(myuserId,userid) => {
    const [targetUserRows] = await pool.query('SELECT *FROM user WHERE userid = ?',[userid])
    const [myuserRows] = await pool.query('SELECT *FROM user WHERE userid=?',[myuserId])
    if(!targetUserRows.length) {
        return {
            isTokenValid:true,
            resultCode:200,
            data: {
                isFollowing:false
            }
        }
    }
       try {
        await pool.query(
            'INSERT INTO follows (followerid, followingid) VALUES (?, ?)',
            [myuserId,userid]
        )

        if(myuserId!=userid) {
             const canCreate = await notification.canCreateNotification(
              'FOLLOW',
              myuserId,
              targetUserRows[0].userid,
              { userId: myuserId }
            );
            if (canCreate) {
              await notification.createNotification(
                myuserRows[0],
                targetUserRows[0],
                null,
                'FOLLOW',
                null,
                { followerId: myuserId }
              );
            }
        }
        return {
            isTokenValid:true,
            resultCode:200,
            data: {
                isFollowing:true
            }
        }
        

    } catch (err) {
        if(err.code === 'ER_DUP_ENTRY') {
            await pool.query(
                'DELETE FROM follows WHERE followerid = ? AND followingid = ?',
                [myuserId,userid]
            )
             return {
            isTokenValid:true,
            resultCode:200,
            data: {
                isFollowing:false
            }
        }

        }else {
            throw err
        }

    }

}

const getUserInfo = async(myuserId,targetUserId) => {

    
    
    const params = [myuserId,targetUserId]
   
      const query = `
    SELECT
        user.userid,
        user.nickname,
        user.gender,
        user.profileimage,
        IF(ISNULL(myfollow.followerid),0,1) AS following,
        follow.followercount,
        IFNULL(post.postcount, 0) AS postcount
    FROM
        user
    LEFT OUTER JOIN
        (SELECT * FROM follows WHERE followerid = ?) myfollow
    ON 
        user.userid = myfollow.followingid
    LEFT OUTER JOIN
        (SELECT followingid, COUNT(*) AS followercount FROM follows GROUP BY followingid) follow
    ON
        user.userid = follow.followingid
    LEFT OUTER JOIN
        (SELECT userid, COUNT(*) AS postcount FROM post GROUP BY userid) post  
    ON
        user.userid = post.userid  
    WHERE
        user.userid = ?
    LIMIT 1
    `
    const [userRows] = await pool.query(query,params)

    return {
        isTokenValid:true,
        resultCode:200,
        data: {
            users:userRows
        }

    }


}

module.exports = { getSearchedUsers, toggleFollowUser, getUserInfo }