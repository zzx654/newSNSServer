const { pool } = require('../config/db');

async function createNotification({
  senderId,
  receiverId,
  type,
  content,
  extraJson
}) {

  await pool.query(
    `INSERT INTO notifications
     (receiverId, senderId, type, content, extraJson)
     VALUES (?, ?, ?, ?, ?)`,
    [receiverId, senderId, type, content, JSON.stringify(extraJson)]
  );
}

async function canCreateLikeNotification({
  senderId,
  receiverId,
  type,
  postId
}) {

  const [rows] = await pool.query(
    `SELECT id FROM notifications
     WHERE receiverId = ?
     AND senderId = ?
     AND type = ?
     AND JSON_EXTRACT(extraJson, '$.postId') = ?`,
    [receiverId, senderId, type, postId]
  );

  return rows.length === 0;
}

module.exports = {
  createNotification,
  canCreateLikeNotification
};