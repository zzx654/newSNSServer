function buildNewPostQuery(options) {

const {
    tagid=0,
    sort = 'latest',
    latitude,
    longitude,
    distance,
    postid,
    postdate,
    myUserid,
    score
  } = options
//거리순
//인기순
//새로운순
//태그인기순
//태그 새로운순

  const params = []
  const whereConditions = []
  let distanceSelect = ''
  let distanceCondition=''
  let withPopularity = ''
  let fromClause = 'FROM post p'
  let popularityFields = ''

  if (latitude && longitude) {
    distanceSelect = `
      , IF(ISNULL(p.latitude), -100.0,
        (6371 * acos(
          cos(radians(?)) *
          cos(radians(p.latitude)) *
          cos(radians(p.longitude) - radians(?)) +
          sin(radians(?)) *
          sin(radians(p.latitude))
        ))
      ) AS distance
    `
    params.push(latitude, longitude, latitude)
  }
  params.push(myUserid)
  //태그게시물
  if(tagid) {
     whereConditions.push("t.tagid = ?")
    params.push(tagid)
  }
 

 
    switch(sort) {
      case 'distance': {
            whereConditions.push('p.latitude IS NOT NULL')
    distanceCondition = 'having distance<=?'
        orderClause = 'ORDER BY p.date DESC,p.postid DESC'
        params.push(distance)
        


      }
      case 'popular': {
  

        withPopularity = `WITH post_with_popularity AS (
  SELECT
    post.*,
    IFNULL(ps.score, 0) AS score,
    (IFNULL(ps.score, 0) / POWER(TIMESTAMPDIFF(HOUR, post.date, NOW()) + 2, 1.5)) AS popularityScore
  FROM post
  LEFT JOIN post_scores ps ON post.postid = ps.postid
)`
popularityFields = 'p.score,p.popularityScore'
fromClause = 'FROM post_with_popularity p'


orderClause = 'ORDER BY p.popularityScore DESC, p.postid DESC'

      }
      case 'latest': {
        orderClause = 'ORDER BY p.date DESC,p.postid DESC'

      }
      default:
    }
      //페이징 처리
  if(postid) {
    if(score) {
      whereConditions.push(
      '(p.popularityScore < ? OR (p.popularityScore = ? AND p.postid < ?))'
    )
    params.push(score)
    params.push(score)
    params.push(postid)
    } else {
      whereConditions.push(
      '(p.date < ? OR (p.date = ? AND p.postid < ?))'
    ) 
    params.push(postdate)
    params.push(postdate)
    params.push(postid)

    }
  }
    const whereClause =
    whereConditions.length > 0
      ? ' WHERE ' + whereConditions.join(' AND ')
      : ''

  return `
  ${withPopularity}
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
    image.images,
    audio.audio,
    IFNULL(com.commentcount,0) AS commentcount,
    IFNULL(lik.likecount,0) AS likecount
    ${distanceSelect}
    ${popularityFields}
    ${fromClause}

  INNER JOIN posttag pt ON p.postid = pt.postid
INNER JOIN tag t ON pt.tagid = t.tagid

LEFT OUTER JOIN (
  SELECT postid, COUNT(*) AS commentcount
  FROM comment
  GROUP BY postid
) com ON p.postid = com.postid

LEFT OUTER JOIN (
  SELECT postid, COUNT(*) AS likecount
  FROM likepost
  GROUP BY postid
) lik ON p.postid = lik.postid

LEFT OUTER JOIN (
  SELECT postid, GROUP_CONCAT(tagname SEPARATOR '#') AS tags
  FROM (
    SELECT postid, tagname
    FROM posttag
    LEFT JOIN tag ON posttag.tagid = tag.tagid
  ) tag_sub
  GROUP BY postid
) tag ON p.postid = tag.postid

LEFT OUTER JOIN (
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

  ${whereClause}
  ${distanceCondition}
  ${orderClause}

  LIMIT 20

  `
}