const mysql=require('mysql2/promise')
const pool = mysql.createPool({
  host: 'localhost',
  user: "root",
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
  connectionLimit: 5,
  port: "3306",
  charset:"utf8mb4",
  dateStrings:'date'
})

const getConnection = async () => {
  try {
      const conn = await pool.getConnection();
      return conn;
  } catch (error) {
      console.error(`connection error : ${error.message}`);
      return null;
  }
}

module.exports = {
  pool,
  getConnection,
}