const dayjs = require('dayjs')
const { transaction } = require('../../utils/transaction')

const { generatePostScores } = require('./postscore.service')
const { generateCommentScores } = require('./commentscore.service')

const generateSnapshot = async () => {

  const snapshotTime = dayjs()
    .startOf('minute')
    .format('YYYY-MM-DD HH:mm:ss')

  await transaction(async (conn) => {

    await generateCommentScores(conn, snapshotTime)
    await generatePostScores(conn, snapshotTime)

  })

}

module.exports = { generateSnapshot }