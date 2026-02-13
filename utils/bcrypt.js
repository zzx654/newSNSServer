const bcrypt = require('bcrypt')

const SALT_ROUNDS = 10

const hash = (data) => {
  return bcrypt.hash(data, SALT_ROUNDS)
}

const compare = (data, encrypted) => {
  return bcrypt.compare(data, encrypted)
}

module.exports = {
  hash,
  compare,
}




