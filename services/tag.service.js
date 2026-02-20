const { pool } = require("../config/db")

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

module.exports = { searchTag}