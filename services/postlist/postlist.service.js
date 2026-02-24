const { pool } = require('../../config/db')
const postListQuery = require('./postlist.query')

const getNewPosts = async (userId,postid,postdate,latitude,longitude) => {

    const{ query, params } = postListQuery.buildPostListQuery({
        myuserid:userId,
        latitude:latitude,
        longitude:longitude,
        postid:postid,
        postdate:postdate

    })
     const [posts] = await pool.query(
    query,
    params
  )
    console.log(posts)

  return {
    isTokenValid:true,
    resultCode:200,
    data: {
        posts:posts
    }
  }


}

module.exports = { getNewPosts }
