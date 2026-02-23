const { transaction } = require("../../utils/transaction")

const uploadPost = async(
    userId,latitude,longitude,anonymousNick,text,tags,image,audio,voteoptions) => {
        var tagarr = new Array()
        var imagearr = new Array()
        var audioUrl = ''
        if(tags) {
            tagarr = tags.split('#').filter(t => t.length > 0)
        }

        if(image) {
            for (var i = 0; i < image.length; i++) {
                imagearr[i] = '/image?filename=' + image[i].filename;
                console.log(image[i].filename);
            }
        }
        if(audio && audio.length>0) {
            audioUrl = '/audio?filename=' + audio[0].filename;
        }
        return transaction ( async(conn)=>{
            const [postResult] = await conn.query(
          `INSERT INTO post 
          (userid,anonymous,text,latitude,longitude) 
          VALUES (?, ?, ?, ?, ?)`,
          [userId, anonymousNick || null, text, latitude||null, longitude||null]
        )
        if(tagarr && tagarr.length>0) {
            for(var i=0; i<tagarr.length;i++) {
                await conn.query(
                    `INSERT INTO tag (tagname) 
                    VALUES (?)
                    ON DUPLICATE KEY UPDATE tagname = tagname`,
                    [tagarr[i]]
                )
            }
            const[tagrows] = await conn.query(
                'SELECT tagid FROM tag WHERE tagname in (?)',
                [tagarr]
            )
            for(var i=0;i<tagrows.length;i++) {
                await conn.query(
                    'INSERT INTO posttag(postid,tagid) VALUES (?,?) ON DUPLICATE KEY UPDATE postid=postid',
                    [postResult.insertId,tagrows[i].tagid]
                )
            }
        }
        for(var i=0;i<imagearr.length;i++) {
            await conn.query(
                'INSERT INTO imagefile(postid,filename) value (?,?)',
                    [postResult.insertId,imagearr[i]]
                )
        }
        if(audioUrl) {
             await conn.query(
            'INSERT INTO audiofile(postid,filename) VALUES(?,?)',
            [postResult.insertId,audioUrl]
        )

        }
        if(voteoptions) {
            let voteoptionsArr = []
            try {
                voteoptionsArr = JSON.parse(voteoptions)
            } catch(e) {
                throw new Error('Invalid voteoptions JSON')
            }
            for(let i = 0; i < voteoptionsArr.length; i++) {
                await conn.query(
                    'INSERT INTO voteoption (postid,optiontext) value (?,?)',
                    [postResult.insertId, voteoptionsArr[i].voteoption]
                )
            }
        }
        
          return {
            resultCode:200,
            isTokenValid:true
        }
        })
    

}
module.exports = {uploadPost}