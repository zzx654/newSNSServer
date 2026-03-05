const { generateSnapshot } = require('../services/snapshot/snapshot.service')

console.log('Snapshot runner started')

generateSnapshot()

setInterval(() => {

  generateSnapshot()

}, 60 * 1000)