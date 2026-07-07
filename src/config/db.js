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

module.exports = { pool };