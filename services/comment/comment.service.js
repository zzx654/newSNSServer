const { pool } = require('../../config/db')
const { createNotification, canCreateNotification } = require('../notification/notification.service')
const commentListQuery = require('./comment.query')
const { transaction } = require("../../utils/transaction")
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


const postComment = async(myuserId,postid,text,anonymousNickname) => {
  
  return transaction(async (conn) => {
    let anonymousParam = anonymousNickname||null
  const myAnonymousComment = await pool.query(
    'SELECT *FROM comment WHERE userid=? AND postid=? AND anonymous IS NOT NULL',
    [myuserId,postid]
  )
  if(myAnonymousComment.length > 0) {
    anonymousParam = myAnonymousComment[0].anonymous
  }
  const [myuserRows] = await pool.query('SELECT * FROM user WHERE userid=?', [myuserId]);
  const [post] = await pool.query(
    'SELECT *FROM post WHERE postid =?',
    [postid]
  )
  const [postUser] = await pool.query(
    'SELECT *FROM user WHERE userid = ?',
    [post[0].userid]
  )
        const [postResult] = await conn.query(
              'INSERT INTO comment (ref,postid,userid,text,depth,anonymous) VALUES ( (select ifnull(max(ref)+1,1) from comment b),?,?,?,?,?)',

              [postid,myuserId,text,0,anonymousParam]
          )

    const [getCommentResult] = await conn.query(
      `SELECT
       c.commentid,c.postid,c.userid,c.text,c.date,c.ref,c.anonymous,u.nickname,u.profileimage,u.gender 
       FROM comment c
      JOIN user u 
      ON c.userid = u.userid 
      WHERE c.commentid=? AND c.postid=? and c.userid=?
      `,
      [postResult.insertId,postid,myuserId]
    )
    if(myuserId!=postUser[0].userid) {
      createNotification(myuserRows[0],postUser[0],getCommentResult[0].anonymous,'COMMENT',getCommentResult[0].text,{postId:postid,commentId:getCommentResult[0].commentid})
    }      

    return {
      isTokenValid:true,
      resultCode:200,
      data: {
        comments:getCommentResult
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

module.exports = { getComments, getPopularComments, getNotificationComment, postComment, toggleLikeComment }