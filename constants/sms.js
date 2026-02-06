const SMS_TEMPLATES = {
  AUTH_CODE: (code) =>
    `[고민앱] 인증번호 [${code}]를 입력해주세요.`,
}

module.exports = { SMS_TEMPLATES }