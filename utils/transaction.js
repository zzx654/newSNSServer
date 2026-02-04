const { getConnection } = require('../config/db')
const releaseConnection = async (conn) => {
  try {
      await conn.release();
  } catch (error) {
      console.error(`release error : ${error.message}`);
  }
};
const transaction = async (logic) => {
  let conn = null;
  try {
      conn = await getConnection();
      await conn.beginTransaction();

    //connection만 넣어준다.
      const result = await logic(conn);

      await conn.commit();
      console.log('trasaction result')
      console.log(result)

      return result;
  } catch (err) {
      if (conn) {
          //conn.rollback();
          await conn.rollback()
      }

      console.error(err);
      //return null
      throw err;
  } finally {
      if (conn) {
          releaseConnection(conn);
      }
  }
}

module.exports = { transaction }