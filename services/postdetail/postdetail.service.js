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

module.exports = { getPostDetail }