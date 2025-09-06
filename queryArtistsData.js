// queryArtistsData.js
const pool = require('./db');

const queryArtistsData = async () => {
  try {
    const query = 'SELECT * FROM artists;';
    const res = await pool.query(query);
    console.log('Artist data retrieved:', res.rows);
  } catch (err) {
    console.error('Error querying artist data:', err);
  } finally {
    pool.end();
  }
};

queryArtistsData();
