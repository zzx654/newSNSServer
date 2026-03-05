const generateCommentScores = async (conn, snapshotTime) => {

  const [rows] = await conn.query(
    'SELECT MAX(snapshot_time) AS lastSnapshot FROM comment_scores'
  )

  const lastSnapshot = rows[0].lastSnapshot || '1970-01-01 00:00:00'

  const [changedLikes] = await conn.execute(
    `SELECT DISTINCT c.commentid
     FROM likecomment l
     JOIN comment c ON l.commentid = c.commentid
     WHERE l.date > ? AND c.depth = 0`,
    [lastSnapshot]
  )

  const [changedComments] = await conn.execute(
    `SELECT commentid
     FROM comment
     WHERE date > ? AND depth = 0`,
    [lastSnapshot]
  )

  const changedCommentIds = new Set([
    ...changedLikes.map(r => r.commentid),
    ...changedComments.map(r => r.commentid),
  ])

  for (const commentid of changedCommentIds) {

    const [[commentMeta]] = await conn.query(
      `SELECT ref, postid
       FROM comment
       WHERE commentid = ? AND depth = 0`,
      [commentid]
    )

    if (!commentMeta) continue

    const { ref, postid } = commentMeta

    const [[likeRow]] = await conn.query(
      `SELECT COUNT(*) AS like_count
       FROM likecomment
       WHERE commentid = ?`,
      [commentid]
    )

    const [[replyRow]] = await conn.query(
      `SELECT COUNT(*) AS reply_count
       FROM comment
       WHERE ref = ? AND depth = 1`,
      [ref]
    )

    const score = likeRow.like_count + replyRow.reply_count * 2

    await conn.query(
      `
      INSERT INTO comment_scores (
        commentid, postid, like_count, reply_count, score, snapshot_time
      )
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        like_count = VALUES(like_count),
        reply_count = VALUES(reply_count),
        score = VALUES(score),
        snapshot_time = VALUES(snapshot_time)
      `,
      [
        commentid,
        postid,
        likeRow.like_count,
        replyRow.reply_count,
        score,
        snapshotTime,
      ]
    )

  }

  console.log(` Comment snapshot updated (${changedCommentIds.size})`)
}

module.exports = { generateCommentScores }