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
async function createRequestChatNotification(
    chatRequestId,
    requesterUserId,
    targetUserId,
    postId,
    commentId,
    date
) {
    let title = '';
    let content = '';
    let extraJson = {}
    let requesterNickname = '';
    let requesterGender = '';
    let requesterProfileImage = '';

    // 타겟 유저(받는 사람) 정보 먼저 조회 (FCM 토큰 필요)
    const [targetUserRows] = await pool.query(
        'SELECT * FROM user WHERE userid = ?',
        [targetUserId]
    );
    const receiver = targetUserRows[0];
    if (!receiver) return; // 유저가 없으면 중단

    // 게시물 또는 댓글 출처인 경우 (익명 요청)
    if (commentId !== null) {
        title = "나의 댓글로부터 채팅 요청";
        extraJson = { postId: postId, commentId: commentId };

        const [rows] = await pool.query('SELECT * FROM comment WHERE commentid=?', [commentId]);
        if (rows.length > 0) content = rows[0].text;

    } else if (postId !== null) {
        title = "나의 게시글로부터 채팅 요청";
        extraJson = { postId: postId };

        const [rows] = await pool.query('SELECT * FROM post WHERE postid=?', [postId]);
        if (rows.length > 0) content = rows[0].text;

    } else {
        // 유저 검색을 통한 요청인 경우 (공개 요청)
        const [requesterUserRows] = await pool.query(
            'SELECT * FROM user WHERE userid=?',
            [requesterUserId]
        );
        const requester = requesterUserRows[0];
        
        if (requester) {
            title = `${requester.nickname}님의 채팅 요청`;
            requesterNickname = requester.nickname;
            requesterGender = requester.gender;
            requesterProfileImage = requester.profileimage;
        }
        extraJson = { userId: requesterUserId };
        content = "대화를 나누고 싶어요~";
    }

    // FCM 메시지 구성 및 전송
    const shortContent = shortenMultiline(content);

  
    const message = {
        token: receiver.fcmtoken,
        data: {
            chatRequestId: String(chatRequestId),
            content: title + `\n“${shortContent}”`,
            date: String(date),
            requesterNickname: String(requesterNickname),
            requesterGender: String(requesterGender),
            requesterProfileImage: String(requesterProfileImage),
            extraJson: JSON.stringify(extraJson),
            title: String(title),
            body: `"${shortContent}"`
        }
    };

    sendFCM(message).catch(err => {
        console.log("FCM error:", err.code);
    });
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

sendFCM(message).catch(err => {
  console.log("FCM error:", err.code)
})

  
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

const getNotifications = async (myuserId, notificationid, notificationdate) => {
  let query = '';
  const params = [];

  if (notificationid && notificationdate) {
    // 2페이지 이후: 커서(date, id) 기준 다음 20개 조회
    query = `
      SELECT * 
      FROM notification 
      WHERE receiverid = ? 
        AND (date < ? OR (date = ? AND id < ?)) 
      ORDER BY date DESC, id DESC 
      LIMIT 20
    `;
    params.push(myuserId, notificationdate, notificationdate, notificationid);
  } else {
    // 1페이지: 최신 20개 조회
    query = `
      SELECT * 
      FROM notification 
      WHERE receiverid = ? 
      ORDER BY date DESC, id DESC 
      LIMIT 20
    `;
    params.push(myuserId);
  }

  // unreadCount 카운트 쿼리
  const [unread] = await pool.query(
    'SELECT COUNT(*) as unreadCount FROM notification WHERE receiverid = ? AND isread = 0',
    [myuserId]
  );

  const [notificationRows] = await pool.query(query, params);

  return {
    isTokenValid: true,
    resultCode: 200,
    data: {
      notifications: notificationRows,
      unreadCount: unread[0].unreadCount
    }
  };
};
const getUnreadNotificationCount = async(myuserId) => {
  const [unread] = await pool.query('SELECT COUNT(*) as unreadCount FROM notification WHERE receiverid=? AND isread = 0',
    [myuserId]
  )
  return {
    isTokenValid: true,
    resultCode:200,
    data: {
      unReadCount:unread[0].unreadCount
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

const readAllNotifications = async(myuserId) => {
  try {
         await pool.query('UPDATE notification SET isread=1 where receiverid=?',[myuserId])
        
 
      //const [getNotificationsResult] = await pool.query('select *from notification where receiverid=?',[myuserId])
      //const unreadCount = await getUnreadCount(myuserId)
    return {
      isTokenValid:true,
      resultCode:200
    
    }

  }catch(err) {
    throw(err)
  }
 

}

const deleteNotifications = async(myuserId) => {
  try {
      await pool.query("DELETE FROM notification where receiverid=?",[myuserId])

      //const [getNotificationsResult] = await pool.query('select *from notification where receiverid=?',[myuserId])
      //const unreadCount = await getUnreadCount(myuserId)
    return {
           isTokenValid:true,
      resultCode:200

    }

  } catch(err) {
    throw(err)
  }




}


module.exports = {
  createNotification,
  createRequestChatNotification,
  canCreateNotification,
  getNotifications,
  getUnreadNotificationCount,
  readNotification,
  readAllNotifications,
  deleteNotifications
};