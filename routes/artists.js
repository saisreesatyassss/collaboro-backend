
const express = require('express');
const router = express.Router();
const pool = require('../db'); // Adjust path to your DB connection file

// Middleware to check if required fields are present for new artists
const validateArtistData = (req, res, next) => {
  const { name, username, email } = req.body;
  if (!name || !username || !email) {
    return res.status(400).json({ error: 'Name, username, and email are required fields.' });
  }
  next();
};

// CREATE a new artist
router.post('/', validateArtistData, async (req, res) => {
  const {
    name, username, bio, walletid, walletaddress,
    instagram, facebook, twitter, website, imageurl,
    email, banner_url, banner_picture, profilepicture,
    type, description, artisttype, mashed_urls
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO artists (
        name, username, bio, walletid, walletaddress, instagram, facebook, twitter,
        website, imageurl, email, banner_url, banner_picture, profilepicture,
        type, description, artisttype, mashed_urls
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18
      ) RETURNING *`,
      [
        name, username, bio, walletid, walletaddress, instagram, facebook, twitter,
        website, imageurl, email, banner_url, banner_picture, profilepicture,
        type, description, artisttype, mashed_urls
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error inserting artist:', err);
    // Handle specific database errors, e.g., unique constraint violation
    if (err.code === '23505') { 
      return res.status(409).json({ error: 'Username or email already exists.' });
    }
    res.status(500).json({ error: 'An unexpected error occurred.' });
  }
});

// GET all artists
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM artists');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching artists:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET a single artist by username (or ID)
router.get('/:username', async (req, res) => {
  const { username } = req.params;
  try {
    const result = await pool.query('SELECT * FROM artists WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Artist not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching artist:', err);
    res.status(500).json({ error: err.message });
  }
});

// UPDATE an artist by username
router.put('/:username', async (req, res) => {
  const { username } = req.params;
  const {
    name, bio, walletid, walletaddress, instagram, facebook, twitter, website,
    imageurl, email, banner_url, banner_picture, profilepicture,
    type, description, artisttype, mashed_urls
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE artists SET
        name = COALESCE($1, name),
        bio = COALESCE($2, bio),
        walletid = COALESCE($3, walletid),
        walletaddress = COALESCE($4, walletaddress),
        instagram = COALESCE($5, instagram),
        facebook = COALESCE($6, facebook),
        twitter = COALESCE($7, twitter),
        website = COALESCE($8, website),
        imageurl = COALESCE($9, imageurl),
        email = COALESCE($10, email),
        banner_url = COALESCE($11, banner_url),
        banner_picture = COALESCE($12, banner_picture),
        profilepicture = COALESCE($13, profilepicture),
        type = COALESCE($14, type),
        description = COALESCE($15, description),
        artisttype = COALESCE($16, artisttype),
        mashed_urls = COALESCE($17, mashed_urls),
        updated_at = CURRENT_TIMESTAMP
      WHERE username = $18
      RETURNING *`,
      [
        name, bio, walletid, walletaddress, instagram, facebook, twitter, website,
        imageurl, email, banner_url, banner_picture, profilepicture,
        type, description, artisttype, mashed_urls, username
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Artist not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating artist:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;