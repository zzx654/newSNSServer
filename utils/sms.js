const coolsms = require('coolsms-node-sdk').default
const { SMS_TEMPLATES } = require('../constants/sms')

const messageService = new coolsms(
  process.env.COOLSMSAPI,
  process.env.COOLSMSAPISECRET
)

const sendAuthCode = async (to, code) => {
  return messageService.sendOne({
    to,
    from: process.env.SMS_FROM,
    text: `[고민앱] 인증번호 [${code}]를 입력해주세요.`
  })
}

module.exports = { sendAuthCode }