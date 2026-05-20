
function buildPostListQuery(options = {}) {
  const { sort = 'latest' } = options

  if (sort === 'popular') {
    return buildPopularPostQuery(options)
  }

  return buildNormalPostQuery(options)
}
function getCommonJoins() {
  return `
    LEFT JOIN (
      SELECT postid, COUNT(*) AS commentcount
      FROM comment
      GROUP BY postid
    ) com ON p.postid = com.postid

    LEFT JOIN (
      SELECT postid, COUNT(*) AS likecount
      FROM likepost
      GROUP BY postid
    ) lik ON p.postid = lik.postid

    LEFT JOIN (
      SELECT postid, GROUP_CONCAT(tagname SEPARATOR '#') AS tags
      FROM (
        SELECT postid, tagname
        FROM posttag
        LEFT JOIN tag ON posttag.tagid = tag.tagid
      ) tag_sub
      GROUP BY postid
    ) tag ON p.postid = tag.postid

    LEFT JOIN (
      SELECT userid AS id, nickname, profileimage, gender
      FROM user
    ) getuser ON p.userid = getuser.id

    LEFT JOIN (
      SELECT postid, MAX(optiontext) AS vote
      FROM voteoption
      GROUP BY postid
    ) vote ON p.postid = vote.postid

    LEFT JOIN (
      SELECT postid, userid AS isliked
      FROM likepost
      WHERE userid = ?
    ) mylike ON p.postid = mylike.postid

    LEFT JOIN (
      SELECT postid, GROUP_CONCAT(filename SEPARATOR ',') AS images
      FROM imagefile
      GROUP BY postid
    ) image ON p.postid = image.postid

    LEFT JOIN (
      SELECT postid, filename AS audio
      FROM audiofile
    ) audio ON p.postid = audio.postid

    LEFT JOIN (
      SELECT postid, COUNT(*) AS votecount
      FROM voteresult
      GROUP BY postid
    ) votecount ON p.postid = votecount.postid
  `
}
function buildNormalPostQuery(options) {
  const {
    myuserid,
    tagid,
    targetuserid,
    latitude,
    longitude,
    distance,
    postid,
    postdate,
    sort = 'latest'
  } = options


  console.log(postdate)
  const selectParams = []
  const joinParams = [myuserid]
  const whereParams = []
  const havingParams = []

  let distanceSelect = ''
  let havingClause = ''
  let orderClause = ''

  /* ---------- 거리 계산 ---------- */
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
    selectParams.push(latitude, longitude, latitude)

    if (sort === 'distance' && distance) {
      havingClause = 'HAVING distance <= ?'
      havingParams.push(distance)
      orderClause = 'ORDER BY distance ASC, p.postid DESC'
    }
  }

  if (!orderClause) {
    orderClause = 'ORDER BY p.date DESC, p.postid DESC'
  }

  /* ---------- 태그 필터 ---------- */
  const whereConditions = []


 if (tagid) {
  whereConditions.push(`
    EXISTS (
      SELECT 1
      FROM posttag pt
      WHERE pt.postid = p.postid
      AND pt.tagid = ?
    )
  `)
  whereParams.push(tagid)
}
/* ---------- 유저 필터 ---------- */

if(targetuserid) {
  whereConditions.push('p.userid = ?')
  whereParams.push(targetuserid)
}

  /* ---------- 페이징 ---------- */
  if (postid) {
    whereConditions.push(
      '(p.date < ? OR (p.date = ? AND p.postid < ?))'
    )
    whereParams.push(postdate, postdate, postid)
  }

  const whereClause =
    whereConditions.length > 0
      ? 'WHERE ' + whereConditions.join(' AND ')
      : ''

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
          'thumbnailUrl', m.thumbnailurl
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
    ${getCommonJoins()}
    ${whereClause}
    ${havingClause}
    ${orderClause}
    LIMIT 20
  `

  return {
    query,
    params: [
      ...selectParams,
      ...joinParams,
      ...whereParams,
      ...havingParams
    ]
  }
}
function buildPopularPostQuery(options) {
  const {
    myuserid,
    tagid,
    postid,
    score
  } = options

  const joinParams = [myuserid]
  const whereParams = []

  const withClause = `
    WITH post_with_popularity AS (
      SELECT
        post.*,
        IFNULL(ps.score,0) AS score,
        (IFNULL(ps.score,0) /
          POWER(TIMESTAMPDIFF(HOUR, post.date, NOW()) + 2, 1.5)
        ) AS popularityScore
      FROM post
      LEFT JOIN post_scores ps ON post.postid = ps.postid
    )
  `

  const whereConditions = []

 if (tagid) {
  whereConditions.push(`
    EXISTS (
      SELECT 1
      FROM posttag pt
      WHERE pt.postid = p.postid
      AND pt.tagid = ?
    )
  `)
  whereParams.push(tagid)
}

  if (postid && score !== undefined) {
    whereConditions.push(
      '(p.popularityScore < ? OR (p.popularityScore = ? AND p.postid < ?))'
    )
    whereParams.push(score, score, postid)
  }

  const whereClause =
    whereConditions.length > 0
      ? 'WHERE ' + whereConditions.join(' AND ')
      : ''

  const query = `
    ${withClause}
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
          'thumbnailUrl', m.thumbnailurl
        )
      )
      FROM media m
      WHERE m.postid = p.postid
    ),
    JSON_ARRAY()
  ) AS media,
      IFNULL(com.commentcount,0) AS commentcount,
      IFNULL(lik.likecount,0) AS likecount,
      p.score,
      p.popularityScore
    FROM post_with_popularity p
    ${getCommonJoins()}
    ${whereClause}
    ORDER BY p.popularityScore DESC, p.postid DESC
    LIMIT 20
  `

  return {
    query,
    params: [
      ...joinParams,
      ...whereParams
    ]
  }
}

module.exports = { buildPostListQuery,getCommonJoins }