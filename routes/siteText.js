const express = require('express');
const router = express.Router();
const pool = require('../db'); // adjust path to your DB connection file

// GET site text
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT content FROM site_text LIMIT 1');
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No site text found' });
    }
    res.json(result.rows[0].content);
  } catch (err) {
    console.error('Error fetching site text:', err);
    res.status(500).json({ error: err.message });
  }
});


// UPSERT site text (insert if none, update if exists)
router.put('/', async (req, res) => {
  const { content } = req.body;

  if (!content || typeof content !== 'object') {
    return res.status(400).json({ error: 'Content must be a valid JSON object' });
  }

  try {
    const result = await pool.query(
      `UPDATE site_text SET content = $1, updated_at = CURRENT_TIMESTAMP RETURNING *`,
      [content]
    );

    if (result.rowCount === 0) {
      await pool.query(`INSERT INTO site_text (content) VALUES ($1)`, [content]);
    }

    res.json({ message: 'Content saved successfully', content });
  } catch (err) {
    console.error('Error saving site text:', err);
    res.status(500).json({ error: err.message });
  }
});



module.exports = router;
