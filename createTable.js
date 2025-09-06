const pool = require('./db');

const createTables = async () => {
  try {
    // Users table
    const createUsersTableQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        firstName VARCHAR(100) NOT NULL,
        lastName VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        passwordHash VARCHAR(255) NOT NULL,
        profilePicture VARCHAR(255),
        role VARCHAR(50) DEFAULT 'member',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Projects table
    const createProjectsTableQuery = `
      CREATE TABLE IF NOT EXISTS projects (
        id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        name VARCHAR(150) NOT NULL,
        tags TEXT[],
        managerId BIGINT REFERENCES users(id) ON DELETE SET NULL,
        priority VARCHAR(20) DEFAULT 'medium',
        description TEXT,
        upload VARCHAR(255),
        members BIGINT[], -- list of user IDs
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Tasks table
    const createTasksTableQuery = `
      CREATE TABLE IF NOT EXISTS tasks (
        id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        projectId BIGINT REFERENCES projects(id) ON DELETE CASCADE,
        name VARCHAR(150) NOT NULL,
        assigneeId BIGINT REFERENCES users(id) ON DELETE SET NULL,
        tags TEXT[],
        deadline TIMESTAMP,
        image VARCHAR(255),
        description TEXT,
        status VARCHAR(20) DEFAULT 'not_started',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await pool.query(createUsersTableQuery);
    console.log('Table "users" created successfully.');

    await pool.query(createProjectsTableQuery);
    console.log('Table "projects" created successfully.');

    await pool.query(createTasksTableQuery);
    console.log('Table "tasks" created successfully.');

  } catch (err) {
    console.error('Error creating tables:', err);
  } finally {
    pool.end();
  }
};

createTables();
