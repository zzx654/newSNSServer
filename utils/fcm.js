const admin = require('../config/firebase');

async function sendFCM(message) {
  try {
    const response = await admin.messaging().send(message);
    console.log("Successfully sent message:", response);
    return response;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error; // 필요하면 밖으로 에러 던짐
  }
}

module.exports = { sendFCM };