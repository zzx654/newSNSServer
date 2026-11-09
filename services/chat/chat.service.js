const { pool } = require('../../config/db')
const { createNotification, canCreateNotification, createRequestChatNotification } = require('../notification/notification.service')
const { transaction } = require("../../utils/transaction")

const createChatRequest = async(requesterId,targetId,postId,commentId = null) => {

    //게시물에서 채팅요청하면 무조건 익명으로(그대신 출처보임) 사람검색에서 채팅요청하면 공개

    return transaction(async (conn) => {
        if(requesterId === targetId) {
            return {
                isTokenValid:true,
                resultCode:500
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
                resultCode:200
            }
        }
        const insertQuery = `
            INSERT INTO chat_requests (requesterid, targetid, postid, commentid, status) 
            VALUES (?, ?, ?, ?, 'PENDING')
        `;
        const [insertResult] = await conn.query(insertQuery, [requesterId, targetId, postId, commentId]);

         const [rows] = await conn.query(
            `SELECT *
            FROM chat_requests
            WHERE id = ?`,
            [insertResult.insertId]
        );

        const chatRequest = rows[0];
        createRequestChatNotification(chatRequest.id,chatRequest.requesterid,chatRequest.targetid,postId,commentId,chatRequest.created_at)

         return {
             isTokenValid:true,
             resultCode:200
         }
       
    })
    
}

const getChatRequests = async (myUserId, requestId = null, requestDate = null) => {
    let query = `
        SELECT 
            cr.id AS chatrequestid,
            cr.requesterid,
            cr.targetid,
            cr.postid,
            cr.commentid,
            cr.status,
            cr.created_at AS createdat,
            
            -- 보낸 사람 정보 (유저 검색 요청일 때 사용)
            u.nickname AS requesternickname,
            u.profileimage AS requesterprofileimage,
            u.gender AS requestergender,
            
            -- 게시글 내용 (게시글 요청일 때 사용)
            p.text AS postcontent,
            
            -- 댓글 내용 (댓글 요청일 때 사용)
            c.text AS commentcontent

        FROM chat_requests cr
        JOIN user u ON cr.requesterid = u.userid
        LEFT JOIN post p ON cr.postid = p.postid
        LEFT JOIN comment c ON cr.commentid = c.commentid

        WHERE cr.targetid = ?
        AND cr.status = 'PENDING'
    `;

    const params = [myUserId];

    // 커서 페이징 조건 추가 (2페이지 이후부터 작동)
    if (requestId && requestDate) {
        query += ` AND (cr.created_at < ? OR (cr.created_at = ? AND cr.id < ?))`;
        params.push(requestDate, requestDate, requestId);
    }

    query += ` ORDER BY cr.created_at DESC, cr.id DESC LIMIT 20;`;

    // DB 조회 실행
    const [requests] = await pool.query(query, params);

    return {
        isTokenValid: true,
        resultCode: 200,
        data: {
            chatRequests: requests
        }
    };
};
module.exports = { createChatRequest, getChatRequests }