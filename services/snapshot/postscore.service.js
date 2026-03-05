const generatePostScores = async (conn, snapshotTime) => {

  const [rows] = await conn.query(
    'SELECT MAX(snapshot_time) AS lastSnapshot FROM post_scores'
  )

  const lastSnapshot = rows[0].lastSnapshot || '1970-01-01 00:00:00'

  const [changedLikes] = await conn.execute(
    `SELECT DISTINCT p.postid
     FROM likepost l
     JOIN post p ON l.postid = p.postid
     WHERE l.date > ?`,
    [lastSnapshot]
  )

  const [changedComments] = await conn.execute(
    `SELECT DISTINCT postid
     FROM comment
     WHERE date > ?`,
    [lastSnapshot]
  )

  const changedPostIds = new Set([
    ...changedLikes.map(r => r.postid),
    ...changedComments.map(r => r.postid),
  ])

  for (const postid of changedPostIds) {

    const [[likeRow]] = await conn.query(
      `SELECT COUNT(*) AS like_count
       FROM likepost
       WHERE postid = ?`,
      [postid]
    )

    const [[commentRow]] = await conn.query(
      `SELECT COUNT(*) AS comment_count
       FROM comment
       WHERE postid = ?`,
      [postid]
    )

    const score = likeRow.like_count * 3 + commentRow.comment_count * 2

    await conn.query(
      `
      INSERT INTO post_scores (
        postid, like_count, comment_count, score, snapshot_time
      )
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        like_count = VALUES(like_count),
        comment_count = VALUES(comment_count),
        score = VALUES(score),
        snapshot_time = VALUES(snapshot_time)
      `,
      [postid, likeRow.like_count, commentRow.comment_count, score, snapshotTime]
    )

  }

  console.log(` Post snapshot updated (${changedPostIds.size})`)
}

module.exports = { generatePostScores }