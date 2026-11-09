const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  // Connect to the default 'postgres' db to create the new one
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: 'postgres',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    console.log('Connecting to default postgres database...');
    // Create database if it doesn't exist
    const res = await pool.query("SELECT 1 FROM pg_database WHERE datname = 'feedback_db'");
    if (res.rowCount === 0) {
      console.log('Creating feedback_db...');
      await pool.query('CREATE DATABASE feedback_db');
    } else {
      console.log('feedback_db already exists.');
    }
  } catch (err) {
    console.error('Failed to create database:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }

  // Now connect to the new feedback_db to run the schema
  const targetPool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: 'feedback_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    console.log('Connecting to feedback_db to run schema...');
    const schemaSql = fs.readFileSync(path.join(__dirname, 'db', 'schema.sql'), 'utf8');
    await targetPool.query(schemaSql);
    console.log('Schema and seed data applied successfully!');
  } catch (err) {
    console.error('Failed to apply schema:', err.message);
  } finally {
    await targetPool.end();
  }
}

setupDatabase();
