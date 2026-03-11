const { pool } = require('../../config/db')
const { createNotification, canCreateNotification } = require('../notification/notification.service')
const commentListQuery = require('./comment.query')
const { transaction } = require("../../utils/transaction")

async function resolveAnonymous(userId, postId, anonymousNickname) {
  let anonymousParam = anonymousNickname || null

  const [rows] = await pool.query(
    'SELECT anonymous FROM comment WHERE userid=? AND postid=? AND anonymous IS NOT NULL LIMIT 1',
    [userId, postId]
  )

  if (rows.length > 0) {
    anonymousParam = rows[0].anonymous
  }

  return anonymousParam
}

async function getPostContext(postId, userId) {
  const [myuserRows] = await pool.query(
    'SELECT * FROM user WHERE userid=?',
    [userId]
  )

  const [postRows] = await pool.query(
    'SELECT * FROM post WHERE postid=?',
    [postId]
  )

  const [postUserRows] = await pool.query(
    'SELECT * FROM user WHERE userid=?',
    [postRows[0].userid]
  )

  return {
    myUser: myuserRows[0],
    post: postRows[0],
    postUser: postUserRows[0]
  }
}

async function getCommentWithUser(conn, commentId, postId, userId) {
  const [rows] = await conn.query(
    `SELECT
      c.commentid,c.postid,c.userid,c.text,c.date,c.ref,c.anonymous,
      u.nickname,u.profileimage,u.gender
     FROM comment c
     JOIN user u ON c.userid = u.userid
     WHERE c.commentid=? AND c.postid=? AND c.userid=?`,
    [commentId, postId, userId]
  )

  return rows
}
const getComments = async(myuserId,postid,commentid,commentdate) => {

       const{ query, params } = commentListQuery.buildCommentListQuery({
            myuserid:myuserId,
            postid:postid,
            commentid:commentid,
            commentdate:commentdate, 
        })
         const [comments] = await pool.query(
        query,
        params
      )
        console.log(comments)
    
      return {
        isTokenValid:true,
        resultCode:200,
        data: {
            comments:comments
        }
      }



}


const getReplies = async(myuserId,ref,commentid,commentdate) => {

    let whereClause = ''
    if(commentid&&commentdate) {
      whereClause = ('(com.date>? OR (com.date=? AND com.commentid>?))')
    }
    const query = `SELECT
        com.commentid,
        com.postid,
        com.userid,
        com.ref,
        com.date,
        com.depth,
        com.text,
        com.anonymous,
        getuser.nickname,
        getuser.profileimage,
        getuser.gender,
        IFNULL(lik.likecount,0) AS likecount,
        (mylik.userid IS NOT NULL) AS commentliked
        FROM comment com
        LEFT OUTER JOIN (select commentid,count(*) as likecount from likecomment group by commentid) lik
        ON com.commentid = lik.commentid
        LEFT OUTER JOIN (SELECT commentid,userid from likecomment WHERE userid=?) mylik
        ON com.commentid = mylik.commentid
        LEFT OUTER JOIN user getuser
        ON com.userid = getuser.userid
        WHERE com.depth = 1 AND ref = ?
        ${whereClause}
        ORDER BY com.date asc,com.commentid ASC LIMIT 20
    `
    const [replyRows] = await pool.query(query,[myuserId,ref])

    return {
      isTokenValid:true,
      resultCode:200,
      data: {
        comments:replyRows
      }
    }

  
}

const getPopularComments = async(myuserId,postid,commentid,score) => {

       const{ query, params } = commentListQuery.buildCommentListQuery({
            myuserid:myuserId,
            postid:postid,
            commentid:commentid,
            score:score, 
            sort:'popular'   
        })
         const [comments] = await pool.query(
        query,
        params
      )
        console.log(comments)
    
      return {
        isTokenValid:true,
        resultCode:200,
        data: {
            comments:comments
        }
      }


}

const getNotificationComment = async(myuserId,commentid) => {

    const params = [myuserId,commentid,commentid]
    const query = 
    `
    SELECT
     com.commentid,
        com.postid,
        com.userid,
        com.ref,
        com.date,
        com.depth,
        com.text,
        com.anonymous,
        cs.like_count AS likecount,
        cs.reply_count AS replycount,
        getuser.nickname,
        getuser.profileimage,
        getuser.gender,
        (mylik.userid IS NOT NULL) AS commentliked
        FROM comment
        ${commentListQuery.getCommonJoins()}
        WHERE
        com.ref=(select ref from comment WHERE commentid = ?)
        AND (com.commentid=? or com.depth=0)
        ORDER BY com.depth ASC

  `
  const comments = await pool.query(query,params)
  let parentComment = null;
  let replyComment = null;
  for(const row of comments) {
     if (row.depth === 0) {
      parentComment = row
    } else if (row.depth === 1) {
      replyComment = row
    }
  }

  return {
    comment:parentComment,
    reply:replyComment
  }

}
const postReply = async(myuserId,ref,postid,text,anonymousNickname) => {
    return transaction(async (conn) => {
  const anonymousParam = await resolveAnonymous(myuserId,postid,anonymousNickname)
  const { myUser, post, postUser } = await getPostContext(postid, myuserId)
 
 
        const [postResult] = await conn.query(
              'insert into comment (ref,postid,userid,text,depth,anonymous) values (?,?,?,?,?,?)',

              [ref,postid,myuserId,text,1,anonymousParam]
          )

    const [commentUserRows] = await conn.query(
      'SELECT *FROM user WHERE userid=(SELECT userid FROM comment WHERE ref=? AND depth=0)',
      [ref]
    )
    const myReplyRows = await getCommentWithUser(conn,postResult.insertId,postid,myuserId)

    if(myuserId!=postUser.userid&&commentUserRows[0].userid!=postUser.userid) {
      //게시물작성자에게 알림
      createNotification(myUser,postUser,anonymousParam,'COMMENT',myReplyRows[0].text,{postId:postid,commentId:myReplyRows[0].commentid}
      )
    }
    if(myuserId!=commentUserRows[0].userid) {
      //댓글작성자에 알림
      createNotification(myUser,commentUserRows[0],anonymousParam,'REPLY',myReplyRows[0].text,{postId:postid,commentId:myReplyRows[0].commentid})
    }
    

    return {
      isTokenValid:true,
      resultCode:200,
      data: {
        comments:myReplyRows
      }
    }

  })
  
}

const postComment = async(myuserId,postid,text,anonymousNickname) => {
  
  return transaction(async (conn) => {
 const anonymousParam = await resolveAnonymous(myuserId, postid, anonymousNickname)

const { myUser, postUser } = await getPostContext(postid, myuserId)
const [postResult] = await conn.query(
  `INSERT INTO comment (ref,postid,userid,text,depth,anonymous)
   VALUES (0,?,?,?,?,?)`,
  [postid,myuserId,text,0,anonymousParam]
)

await conn.query(
  `UPDATE comment SET ref=? WHERE commentid=?`,
  [postResult.insertId, postResult.insertId]
)

          const myCommentRows = await getCommentWithUser(conn,postResult.insertId,postid,myuserId)
    if(myuserId!=postUser.userid) {
      createNotification(myUser,postUser,myCommentRows[0].anonymous,'COMMENT',myCommentRows[0].text,{postId:postid,commentId:myCommentRows[0].commentid})
    }      

    return {
      isTokenValid:true,
      resultCode:200,
      data: {
        comments:myCommentRows
      }
    }

  })
}

const toggleLikeComment = async(myuserId,commentid) => {
   const [myuserRows] = await pool.query('SELECT * FROM user WHERE userid=?', [myuserId])
   const [commentRows] = await pool.query(
    'SELECT *FROM comment WHERE commentid = ?',
    [commentid]
   )
   const [commentuserRows] = await pool.query(
    'SELECT *FROM user WHERE userid = (SELECT userid FROM comment WHERE commentid = ?)',
    [commentid]
   )

   try {
    await pool.query(
      'INSERT INTO likecomment (commentid,userid) VALUES (?, ?)',
      [commentid,myuserId]
    )
    if(myuserId!=commentuserRows[0].userid) {
      const canCreate = await canCreateNotification(
          'LIKECOMMENT',
          myuserId,
          commentuserRows[0].userid,
          { postId: commentRows[0].postid,commentId:commentid }
        )
      if(canCreate) {
        createNotification(myuserRows[0],commentuserRows[0],null,'LIKECOMMENT',commentRows[0].text,{postId:commentRows[0].postid,commentId:commentid})
      }
    }
      return {
            resultCode:200,
            isTokenValid:true,
            data: {
              isLiked:true
            }
          }


   }catch(err) {
    if(err.code === 'ER_DUP_ENTRY') {
          await pool.query(
                  'DELETE FROM likecomment WHERE userid = ? AND commentid = ?',
                  [myuserId,commentid]
              )
               return {
            resultCode:200,
            isTokenValid:true,
            data: {
              isLiked:false
            }
          }
    }
    else {
      throw err
    }

   }
}
const getSelectedComment = async(myuserId,commentid) => {

  const [comment] = await pool.query(
    'SELECT *FROM comment WHERE commentid=?',
    [commentid]
  )

  const [commentRows] = await pool.query(
     `SELECT
       com.commentid,com.postid,com.userid,com.text,com.date,com.depth,com.ref,com.anonymous,
       (SELECT COUNT(*) FROM likecomment lc WHERE lc.commentid=com.commentid) AS likecount,
       IF(EXISTS(SELECT 1 FROM likecomment lc WHERE lc.commentid=com.commentid AND lc.userid = ?),1,0) AS commentliked,
       (SELECT COUNT(*) FROM comment reply WHERE reply.ref=com.commentid AND reply.depth=1) AS replycount,
       getuser.nickname,getuser.profileimage,getuser.gender FROM comment com JOIN user getuser ON com.userid=getuser.userid WHERE com.commentid=?
      `,
      [myuserId,commentid]
  )

  return {
    isTokenValid:true,
    resultCode:200,
    data: {
      comments:commentRows
    }
  }




}



module.exports = { getComments, getPopularComments, getNotificationComment, postComment, toggleLikeComment, getSelectedComment, getReplies, postReply }