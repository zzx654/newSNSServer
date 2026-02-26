const { pool } = require('../config/db');
const { shortenMultiline } = require('../../utils/shortenmultiline')
const { sendFCM } = require('../../utils/fcm')
async function createNotification({
  sender,
  receiver,
  isAnonymous,
  type,
  commentContent,
  extraJson
}) {
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

  await pool.query(
    `INSERT INTO notifications
     (receiverId, senderId, type, content, extraJson)
     VALUES (?, ?, ?, ?, ?)`,
    [receiver.userid, sender.userid, type, content, JSON.stringify(extraJson)]
  );
    const message = {
    token: receiver.fcmtoken,
    data: {
          notificationId: notification.id.toString(),
    type: String(notification.type),
    content: String(notification.content),
    date: formatLocalDate(notification.date),   // ★ FIXED
    extraJson: JSON.stringify(notification.extraJson),
    title: String(title),
    ...(commentContent != null && { body: `"${shortenMultiline(commentContent)}"` })
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
    params.push(extraJson.follwerId);
  }

  const [rows] = await pool.query(sql, params);
  return rows.length === 0;
}

module.exports = {
  createNotification,
  canCreateLikeNotification
};