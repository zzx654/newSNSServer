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

const getNewTagPosts = async (userId,tagid,postid,postdate,latitude,longitude) => {

    const{ query, params } = postListQuery.buildPostListQuery({
        myuserid:userId,
        tagid:tagid,
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

const getPopularTagPosts = async (userId,tagid,postid,score,latitude,longitude) => {

    const{ query, params } = postListQuery.buildPostListQuery({
        myuserid:userId,
        tagid:tagid,
        latitude:latitude,
        longitude:longitude,
        sort:'popular',
        postid:postid,
        score:score
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

const getUserPosts = async (myUserId,targetUserId,postid,postdate,latitude,longitude) => {

    const{ query, params } = postListQuery.buildPostListQuery({
        myuserid:myUserId,
        targetuserid:targetUserId,
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

module.exports = { getNewPosts, getNewTagPosts,  getPopularTagPosts, getUserPosts }
