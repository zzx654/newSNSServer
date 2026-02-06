const memoryCache = require('memory-cache')

const set = (key, value, ttlSeconds) => {
  memoryCache.put(key, value, ttlSeconds * 1000)
}

const get = (key) => {
  return memoryCache.get(key)
}

const del = (key) => {
  memoryCache.del(key)
}

module.exports = {
  set,
  get,
  del
}