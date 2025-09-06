// db.js
require('dotenv').config();
const { Pool } = require('pg');

// Database connection configuration
const pool = new Pool({
  user: process.env.DATABASE_USER,
  host: process.env.DATABASE_HOST,
  database: process.env.DATABASE_NAME,
  password: process.env.DATABASE_PASSWORD,
  port: process.env.DATABASE_PORT,
  ssl: {
    rejectUnauthorized: false // Supabase requires SSL, but disabling certificate validation
  }
});

module.exports = pool;

 