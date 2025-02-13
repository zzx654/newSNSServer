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
const mysql=require('mysql2')
const bcrypt = require('bcrypt');
var bodyParser = require('body-parser');
const { errorMonitor } = require('events');
const multer = require('multer')
app.use(express.static('files'))

const fromEmail = 'mhyhl220@gmail.com'
const nodemailer = require("nodemailer");

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

var db_config ={
    host: 'localhost',
    user: "root",
    database: process.env.DATABASE,
    password: process.env.PASSWORD,
    port: "3306",
    charset:"utf8mb4",
    dateStrings:'date'
}
var connection; 
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
function handleDisconnect() {
    connection = mysql.createConnection(db_config); // Recreate the connection, since
                                                    // the old one cannot be reused.
  
    connection.connect(function(err) {              // The server is either down
      if(err) {                                     // or restarting (takes a while sometimes).
        console.log('error when connecting to db:', err);
        setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
      }                                     // to avoid a hot loop, and to allow our node script to
    });                                     // process asynchronous requests in the meantime.
                                            // If you're also serving http, display a 503 error.
    connection.on('error', function(err) {
      console.log('db error', err);
      if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
        handleDisconnect();                         // lost due to either server restart, or a
      } else {                                      // connnection idle timeout (the wait_timeout
        throw err;                                  // server variable configures this)
      }
    });
  }
  handleDisconnect()
 
var port = process.env.PORT || 3000

function getCode() {
    let number = Math.floor(Math.random() * 1000000)+100000; // ★★난수 발생 ★★★★★
    if(number>1000000){                                      // ★★
       number = number - 100000;                             // ★★
    }
    return String(number)
}
app.use(express.urlencoded({extended: true}));
app.use(express.json())

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
    connection.query(updateProfile,param,function(err,result){
      if(err) {
        res.json({
          isTokenValid:true,
          resultCode:400
        })
      } else {
        res.json({
          isTokenValid:true,
          resultCode:200
        })
      }
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
    connection.query(checkaccount,param,function(err,result) {
      if(err) {
        res.json({
          isValid: false,
          resultCode:500
        })
      } else {
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
      }
    })
})
app.post('/requestEmailAuthCode',(req,res)=>{
    var checkaccount='select *from user where account=?'
    var email = req.body.email
    var param = [email]
    connection.query(checkaccount,param,function(err,result) {
      if(err) {
        res.json({
          exist: false,
          resultCode:500
        })
      } else {
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
      }
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
    connection.query(checkaccount,param,function(err,result) {
      if(err) {
        res.json({
          signInResult:false,
          profileWritten:false,
          resultCode:500
        })
      }else { 
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
      }
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
  connection.query(checkaccount,param,function(err,result){
    if(err) {
      console.log(err)
      res.json({
        isMember:false,
        profileWritten:false,
        token:'a',
        resultCode:500
      })
    }
    else {
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
                  console.log('3')
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
    }
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
  connection.query(checkaccount,param,function(err,result){
    if(err) {
      res.json({
        isMember:false,
        profileWritten:false,
        token:'',
        resultCode:500
      })
    }
    else {
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
    }
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

  connection.query(insertaccount,param,function(err,result) {
    if(err) {
      res.json({
        resultCode:500,
        token:''
      })
    } else {
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
    }
  })
})
app.post('/emailSignUp',(req,res)=> {
  var password=req.body.password
  var encrypted=bcrypt.hashSync(password,10)
  var param = ['email',req.body.account,encrypted,req.body.phonenumber]
  var insertaccount='INSERT IGNORE INTO user(platform,account,password,phonenumber) VALUES (?,?,?,?)'
  if(req.body.authCode == cache.get(req.body.account)) {
    cache.del(req.body.email)
    connection.query(insertaccount,param,function(err,result) {
      if(err) {
        console.log(err)
        res.json({
          resultCode:500,
          isCorrect: false
        })
      } else {
        res.json({
          resultCode:200,
          isCorrect: true
        })
      }
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
app.post('/checkNickname',(req,res)=>{
  var nickname=req.body.nickname
  var checknick='select *from user where nickname=?'
  console.log(nickname)
  connection.query(checknick,nickname,function(err,result){
      if(err)
      {
        res.json({
          resultCode:200,
          isValid:false
      })
      }
      else
      {
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
      }
  })
})
app.get('/',(req,res)=>{
  res.send('hello')
})
server.listen(port, () => {
    console.log(`Server listening at http://localhost:80`)
  })