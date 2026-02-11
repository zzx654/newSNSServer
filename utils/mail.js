const nodemailer = require("nodemailer")

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

const sendEmail = async (toEmail, title, text) => {
  return transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: toEmail,
    subject: title,
    text,
  })
}

module.exports = { sendEmail }

