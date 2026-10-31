const { pool } = require('../../config/db')
const { createNotification, canCreateNotification, createRequestChatNotification } = require('../notification/notification.service')
const { transaction } = require("../../utils/transaction")

const createChatRequest = async(requesterId,targetId,postId,commentId = null) => {

    //게시물에서 채팅요청하면 무조건 익명으로(그대신 출처보임) 사람검색에서 채팅요청하면 공개

    return transaction(async (conn) => {
        if(requesterId === targetId) {
            return {
                isTokenValid:true,
                resultCode:200,
                data: {
                    success:false
                }
            }
        }
       let duplicateCheckQuery = `
            SELECT id, status FROM chat_requests 
            WHERE requesterid = ? AND targetid = ? AND status IN ('PENDING', 'ACCEPTED')
        `;
        let queryParams = [requesterId, targetId];

        if (postId !== null) {
            duplicateCheckQuery += ` AND postid = ?`;
            queryParams.push(postId);
            
            if (commentId !== null) {
                duplicateCheckQuery += ` AND commentid = ?`;
                queryParams.push(commentId);
            } else {
                duplicateCheckQuery += ` AND commentid IS NULL`;
            }
        } else {
            // 유저 검색 요청인 경우 postid가 반드시 NULL이어야 함
            duplicateCheckQuery += ` AND postid IS NULL`;
        }
        const [existing] = await conn.query(duplicateCheckQuery, queryParams);

        if(existing.length > 0) {
             return {
                isTokenValid:true,
                resultCode:200,
                data: {
                    success:false
                }
            }
        }
        const insertQuery = `
            INSERT INTO chat_requests (requesterid, targetid, postid, commentid, status) 
            VALUES (?, ?, ?, ?, 'PENDING')
        `;
        const [insertResult] = await conn.query(insertQuery, [requesterId, targetId, postId, commentId]);

        createRequestChatNotification(insertResult.insertId,requesterId,targetId,postId,commentId)

         return {
             isTokenValid:true,
             resultCode:200,
             data: { success:true }
         }
       
    })
    
}
module.exports = { createChatRequest }