const { Pool } = require('pg');
const dotenv = require('dotenv');

// Ensuring env variables are loaded if this file is initialized early
dotenv.config();

const pool = new Pool({
    // Fallback parsing: if DATABASE_URL fails to extract the password cleanly, 
    // we explicitly supply the configuration parameters.
    connectionString: process.env.DATABASE_URL,
    user: 'postgres',
    host: 'localhost',
    database: 'realtime_chat',
    password: String('vikas'), // Strictly forces your password to be a string
    port: 5432,
});

const initDB = async () => {
    try {
        // Users Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL
            );
        `);

        // Messages Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) NOT NULL,
                text TEXT NOT NULL,
                timestamp TIMESTAMPTZ DEFAULT NOW(),
                isRead BOOLEAN DEFAULT FALSE
            );
        `);
        console.log('Connected smoothly to PostgreSQL & Tables verified.');
    } catch (err) {
        console.error('Database initialization failed:', err);
        process.exit(1); 
    }
};

module.exports = { pool, initDB };