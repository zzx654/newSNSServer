const { pool } = require('../../config/db')
const commentListQuery = require('./comment.query')

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

module.exports = { getComments, getPopularComments, getNotificationComment }