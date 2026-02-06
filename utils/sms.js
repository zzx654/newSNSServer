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
    text: SMS_TEMPLATES.AUTH_CODE(code)
  })
}

module.exports = { sendAuthCode }