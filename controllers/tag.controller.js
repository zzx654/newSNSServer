const tagService = require('../services/tag/tag.service')
const asyncHandler = require('../utils/asynchandler')

const searchTag = asyncHandler (async(req, res) => {
  
    const { tag } = req.body
    const { userId } = req.user
    const result = await tagService.searchTag(userId,tag)
    res.json(result)
 
})

const getTags = asyncHandler (async(req,res) => {
    const { userId } = req.user

    const result = await tagService.getTags(userId)

    res.json(result)
})

const toggleFavoriteTag = asyncHandler (async(req,res) => {
    const { userId } = req.user
    const { tagid } = req.body
    
    const result = await tagService.toggleFavoriteTag(userId,tagid)

    res.json(result)
})

module.exports = { searchTag, getTags, toggleFavoriteTag }