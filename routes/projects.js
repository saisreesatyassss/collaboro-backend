const express = require('express');
const pool = require('../db');
const authMiddleware = require('../authMiddleware');

const router = express.Router();




router.get('/allprojects', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM projects');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


router.get('/allusers'  , async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, firstName, lastName, email FROM users'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Server error' });
  }
});



// Create Project
router.post('/', authMiddleware, async (req, res) => {
  const { name, tags, priority, description, upload, members } = req.body;
  const userId = req.user.id; // from JWT

  if (!name) return res.status(400).json({ error: 'Project name required' });

  try {
    const newProject = await pool.query(
      `INSERT INTO projects (name, tags, managerId, priority, description, upload, members)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, tags || [], userId, priority || 'medium', description || '', upload || null, members || [userId]]
    );

    res.json(newProject.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


// Edit Project
router.put('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { name, tags, priority, description, upload } = req.body;

  try {
    const updated = await pool.query(
      `UPDATE projects 
       SET name = $1, tags = $2, priority = $3, description = $4, upload = $5
       WHERE id = $6
       RETURNING *`,
      [name, tags || [], priority, description, upload, id]
    );

    if (updated.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(updated.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add User to Project
router.post('/:id/add-user', authMiddleware, async (req, res) => {
  const { id } = req.params; // project id
  const { userId } = req.body; // user to add

  try {
    const projectRes = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
    if (projectRes.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    let members = projectRes.rows[0].members || [];
    if (!members.includes(userId)) {
      members.push(userId);
    }

    const updated = await pool.query(
      `UPDATE projects SET members = $1 WHERE id = $2 RETURNING *`,
      [members, id]
    );

    res.json(updated.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get All Projects for User
 
// Apply middleware to protect route
// router.get('/', authenticate, async (req, res) => {
//   const userId = req.user.id; // now this will exist
//   try {
//     const projects = await pool.query(
//       'SELECT * FROM projects WHERE $1 = ANY(members)',
//       [userId]
//     );
//     res.json(projects.rows);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Server error' });
//   }
// });
// Get All Projects

module.exports = router;
