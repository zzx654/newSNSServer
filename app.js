const express=require('express')
const http = require('http')
const jwt=require('jsonwebtoken');
const app=express()
const server = http.createServer(app)
const cache = require('memory-cache')
const coolsms = require('coolsms-node-sdk').default;
const randomstring = require('randomstring');
require('dotenv').config()
const messageService = new coolsms(process.env.COOLSMSAPI, process.env.COOLSMSAPISECRET)
const mysql=require('mysql2/promise')
const bcrypt = require('bcrypt');
var bodyParser = require('body-parser');
const { errorMonitor } = require('events');
const multer = require('multer')
app.use(express.static('files'))

const fromEmail = 'mhyhl220@gmail.com'
const nodemailer = require("nodemailer");
const { PricingV1VoiceVoiceCountryInstanceInboundCallPrices } = require('twilio/lib/rest/pricing/v1/voice/country');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.NODEMAILER_USER,
    pass: process.env.NODEMAILER_PW,
  },
  tls:{
    rejectUnauthorized: false
}
})

module.exports = transporter
function sendEmail(toEmail, title, txt) { 
  let mailOptions = {
    from: fromEmail,        //보내는 사람 주소
    to: toEmail ,           //받는 사람 주소
    subject: title,         //제목
    text: txt               //본문
};

//전송 시작!
transporter.sendMail(mailOptions, function(error, info){
    
    if (error) {
        //에러
        console.log(error);
    }
    //전송 완료
    console.log("Finish sending email : " + info.response);        
    transporter.close()
})
}     
      
const fileUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, `${__dirname}/files`) // images 폴더에 저장
    },
		filename: (req, file, cb) => {
			
			var mimetype;
            console.log(file)
			switch (file.mimetype) {
				case 'image/jpeg':
					mimeType = 'jpg';
					break;
				case 'image/png':
					mimeType = 'png';
					break;
				case 'image/gif':
					mimeType = 'gif';
					break;
				case 'image/bmp':
					mimeType = 'bmp';
					break;
                case 'audio/wav':
                    mimeType = 'wav';
                    break;
                case 'audio/mp3':
                    mimeType = 'mp3';
                case 'audio/mpeg':
                    mimeType = 'mpeg';
                    break;
				default:
					mimeType = 'jpg';
					break;
			}
    
            var fileName = randomstring.generate(25); // 랜덤 25자의 파일 이름
			cb(null, fileName + '.' + mimeType);
		},
  }),
  limits: {
    fileSize: 10 * 1024 * 1024,  // 5MB 로 크기 제한
  },
})
const pool = mysql.createPool({
  host: 'localhost',
  user: "root",
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
  connectionLimit: 5,
  port: "3306",
  charset:"utf8mb4",
  dateStrings:'date'
})
const getConnection = async () => {
  try {
      const conn = await pool.getConnection();
      return conn;
  } catch (error) {
      console.error(`connection error : ${error.message}`);
      return null;
  }
}
const releaseConnection = async (conn) => {
  try {
      await conn.release();
  } catch (error) {
      console.error(`release error : ${error.message}`);
  }
};
const transaction = async (logic) => {
  let conn = null;
  try {
      conn = await getConnection();
      await conn.beginTransaction();

    //connection만 넣어준다.
      const result = await logic(conn);

      await conn.commit();
      return result;
  } catch (err) {
      if (conn) {
          conn.rollback();
      }

      console.error(err);
      return null;
  } finally {
      if (conn) {
          releaseConnection(conn);
      }
  }
}
const FIND_USER_BY_NICKNAME = 'SELECT platform FROM user WHERE nickname = ?'

const find_user_by_nickname = async (conn, nickname) => {
    try {
          const [rows] = await conn.execute(FIND_USER_BY_NICKNAME, [nickname]);
          return rows;
        } catch (err) {
          throw err;
        }
}

const getplatform = (nickname) => {
  return async (conn) => {
    try {
      const find_platform = await find_user_by_nickname(conn,nickname)

      return find_platform[0].platform
    } catch(err) {
      throw err
    }
  }
}
async function run() {
  const res1 = await transaction(getplatform(""))  
  console.log(res1)
}
async function sqlquery(query,param,success,error) {
  const conn = await getConnection()
  try {
    let [rows,fields] = await conn.query(query,param)
    success(rows)
  
  
  } catch(err){
    console.log(err)
    error()
  }
  
  conn.release()
}

app.use(bodyParser.urlencoded({ extended: false }))


function accessToken(req,res,next){
  //Get auth header value
  
  const bearerHeader=req.headers['authorization'];
  //Check if bearer is undefined
  if(typeof bearerHeader!=='undefined'){
      //split at the space
      const bearer=bearerHeader.split(' ');
      //Get token from array
      const bearerToken=bearer[1];
      //Set the token
      req.token=bearerToken;
      //Nextmiddleware
      next();
  }else{
      //Forbidden
      res.sendStatus(403);
  }
}
function verifyToken(token,error,success) {
  jwt.verify(token,'secretkey',(err,authData) => {
    if(err) {
      error()

    } else {
      success(authData.user.platform,authData.user.account)
    }
  })
}

 


function getCode() {
    let number = Math.floor(Math.random() * 1000000)+100000; // ★★난수 발생 ★★★★★
    if(number>1000000){                                      // ★★
       number = number - 100000;                             // ★★
    }
    return String(number)
}
app.use(express.urlencoded({extended: true}));
app.use(express.json())

const find_userid = async(conn,platform,account) => {
  try {
    const[rows] = await conn.execute('select *from user where platform=? and account=?',[platform,account])
    return rows

  }catch(err){
    throw err;
  }
}
const insert_tag = async(conn,tags) => {
  try {


    for(var i=0; i<tags.length;i++)
    {
     
        await conn.execute('insert into tag (tagname) select ? from dual where not exists (select * from tag where tagname=?)',[tags[i],tags[i]])
      }
  
      const[rows] = await conn.query('select tagid from tag where tagname in (?)',[tags])
      console.log(rows)
      return rows
      //await conn.execute('insert ignore into tag (tagname) values (?)',[tagarr])

    //const[rows] = await conn.execute('insert ignore into tag (tagname) values ?',[tagarr])
    //return rows
  }catch(err) {
    console.log(err)
    throw err;
  }
}
const insert_post = async(conn,anonymousNick,userid,text,lat,long) => {
  try {
    const[rows] = await conn.execute('insert into post(userid,anonymous,text,latitude,longitude) value(?,?,?,?,?)',[userid,anonymousNick,text,lat,long])
      return rows
  }catch(err) {
    console.log(err)
  throw err;
  }
}
const insert_posttag = async(conn,postid,tagids) =>{
  try {

    for(var i=0;i<tagids.length;i++) {
      await conn.execute('insert into posttag(postid,tagid) value (?,?)',[postid,tagids[i]])
    }
  
  }catch(err) {
    console.log(err)
    throw err;
  }
}
const insert_image = async(conn,postid,images) =>{
  try {
    for(var i=0;i<images.length;i++) {
      await conn.execute('insert into imagefile(postid,filename) value (?,?)',[postid,images[i]])
    }
  }catch(err) {
    console.log(err)
    throw err;
  }
}
const uploadPost = (anonymousNick,platform,account,tags,text,images,lat,long) => {
  return async(conn) => {
    try {
  
      const user = await find_userid(conn,platform,account)
      const userid = user[0].userid
      const insertpostresult = await insert_post(conn,anonymousNick,userid,text,lat,long)
    
      if(tags.length!=0) {
        const tagresult = await insert_tag(conn,tags)
   
        var tagids=new Array()
        for(var i=0;i<tagresult.length;i++)
          {
        
            tagids[i] = tagresult[i].tagid
          }
  
          insert_posttag(conn,insertpostresult.insertId,tagids)
    
      }
      if(images.length!=0) {
        
        insert_image(conn,insertpostresult.insertId,images)

      }
      

    } catch(err) {
      throw err
    }
  }

}
async function runUploadPost(anonymousNick,platform,account,tags,text,images,lat,long) {
  const result = await transaction(uploadPost(anonymousNick,platform,account,tags,text,images,lat,long))
  console.log(result)

}
app.post('/uploadPost',fileUpload.array('image'),accessToken,(req,res) => {
  
  //태그,텍스트,이미지,위치
  //1.태그 배열 삽입후 tagid가져와야 -> 태그 중복무시하고 삽입, 태그 select해서 tagid 가져와놓기
  //2.post에 글 삽입후에 pk가져오기
  //3.2에서 가져온 pk를 가지고 post tag 테이블에 해시태그들 추가
  var text=req.body.text
  var lat = req.body.latitude||null
  var long = req.body.longitude||null
  var anonymousNick = 'NONE'
  if(req.body.anonymousNick!==undefined){
    anonymousNick = req.body.anonymousNick
  }
  var tags=new Array()
  var images=new Array()
  if(req.body.tags!==undefined)
    tags= req.body.tags.split('#')
  for(var i=0;i<res.req.files.length;i++)
    {
      images[i]=req.files[i].filename
      console.log(req.files[i].filename)
    }
    console.log(images)
    console.log(tags)


  verifyToken(req.token,function(){
    //인증실패 다시 로그인 화면으로 돌아감
    res.json({
      isTokenValid:false,
      resultCode:400
    })
  },
  function(platform,account) {
    console.log('gg')

    runUploadPost(anonymousNick,platform,account,tags,text,images,lat,long)

  

  })
})
 app.post('/createProfile',fileUpload.single('image'),accessToken, (req, res) => {
  console.log(req.body.nickname)
  console.log(req.body.birth)
  var nickname = req.body.nickname
  var birth = req.body.birth
  var gender = req.body.gender

  verifyToken(req.token,function(){
    //인증실패 다시 로그인 화면으로 돌아감
    res.json({
      isTokenValid:false,
      resultCode:400
    })
  },
  function(platform,account) {
    var updateProfile = ''
    var param =[]
    if(req.file === undefined) {
      param = [nickname,gender,birth,platform,account]
      updateProfile = 'update user set nickname=?,gender=?,birthyear=? where platform=? and account=?'
    } else {
       param = [nickname,gender,birth,'/image?filename='+req.file.filename,platform,account]
      updateProfile = 'update user set nickname=?,gender=?,birthyear=?,profileimage=? where platform=? and account=?'
    }

  
    console.log(param)
    sqlquery(updateProfile,param,function(rows){
      res.json({
        isTokenValid:true,
        resultCode:200
      })
    },
    function() {
      res.json({
        isTokenValid:true,
        resultCode:400
      })
    })
  }
 )
})
app.get('/image',function(req,res){
  var imgName = req.param('filename')
  res.sendFile(__dirname+'/files/'+imgName)
})
app.get('/',function(req,res){
    res.send('Hellow World!')
})
app.post('/requestPhoneAuthCode',(req,res)=>{

    var checkaccount='select *from user where phonenumber=?'
    console.log(req.body)
    var phonenumber = req.body.phoneNumber
    var param = [phonenumber]
    sqlquery(checkaccount,param,function(result) {
      
      if(result&&result.length) {
      
        res.json({
          isValid: true,
          resultCode:200
        })
      } else {
        var num = getCode()
    
        console.log(num)
        cache.del(phonenumber)
        cache.put(phonenumber,num)
        //문자 전송
        messageService.sendOne(
          {
            to: '01057135288', 
            from: '01057135288', 
            text: "[고민앱] 인증번호 ["+num+"]를 입력해주세요."
          }
        ).then(res => console.log(res))
        .catch(err => console.error(err))
        res.json({
          isValid: false,
          resultCode:200
        })
      }

    },
    function() {
      res.json({
        isValid: false,
        resultCode:500
      })
    })
})
app.post('/requestEmailAuthCode',(req,res)=>{
    var checkaccount='select *from user where account=?'
    var email = req.body.email
    var param = [email]
    sqlquery(checkaccount,param,function(result) {
      if(result&&result.length) {
        res.json({
          exist: true,
          resultCode:200
        })
      } else {
        var num = getCode()
        console.log(num)
        cache.del()
        cache.put(email,num)
        //이메일 전송

        sendEmail(email,'[고민앱] 메일 인증 코드 발송','인증번호는 '+num+' 입니다' )
        res.json({
          exist: false,
          resultCode:200
        })
      }
    },
    function() {
      res.json({
        exist: false,
        resultCode:500
      })
    })

})
app.post('/signInWithToken',accessToken,(req,res)=> {
  verifyToken(req.token,function(){
    //인증실패
    res.json({
      signInResult:false,
      profileWritten:false,
      resultCode:200
    })
  },
  function(platform,account){ //인증성공
    console.log(platform)
    console.log(account)
    var checkaccount='select *from user where account=? and platform=?'
    param=[account,platform]
    sqlquery(checkaccount,param,function(result) {
      if(result&&result.length) {
        if(result[0].nickname===null) {//닉네임 없을때
          res.json({
            signInResult:true,
            profileWritten:false,
            resultCode:200
          })
        } else { // 닉네임 있을때
          res.json({
            signInResult:true,
            profileWritten:true,
            resultCode:200
          })
        }
      } else { 
        res.json({
          signInResult:false,
          profileWritten:false,
          resultCode:200
        })
      }
    }, function() {
      res.json({
        signInResult:false,
        profileWritten:false,
        resultCode:500
      })
    })
  })
})
app.post('/emailSignIn',(req,res)=>{
  
  var account=req.body.account
  console.log(account)
    var password=req.body.password
    const user={
      account:account,
      platform:'email'
  }
  var param=[account,'email']
  var checkaccount='select *from user where account=? and platform=?'
  sqlquery(checkaccount,param,function(result) {
    if(result&&result.length){ //가입된상태
      bcrypt.compare(password,result[0].password,function(err,pwresult){
        if(err) {
          console.log('2')
          res.json({
            isMember:false,
            profileWritten:false,
            token:'b',
            resultCode:500
          })
        } else {
          if(pwresult) { //비밀번호 맞음(로그인성공)
            jwt.sign({user:user},'secretkey',{expiresIn:'20d'},(err,authtoken)=>{ //jwt 발급
              if(err) {
        
                res.json({
                  isMember:true,
                  profileWritten:false,
                  token:'c',
                  resultCode:500
                })
    
              }else {
                if(result[0].nickname === null) {
                  //프로필작성 안된상태
                  res.json({
                    isMember:true,
                    profileWritten:false,
                    token:authtoken,
                    resultCode:200
                  })
    
                }else {
                  //프로필작성 완료상태
                  res.json({
                    isMember:true,
                    profileWritten:true,
                    token:authtoken,
                    resultCode:200
                  })
    
                }
    
              }
            })

          } else { //비밀번호 틀린상태
            res.json({
              isMember:false,
              profileWritten:false,
              token:'',
              resultCode:200
            })
          }

        }
      })
    } else { //계정 존재하지않음
      res.json({
        isMember:false,
        profileWritten:false,
        token:'',
        resultCode:200
      })
    }
  },function(){
    console.log(err)
    res.json({
      isMember:false,
      profileWritten:false,
      token:'a',
      resultCode:500
    })
  })
})
app.post('/socialSign',(req,res) => {

  console.log('social')
  var platform=req.body.platform
  var account=req.body.account
  var checkaccount='select *from user where platform=? and account=?'
  var param=[platform,account]
  const user={
    account:account,
    platform:platform
  }
  sqlquery(checkaccount,param,function(result){
    if(result&&result.length){ //가입된상태
      jwt.sign({user:user},'secretkey',{expiresIn:'20d'},(err,authtoken)=>{ //jwt 발급
        if(err) {
          res.json({
            isMember:true,
            profileWritten:false,
            token:'',
            resultCode:500
          })

        }else {
          if(result[0].nickname === null) {
            //프로필작성 안된상태
            res.json({
              isMember:true,
              profileWritten:false,
              token:authtoken,
              resultCode:200
            })

          }else {
            //프로필작성 완료상태
            res.json({
              isMember:true,
              profileWritten:true,
              token:authtoken,
              resultCode:200
            })

          }

        }
      })

    } else { //가입안된상태
      res.json({
        isMember:false,
        profileWritten:false,
        token:'',
        resultCode:200
      })
    }

  },function(){
     res.json({
        isMember:false,
        profileWritten:false,
        token:'',
        resultCode:500
      })
  })
})
app.post('/socialSignUp',(req,res)=> {
  var platform=req.body.platform
  var account=req.body.account
  var phonenumber=req.body.phonenumber
  
  const user={
    account:account,
    platform:platform,
    phonenumber:phonenumber
  }
  var param=[platform,account,phonenumber]
  var insertaccount='INSERT IGNORE INTO user(platform,account,phonenumber) VALUES (?,?,?)'

  sqlquery(insertaccount,param,function(result){
    jwt.sign({user:user},'secretkey',{expiresIn:'20d'},(err,authtoken)=>{
      if(err) {
        res.json({
          resultCode:500,
          token:''
        })
      } else {
        res.json({
          resultCode:200,
          token:authtoken
        })
      }
    })
  },function(){
    res.json({
      resultCode:500,
      token:''
    })
  })
})
app.post('/emailSignUp',(req,res)=> {
  var password=req.body.password
  var encrypted=bcrypt.hashSync(password,10)
  var param = ['email',req.body.account,encrypted,req.body.phonenumber]
  var insertaccount='INSERT IGNORE INTO user(platform,account,password,phonenumber) VALUES (?,?,?,?)'
  if(req.body.authCode == cache.get(req.body.account)) {
    cache.del(req.body.email)
    sqlquery(insertaccount,param,function(result){
      res.json({
        resultCode:200,
        isCorrect: true
      })
    },function(){
      console.log(err)
      res.json({
        resultCode:500,
        isCorrect: false
      })
    })

  } else {
    res.json({
      resultCode:200,
      isCorrect: false
    })
  }
})
app.post('/authenticateCode',(req,res)=>{
    console.log(req.body)
    if(req.body.authCode==cache.get(req.body.phoneNumber))
    {
        cache.del(req.body.phone)
        res.json({
            resultCode:200,
            isCorrect:true
        })
    }
    else
    {
        res.json({
            resultCode:200,
            isCorrect:false
        })
    }
})
app.post('/searchTag',(req,res)=>{
  var tag = req.body.tag
  console.log(tag)
  tag="%"+tag+"%"
  var param = [tag]
  var searchTag='select tagname,count from (select *from tag where tagname like ?) as tag left join (select tagid, count(tagid) as count from posttag group by tagid) as tagcount on tag.tagid = tagcount.tagid'
  sqlquery(searchTag,param,function(result){
    res.json({
      resultCode:200,
      tags:result
  })
  },function(){
    res.json({
      resultCode:500,
      tags:[]
  })
  })
})
app.post('/checkNickname',(req,res)=>{
  var nickname=req.body.nickname
  var checknick='select *from user where nickname=?'
  console.log(nickname)
  sqlquery( checknick,param,function(result) {
    if(result.length==0)
      {
          res.json({
              resultCode:200,
              isValid:true
          })
      }
      else{
          res.json({
              resultCode:200,
              isValid:false
          })
      }
  },function() {
    res.json({
      resultCode:500,
      isValid:false
  })
  })
})
var port = process.env.PORT || 3000
app.get('/',(req,res)=>{
  res.send('hello')
})
server.listen(port, () => {
    console.log(`Server listening at http://localhost:80`)
  })