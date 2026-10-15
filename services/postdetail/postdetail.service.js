const { pool } = require('../../config/db')
const  postlistQuery = require('../postlist/postlist.query')
const { transaction } = require("../../utils/transaction")
const { getUserVote } = require('../../utils/getuservote')

const notification = require('../notification/notification.service')

const getPostById = async (conn, myuserId, postId, latitude, longitude) => {

  let params = []
  let distanceSelect = ''

  if (latitude && longitude) {
    distanceSelect = `
      , (6371 * acos(
        cos(radians(?)) *
        cos(radians(p.latitude)) *
        cos(radians(p.longitude) - radians(?)) +
        sin(radians(?)) *
        sin(radians(p.latitude))
      )) AS distance
    `
    params.push(latitude, longitude, latitude)
  }

  params.push(myuserId, postId)

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
           IFNULL(
    (
      SELECT JSON_ARRAYAGG(
        JSON_OBJECT(
          'id', m.id,
          'url', m.url,
          'type', m.type,
          'thumbnailurl', m.thumbnailurl
        )
      )
      FROM media m
      WHERE m.postid = p.postid
    ),
    JSON_ARRAY()
  ) AS media,
      IFNULL(com.commentcount,0) AS commentcount,
      IFNULL(lik.likecount,0) AS likecount
      ${distanceSelect}
    FROM post p
    ${postlistQuery.getCommonJoins()}
    WHERE p.postid = ? AND p.deleted_at IS NULL
  `

  const [posts] = await conn.query(query, params)

  return posts
}
const getPostDetail = async (myuserId, postId, latitude, longitude) => {

  const posts = await getPostById(pool, myuserId, postId, latitude, longitude)

  if (!posts.length) {
    return {
      resultCode: 404,
      message: 'Post not found'
    }
  }
  console.log('????')
  console.log(posts)

  return {
    resultCode: 200,
    isTokenValid: true,
    data: { posts }
  }
}
async function getVoteOptions(conn, postId) {

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

  const [rows] = await conn.query(votequery, [postId, postId, postId])

  return rows.map(row => {

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
const getVoteInfo = async (myuserId, postId) => {

  const conn = await pool.getConnection()

  try {

    const [postRows] = await conn.query(
      'SELECT userid FROM post WHERE postid = ?',
      [postId]
    )

    if (postRows.length === 0) {
      throw new Error('Post not found')
    }

    const postRow = postRows[0]
    const isMyPost = postRow.userid === myuserId

    const { hasVoted, selectedChoiceId } = await getUserVote(conn, postId, myuserId)

    const voteOptions = await getVoteOptions(conn, postId)

    return {
      resultCode: 200,
      isTokenValid: true,
      data: {
        isMyPost,
        hasVoted,
        selectedChoiceId,
        voteOptions
      }
    }

  } finally {
    conn.release()
  }
}

const vote = async (myuserId, postId, optionId) => {

  return transaction(async (conn) => {

    const [postRows] = await conn.query(
      'SELECT userid FROM post WHERE postid = ?',
      [postId]
    )

    if (postRows.length === 0) {
      throw new Error('Post not found')
    }

    await conn.query(
      'INSERT INTO voteresult(userid,postid,optionid) VALUES(?,?,?)',
      [myuserId, postId, optionId]
    )

    const postRow = postRows[0]
    const isMyPost = postRow.userid === myuserId

    const { hasVoted, selectedChoiceId } = await getUserVote(conn, postId, myuserId)

    const voteOptions = await getVoteOptions(conn, postId)

    return {
      resultCode: 200,
      isTokenValid: true,
      data: {
        isMyPost,
        hasVoted,
        selectedChoiceId,
        voteOptions
      }
    }

  })
}

const cancelVote = async(myuserId,postId) => {

  return transaction(async(conn)=>{
     const [postRows] = await conn.query(
      'SELECT userid FROM post WHERE postid = ?',
      [postId]
    )

    if (postRows.length === 0) {
      throw new Error('Post not found')
    }

    await conn.query('DELETE FROM voteresult where postid=? and userid=?',[postId,myuserId])

    return {
      resultCode:200,
      isTokenValid:true
    }

  })


}

const toggleLikePost = async (myuserId, postId) => {
  //  대상 게시글 및 유저 정보 조회
  const [postRows] = await pool.query('SELECT * FROM post WHERE postid = ?', [postId]);
  const post = postRows[0];

  if (!post) {
    throw new Error('게시글을 찾을 수 없습니다.');
  }

  const [postUserRows] = await pool.query('SELECT * FROM user WHERE userid = ?', [post.userid]);
  const postUser = postUserRows[0];

  const [myuserRows] = await pool.query('SELECT * FROM user WHERE userid = ?', [myuserId]);
  const myuser = myuserRows[0];

  //  기존 좋아요 이력 조회 (소프트 삭제된 것 포함)
  const [existingLikes] = await pool.query(
    'SELECT * FROM likepost WHERE userid = ? AND postid = ?',
    [myuserId, postId]
  );
  const existingLike = existingLikes[0];

  let isLiked = false;

  if (existingLike) {
    if (existingLike.deleted_at === null) {
      // 이미 좋아요 상태 ➔ 좋아요 취소 (소프트 삭제)
      await pool.query(
        'UPDATE likepost SET deleted_at = NOW() WHERE userid = ? AND postid = ?',
        [myuserId, postId]
      );
      isLiked = false;
    } else {
      //  소프트 삭제된 상태 ➔ 좋아요 재등록 (복구)
      await pool.query(
        'UPDATE likepost SET deleted_at = NULL, date = NOW() WHERE userid = ? AND postid = ?',
        [myuserId, postId]
      );
      isLiked = true;
    }
  } else {
    // 신규 좋아요 INSERT
    await pool.query(
      'INSERT INTO likepost (userid, postid, date, deleted_at) VALUES (?, ?, NOW(), NULL)',
      [myuserId, postId]
    );
    isLiked = true;
  }

 
  if (isLiked && myuserId !== postUser.userid) {
    const canCreate = await notification.canCreateNotification(
      'LIKEPOST',
      myuserId,
      postUser.userid,
      { postId: postId }
    );

    if (canCreate) {
      await notification.createNotification(
        myuser,
        postUser,
        null,
        'LIKEPOST',
        null,
        { postId: postId }
      );
    }
  }

  return {
    resultCode: 200,
    isTokenValid: true,
    data: {
      isLiked
    }
  };
};

const deletePost = async(myuserId,postid) => {

  return transaction(async (conn) => {
    const [postRows] = await conn.query(
      'SELECT userid FROM post WHERE postid = ? and userid=?',
      [postid,myuserId]
    )
   
      
    if (!postRows) throw new Error('Post not found')
      
     await conn.query(
      'UPDATE post SET deleted_at = NOW() WHERE postid=? AND userid=? AND deleted_at IS NULL',
      [postid,myuserId] 
    );

    return {
      resultCode:200,
      isTokenValid:true
    }

  })

}




module.exports = { getPostDetail, getVoteInfo, vote, cancelVote, toggleLikePost, deletePost, getPostById }