const generatePostScores = async (conn, snapshotTime) => {
  // 1. 실제 DB 수치(좋아요/댓글 수)와 스냅샷 수치가 다르거나,
  //    아직 post_scores에 등록되지 않은 게시글 ID 수집
  const [changed] = await conn.query(`
    SELECT p.postid AS target_id
    FROM post p
    LEFT JOIN post_scores ps ON p.postid = ps.postid
    -- 실제 좋아요 수 집계 (삭제 안 된 건)
    LEFT JOIN (
      SELECT postid, COUNT(*) AS real_like_count
      FROM likepost
      WHERE deleted_at IS NULL
      GROUP BY postid
    ) l ON p.postid = l.postid
    -- 실제 전체 댓글/답글 수 집계 (삭제 안 된 건)
    LEFT JOIN (
      SELECT postid, COUNT(*) AS real_comment_count
      FROM comment
      WHERE deleted_at IS NULL
      GROUP BY postid
    ) c ON p.postid = c.postid
    WHERE p.deleted_at IS NULL
      AND (
        ps.postid IS NULL -- 스냅샷이 없는 신규 게시글
        OR ps.like_count != COALESCE(l.real_like_count, 0) -- 좋아요 수 불일치
        OR ps.comment_count != COALESCE(c.real_comment_count, 0) -- 댓글 수 불일치
      )
  `);

  const changedPostIds = changed.map(r => r.target_id).filter(Boolean);

  // 변경되거나 수치가 틀린 게시글이 없으면 종료
  if (changedPostIds.length === 0) {
    return;
  }

  // 2. 수치가 안 맞는 게시글들만 정확하게 집계하여 Bulk UPSERT
  const placeholders = changedPostIds.map(() => '?').join(',');

  const bulkQuery = `
    INSERT INTO post_scores (postid, like_count, comment_count, score, snapshot_time)
    SELECT 
      p.postid,
      COALESCE(l.like_count, 0) AS like_count,
      COALESCE(c.comment_count, 0) AS comment_count,
      (COALESCE(l.like_count, 0) * 3 + COALESCE(c.comment_count, 0) * 2) AS score,
      ? AS snapshot_time
    FROM post p

    LEFT JOIN (
      SELECT postid, COUNT(*) AS like_count
      FROM likepost
      WHERE deleted_at IS NULL
      GROUP BY postid
    ) l ON p.postid = l.postid

    LEFT JOIN (
      SELECT postid, COUNT(*) AS comment_count
      FROM comment
      WHERE deleted_at IS NULL
      GROUP BY postid
    ) c ON p.postid = c.postid

    WHERE p.postid IN (${placeholders})
      AND p.deleted_at IS NULL
    ON DUPLICATE KEY UPDATE
      like_count = VALUES(like_count),
      comment_count = VALUES(comment_count),
      score = VALUES(score),
      snapshot_time = VALUES(snapshot_time);
  `;

  await conn.query(bulkQuery, [snapshotTime, ...changedPostIds]);

  console.log(`[Post Snapshot] ${changedPostIds.length}개 게시글 수치 자동 보정 및 업데이트 완료`);
};

module.exports = { generatePostScores };