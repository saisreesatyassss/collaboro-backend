const pool = require('./db');

const createTable = async () => {
  try {

const createArtistsTableQuery = `
  CREATE TABLE IF NOT EXISTS artists (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- type of artist, e.g., 'tattoo artist', 'musician artist'
    description TEXT,
    profilePicture VARCHAR(255),
    walletAddress VARCHAR(42),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    mashed_urls TEXT[],
    instagram VARCHAR(255),
    twitter VARCHAR(255),
    facebook VARCHAR(255),
    website VARCHAR(255),
    banner_picture VARCHAR(255)
  );
`;



    const createSoloWorksTableQuery = `
      CREATE TABLE IF NOT EXISTS solo_works (
        id SERIAL PRIMARY KEY,
        artist_id BIGINT REFERENCES artists(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL, -- type of solo work, e.g., 'tattoo', 'music'
        title VARCHAR(100) NOT NULL,
        file_name VARCHAR(100) NOT NULL,
        song_url TEXT, -- only used for musician artists
        price VARCHAR(50) NOT NULL,
        scarcity VARCHAR(50) NOT NULL,
        utility TEXT NOT NULL,
        tags TEXT[] NOT NULL,
        geo VARCHAR(100) NOT NULL,
        image_url TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await pool.query(createArtistsTableQuery);
    console.log('Table "artists" created successfully.');

    await pool.query(createSoloWorksTableQuery);
    console.log('Table "solo_works" created successfully.');

  } catch (err) {
    console.error('Error creating tables:', err);
  } finally {
    pool.end();
  }
};

createTable();
