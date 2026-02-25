const { pool } = require("../../config/db")

const searchTag = async(userId,tag) => {

    const tagQuery = "%"+tag+"%"
    const [tags] = await pool.query(` SELECT
    t.tagid,
    t.tagname,
    COUNT(*) AS tagcount,
    CASE 
        WHEN ft.tagid IS NOT NULL THEN TRUE
        ELSE FALSE
    END AS isliked
FROM
    posttag pt
LEFT JOIN
    post p ON pt.postid = p.postid
LEFT JOIN
    tag t ON pt.tagid = t.tagid
LEFT JOIN
    favoritetags ft ON ft.tagid = t.tagid AND ft.userid = ?
WHERE
    t.tagname LIKE CONCAT('%', ?, '%') 
GROUP BY
    t.tagname, t.tagid
ORDER BY
    tagcount DESC
  `,
  [userId,tagQuery]
)

return {
    resultCode: 200,
    isTokenValid:true,
    data: {
        searchedTags:tags
    }
}
   
}

const getTags = async(userId) => {

    const [favoriteTags] = await pool.query(`
    SELECT
      t.tagid,
      t.tagname,
      1 AS isliked
    FROM
      favoritetags ft
    JOIN
      tag t ON ft.tagid = t.tagid
    WHERE
      ft.userid = ?
    ORDER BY
      t.tagname ASC
  `,
  [userId]
        
    )
    const [popularTags] = await pool.query(`
    SELECT
      t.tagid,
      t.tagname,
      COUNT(*) AS tagcount,
      CASE 
        WHEN ft.tagid IS NOT NULL THEN TRUE
        ELSE FALSE
      END AS isliked
    FROM
      posttag pt
    LEFT JOIN
      post p ON pt.postid = p.postid
    LEFT JOIN
      tag t ON pt.tagid = t.tagid
    LEFT JOIN
      favoritetags ft ON ft.tagid = t.tagid AND ft.userid = ?
       WHERE
      p.date >= NOW() - INTERVAL 300 DAY
    GROUP BY
      t.tagname, t.tagid
    ORDER BY
      tagcount DESC
  `,
  [userId]

    )

 return {
  resultCode:200,
  isTokenValid:true,
  data: {
  favoriteTags:favoriteTags,
  popularTags:popularTags
  }
}

}

const toggleFavoriteTag = async(userId,tagid) => {
    try {
        await pool.query(
            'INSERT INTO favoritetags (tagid, userid) VALUES (?, ?)',
            [tagid,userId]
        )

    } catch (err) {
        if(err.code === 'ER_DUP_ENTRY') {
            await pool.query(
                'DELETE FROM favoritetags WHERE tagid = ? AND userid = ?',
                [tagid,userId]
            )

        }else {
            throw err
        }

    }
      const [favoriteTags] = await pool.query(`
    SELECT
      t.tagid,
      t.tagname,
      1 AS isliked
    FROM
      favoritetags ft
    JOIN
      tag t ON ft.tagid = t.tagid
    WHERE
      ft.userid = ?
    ORDER BY
      t.tagname ASC
  `,
  [userId]
        
    )
    const [popularTags] = await pool.query(`
    SELECT
      t.tagid,
      t.tagname,
      COUNT(*) AS tagcount,
      CASE 
        WHEN ft.tagid IS NOT NULL THEN TRUE
        ELSE FALSE
      END AS isliked
    FROM
      posttag pt
    LEFT JOIN
      post p ON pt.postid = p.postid
    LEFT JOIN
      tag t ON pt.tagid = t.tagid
    LEFT JOIN
      favoritetags ft ON ft.tagid = t.tagid AND ft.userid = ?
       WHERE
      p.date >= NOW() - INTERVAL 300 DAY
    GROUP BY
      t.tagname, t.tagid
    ORDER BY
      tagcount DESC
  `,
  [userId]

    )

 return {
  resultCode:200,
  isTokenValid:true,
  data: {
  favoriteTags:favoriteTags,
  popularTags:popularTags
  }
}


}


module.exports = { searchTag, getTags, toggleFavoriteTag }