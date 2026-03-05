function buildCommentListQuery(options = {}) {
  const { sort = 'latest' } = options

  if (sort === 'popular') {
    return buildPopularCommentQuery(options)
  }

  return buildNormalCommentQuery(options)
}
function getCommonJoins() {
  return `
    LEFT JOIN likecomment mylik
      ON com.commentid = mylik.commentid
      AND mylik.userid = ?

    LEFT JOIN user getuser
      ON com.userid = getuser.userid

    LEFT JOIN comment_scores cs
      ON com.commentid = cs.commentid
  `
}

function buildNormalCommentQuery(options) {
    const {
        myuserid,
        postid,
        commentid,
        commentdate,
    } = options

    const fromParams = [postid]

    const joinParams = [myuserid]
    const whereParams = []
    let whereClause = ''
    
    if(commentid&&commentdate) {
        whereClause = 'WHERE (com.date>? OR (com.date=? and com.commentid>?)) '
        whereParams.push(commentdate,commentdate,commentid)
    }

    const query = `
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
     FROM
     (SELECT *FROM comment WHERE depth = 0 AND postid = ?) com
     ${getCommonJoins()}
     ${whereClause}
     ORDER BY com.date ASC, com.commentid ASC LIMIT 20
    `

    return {
        query,
        params: [
            ...fromParams,
            ...joinParams,
            ...whereParams
    ]
  }

}

function buildPopularCommentQuery(options) {
    const {
        myuserid,
        postid,
        commentid,
        score,
    } = options

    const fromParams = [postid]

    const joinParams = [myuserid]
    const whereParams = []
    let whereClause = ''
    
   if(commentid&&score) {
        whereClause = 'WHERE cs.score<? OR (cs.score = ? AND com.commentid < ?) '
        whereParams.push(score,score,commentid)
    }

    const query = `
     SELECT 
        com.commentid,
        com.postid,
        com.userid,
        com.ref,
        com.date,
        com.depth,
        com.text,
        com.anonymous,
        cs.score,
        cs.like_count AS likecount,
        cs.reply_count AS replycount,
        getuser.nickname,
        getuser.profileimage,
        getuser.gender,
        (mylik.userid IS NOT NULL) AS commentliked
     FROM
     (SELECT *FROM comment WHERE depth = 0 AND postid = ?) com
     ${getCommonJoins()}
     ${whereClause}
     ORDER BY cs.score DESC, com.commentid DESC LIMIT 20
    `

    return {
        query,
        params: [
            ...fromParams,
            ...joinParams,
            ...whereParams
    ]
  }

}

module.exports = { buildCommentListQuery,getCommonJoins }