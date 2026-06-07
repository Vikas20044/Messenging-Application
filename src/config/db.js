const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

// Initialize the Connection Pool directly using the Neon connection string
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Neon forces SSL encryption over public endpoints; this parameter secures the link
    ssl: {
        rejectUnauthorized: false
    }
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

        // Relational Messages Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                sender_id INT REFERENCES users(id) ON DELETE CASCADE,
                receiver_id INT REFERENCES users(id) ON DELETE CASCADE,
                text TEXT NOT NULL,
                timestamp TIMESTAMPTZ DEFAULT NOW(),
                isread BOOLEAN DEFAULT FALSE
            );
        `);
        console.log('Successfully connected to Neon Cloud Database & Tables Verified!');
    } catch (err) {
        console.error('Neon Database initialization failed:', err);
        process.exit(1); 
    }
};

module.exports = { pool, initDB };