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

module.exports = { getComments, getPopularComments }