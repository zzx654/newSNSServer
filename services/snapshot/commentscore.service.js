const generateCommentScores = async (conn, snapshotTime) => {
  // 1. 실제 DB 수치(삭제 안 된 좋아요/답글 수)와 스냅샷 수치가 다르거나,
  //    아직 comment_scores에 없는 부모 댓글(depth = 0) ID 수집
  const [changed] = await conn.query(`
    SELECT c.commentid AS target_id
    FROM comment c
    LEFT JOIN comment_scores cs ON c.commentid = cs.commentid

    LEFT JOIN (
      SELECT commentid, COUNT(*) AS real_like_count
      FROM likecomment
      WHERE deleted_at IS NULL
      GROUP BY commentid
    ) l ON c.commentid = l.commentid
   
    LEFT JOIN (
      SELECT ref, COUNT(*) AS real_reply_count
      FROM comment
      WHERE depth = 1 AND deleted_at IS NULL
      GROUP BY ref
    ) r ON c.commentid = r.ref
    WHERE c.depth = 0 
      AND c.deleted_at IS NULL
      AND (
        cs.commentid IS NULL 
        OR cs.like_count != COALESCE(l.real_like_count, 0) 
        OR cs.reply_count != COALESCE(r.real_reply_count, 0) 
      )
  `);

  const changedCommentIds = changed.map(r => r.target_id).filter(Boolean);

  // 변경 사항이 없으면 종료
  if (changedCommentIds.length === 0) {
    return;
  }

  // 2. 수치가 안 맞는 댓글들만 정확하게 다시 집계하여 Bulk UPSERT
  const placeholders = changedCommentIds.map(() => '?').join(',');

  const bulkQuery = `
    INSERT INTO comment_scores (commentid, postid, like_count, reply_count, score, snapshot_time)
    SELECT 
      c.commentid,
      c.postid,
      COALESCE(l.like_count, 0) AS like_count,
      COALESCE(r.reply_count, 0) AS reply_count,
      (COALESCE(l.like_count, 0) + COALESCE(r.reply_count, 0) * 2) AS score,
      ? AS snapshot_time
    FROM comment c
    
    LEFT JOIN (
      SELECT commentid, COUNT(*) AS like_count
      FROM likecomment
      WHERE deleted_at IS NULL
      GROUP BY commentid
    ) l ON c.commentid = l.commentid

    LEFT JOIN (
      SELECT ref, COUNT(*) AS reply_count
      FROM comment
      WHERE depth = 1 AND deleted_at IS NULL
      GROUP BY ref
    ) r ON c.commentid = r.ref

    WHERE c.commentid IN (${placeholders})
      AND c.depth = 0
      AND c.deleted_at IS NULL
    ON DUPLICATE KEY UPDATE
      like_count = VALUES(like_count),
      reply_count = VALUES(reply_count),
      score = VALUES(score),
      snapshot_time = VALUES(snapshot_time);
  `;

  await conn.query(bulkQuery, [snapshotTime, ...changedCommentIds]);

  console.log(`[Comment Snapshot] ${changedCommentIds.length}개 댓글 수치 자동 보정 및 업데이트 완료`);
};

module.exports = { generateCommentScores };