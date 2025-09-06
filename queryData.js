// queryData.js
const pool = require('./db');

const queryData = async () => {
  try {
    const query = 'SELECT * FROM collections;';
    const res = await pool.query(query);
    console.log('Data retrieved:', res.rows);
  } catch (err) {
    console.error('Error querying data:', err);
  } finally {
    pool.end();
  }
};

queryData();
