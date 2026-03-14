const { pool } = require('../../config/db');
const { shortenMultiline } = require('../../utils/shortenmultiline')
const { sendFCM } = require('../../utils/fcm');;

async function getUnreadCount(userId) {
  const [rows] = await pool.query(
    'SELECT COUNT(*) AS unreadCount FROM notification WHERE receiverid=? AND isread=0',
    [userId]
  )
  return rows[0].unreadCount
}
async function validateLikePost(extra) {
  const [post] = await pool.query(
    'SELECT postid FROM post WHERE postid=?',
    [extra.postId]
  )

  if (!post.length) {
    return { status: "TARGET_DELETED", reason: "POST_DELETED" }
  }

  return null
}
async function validateComment(extra) {
  const [post] = await pool.query(
    'SELECT postid FROM post WHERE postid=?',
    [extra.postId]
  )

  if (!post.length) {
    return { status: "TARGET_DELETED", reason: "POST_DELETED" }
  }

  const [comment] = await pool.query(
    'SELECT commentid FROM comment WHERE commentid=?',
    [extra.commentId]
  )

  if (!comment.length) {
    return { status: "TARGET_DELETED", reason: "COMMENT_DELETED" }
  }

  return null
}
const notificationValidators = {
  LIKEPOST: validateLikePost,
  LIKECOMMENT: validateComment,
  COMMENT: validateComment,
  REPLY: validateComment
}

async function checkPostExists(postId) {
  const [rows] = await pool.query(
    'SELECT postid FROM post WHERE postid=?',
    [postId]
  )
  return rows.length > 0
}

async function checkCommentExists(commentId) {
  const [rows] = await pool.query(
    'SELECT commentid FROM comment WHERE commentid=?',
    [commentId]
  )
  return rows.length > 0
}
async function createNotification(
  sender,
  receiver,
  isAnonymous,
  type,
  commentContent,
  extraJson
) {
 
  
  
   let title = '';
  let content = '';
  switch(type) {
    case 'LIKEPOST':
      title = `누군가 회원님의 게시글을 좋아합니다.`;
      break;
    case 'COMMENT':
      title = isAnonymous?'누군가 회원님의 게시글에 댓글을 남겼습니다': `${sender.nickname}님이 회원님의 게시글에 댓글을 남겼습니다.`;
      break;
    case 'REPLY':
      title = isAnonymous?'누군가 회원님의 댓글에 답글을 남겼습니다': `${sender.nickname}님이 회원님의 댓글에 답글을 남겼습니다.`;
      break;  
    case 'LIKECOMMENT':
      title = `누군가 회원님의 댓글을 좋아합니다.`;
      break;
    case 'LIKEREPLY':
      title = '누군가 회원님의 댓글을 좋아합니다';
      break;  
    case 'FOLLOW':
      title = `${sender.nickname}님이 회원님을 팔로우하기 시작했습니다.`;
      break;
    default:
      title = '새 알림이 도착했습니다.';
  }
  content = title

  if (commentContent) {
    content += `\n“${shortenMultiline(commentContent)}”`;
  }
  
  const [result] = await pool.query(
    `INSERT INTO notification
     (receiverId, senderId, type, content, extraJson)
     VALUES (?, ?, ?, ?, ?)`,
    [receiver.userid, sender.userid, type, content, JSON.stringify(extraJson)]
  );
  const [rows] = await pool.query(
  `SELECT id, type, content, date, extraJson
   FROM notification
   WHERE id = ?`,
  [result.insertId]
);

const notification = rows[0];
 const message = {
  token: receiver.fcmtoken,
  data: {
    notificationId: String(notification.id),
    type: String(notification.type),
    content: String(notification.content),
    date: String(notification.date),
    extraJson: JSON.stringify(notification.extraJson),
    title: String(title),
    ...(typeof commentContent === 'string' && {
      body: `"${shortenMultiline(commentContent)}"`
    })
  }
};
  sendFCM(message)
}

async function canCreateNotification(type, senderId, receiverId, extraJson) {
  let sql = `
    SELECT id FROM notification
    WHERE receiverid = ?
    AND senderid = ?
    AND type = ?
  `;

  const params = [receiverId, senderId, type];

  if (type === 'LIKEPOST') {
    sql += ` AND JSON_EXTRACT(extrajson, '$.postId') = ?`;
    params.push(extraJson.postId);
  }

  if (type === 'LIKECOMMENT') {
    sql += `
      AND JSON_EXTRACT(extrajson, '$.postId') = ?
      AND JSON_EXTRACT(extrajson, '$.commentId') = ?
    `;
    params.push(extraJson.postId, extraJson.commentId);
  }

  if (type === 'FOLLOW') {
    sql += ` AND JSON_EXTRACT(extrajson, '$.followerId') = ?`;
    params.push(extraJson.followerId);
  }

  const [rows] = await pool.query(sql, params);
  return rows.length === 0;
}

const getNotifications = async(myuserId,notificationid,notificationdate) => {

  let query = 'SELECT *FROM notification WHERE receiverid = ? ORDER BY date DESC,id DESC LIMIT 15'

  const params = [myuserId]
  if(notificationid&&notificationdate) {
    query = 'SELECT *FROM (SELECT *FROM notification WHERE receiverid = ?)notis WHERE(date<? OR (date = ? AND id<?)) ORDER BY date DESC LIMIT 15'
    params.push(myuserId,notificationdate,notificationdate,notificationid)
  }
  const [unread] = await pool.query('SELECT COUNT(*) as unreadCount FROM notification WHERE receiverid=? AND isread = 0',
    [myuserId]
  )

  const [notificationRows] = await pool.query(query,params)

  return {
    isTokenValid: true,
    resultCode:200,
    data: {
      notifications:notificationRows,
      unreadCount:unread[0].unreadCount
    }
  }

}

const readNotification = async (myuserId, notificationid) => {

  await pool.query(
    'UPDATE notification SET isread=1 WHERE id=? AND receiverid=? AND isread=0',
    [notificationid, myuserId]
  )

  const [rows] = await pool.query(
    'SELECT * FROM notification WHERE id=?',
    [notificationid]
  )

  const unreadCount = await getUnreadCount(myuserId)

  if (!rows.length) {
    return {
      isTokenValid: true,
      resultCode: 200,
      data: {
        status: "TARGET_DELETED",
        reason: "NOTIFICATION_NOT_FOUND"
      }
    }
  }

  const notification = rows[0]
  let extra = notification.extrajson || {}

if (typeof extra === "string") {
  extra = JSON.parse(extra)
}

  const validator = notificationValidators[notification.type]

  if (!validator) {
    return {
      isTokenValid: true,
      resultCode: 200,
      data: { status: "UNKNOWN", unreadCount }
    }
  }

  const validationResult = await validator(extra)

  if (validationResult) {
    return {
      isTokenValid: true,
      resultCode: 200,
      data: { ...validationResult, unreadCount }
    }
  }

  return {
    isTokenValid: true,
    resultCode: 200,
    data: {
      status: "SUCCESS",
      unreadCount
    }
  }
}



module.exports = {
  createNotification,
  canCreateNotification,
  getNotifications,
  readNotification
};