const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    user: 'postgres',
    host: 'localhost',
    database: 'realtime_chat',
    password: String('vikas'),
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
        console.log('PostgreSQL Relational Schema Verified Successfully.');
    } catch (err) {
        console.error('Database migration/initialization failed:', err);
        process.exit(1); 
    }
};

module.exports = { pool, initDB };