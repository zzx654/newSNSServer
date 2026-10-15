function buildMediaListQuery(options) {
  const {
    targetUserId,
    cursor,
    type,
    latitude,
    longitude
  } = options
  const selectParams = []
  const whereParams = []
  const whereConditions = []
  let distanceSelect = ''
 
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
  }
  whereConditions.push('p.anonymous IS NULL')
  if (type) {
    whereConditions.push('m.type = ?')
    whereParams.push(type)
  }
  if (targetUserId) {
    whereConditions.push('p.userid = ?')
    whereParams.push(targetUserId)
  }
  if (cursor) {
    whereConditions.push('m.id < ?')
    whereParams.push(cursor)
  }
  const whereClause = 
  whereConditions.length > 0
  ? 'WHERE ' + whereConditions.join(' AND ')
  : ''

  const query = `
  SELECT
  m.id,
  m.type,
  m.postid,
  m.url,
  m.thumbnailurl,
  p.text,
  p.date,
  getuser.nickname,
  getuser.userid,
  IFNULL(com.commentcount,0) AS commentcount,
  IFNULL(lik.likecount,0) AS likecount
      ${distanceSelect}
  FROM media m
  JOIN post p
  ON m.postid = p.postid
  ${getPostJoins()}
  ${whereClause}
  ORDER BY m.id DESC
  LIMIT 20

    `
  return {
    query,
    params: [
      ...selectParams,
      ...whereParams
    ]
  }

}
function getPostJoins() {
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

    LEFT JOIN user getuser
        ON p.userid = getuser.userid
  `

  
}

module.exports = { buildMediaListQuery }