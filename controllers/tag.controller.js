const tagService = require('../services/tag.service')
const asyncHandler = require('../utils/asynchandler')

const searchTag = asyncHandler (async(req, res) => {
  
    const { tag } = req.body
    const { userId } = req.user
    const result = await tagService.searchTag(userId,tag)
    res.json(result)
 
})

module.exports = { searchTag}