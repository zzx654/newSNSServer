const { pool } = require('../../config/db')
const  postlistQuery = require('../postlist/postlist.query')

const getPostDetail = async (myuserId,postId,latitude,longitude) => {

  let params = []
  let distanceSelect = ''

  


  
  if (latitude&&longitude) {
     distanceSelect = `
      , (6371 * acos(
        cos(radians(?)) *
        cos(radians(p.latitude)) *
        cos(radians(p.longitude) - radians(?)) +
        sin(radians(?)) *
        sin(radians(p.latitude))
      )) AS distance
    `
    params.push(latitude, longitude,latitude)
  }
  params.push(myuserId,postId)
    const query = `
      SELECT
        p.postid,
        mylike.isliked,
        vote.vote,
        votecount.votecount,
        p.userid,
        getuser.nickname,
        getuser.profileimage,
        getuser.gender,
        p.anonymous,
        p.text,
        tag.tags,
        p.date,
        image.images,
        audio.audio,
        IFNULL(com.commentcount,0) AS commentcount,
        IFNULL(lik.likecount,0) AS likecount
        ${distanceSelect}
      FROM post p
      ${postlistQuery.getCommonJoins()}
      where p.postid = ?
    
    `


  const [posts] = await pool.query(query, params)

  if (!post) {
    return {
      resultCode: 404,
      message: 'Post not found'
    }
  }

  return {
    resultCode: 200,
    isTokenValid: true,
    data: posts
  }
}

const getVoteInfo = async (myuserId, postId) => {

  const [postRows] = await pool.query(
    'SELECT userid FROM post WHERE postid = ?',
    [postId]
  )

  if (postRows.length === 0) {
    throw new Error('Post not found')
  }

  const postRow = postRows[0]
  const isMyPost = postRow.userid === myuserId

  const [voteRows] = await pool.query(
    'SELECT optionid FROM voteresult WHERE postid = ? AND userid = ?',
    [postId, myuserId]
  )

  const hasVoted = voteRows.length > 0
  const selectedChoiceId = hasVoted ? voteRows[0].optionid : null

  const votequery = `
  SELECT 
    o.optionid,
    o.optiontext,
    COUNT(v.optionid) AS votes,
    (
      SELECT COUNT(*) 
      FROM voteresult 
      WHERE postid = ?
    ) AS total_votes
  FROM voteoption o
  LEFT JOIN voteresult v 
    ON o.optionid = v.optionid AND v.postid = ?
  WHERE o.postid = ?
  GROUP BY o.optionid, o.optiontext
  ORDER BY o.optionid;
  `

  const voteResultRows = await get_rows(conn, votequery, [postId, postId, postId])

  return {
    resultCode: 200,
    isTokenValid: true,
    data: {
      isMyPost,
      hasVoted,
      selectedChoiceId,
      voteOptions: voteResultRows.map(row => {

        const votes = Number(row.votes ?? 0)
        const total = Number(row.total_votes ?? 0)

        return {
          optionId: row.optionid,
          optionText: row.optiontext,
          voteCount: votes,
          percentage: total === 0
            ? 0
            : Math.round((votes / total) * 1000) / 10
        }
      })
    }
  }
}

module.exports = { getPostDetail, getVoteInfo }