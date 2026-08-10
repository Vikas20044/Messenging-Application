const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

// Determine SSL options safely based on connection string
const isLocalhost = process.env.DATABASE_URL && (process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1'));
const poolConfig = {
    connectionString: process.env.DATABASE_URL
};

if (!isLocalhost && process.env.DATABASE_URL) {
    poolConfig.ssl = {
        rejectUnauthorized: false
    };
}

const pool = new Pool(poolConfig);

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

        // Perform safe checks/alterations for user detail extensions
        await pool.query(`
            ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(100) DEFAULT '';
            ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '';
            ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_pic_url TEXT DEFAULT '/uploads/default-avatar.png';
            ALTER TABLE users ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
        `);

        // Rooms Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS rooms (
                id SERIAL PRIMARY KEY,
                room_name VARCHAR(255) NOT NULL,
                room_code VARCHAR(10) UNIQUE NOT NULL,
                room_desc TEXT DEFAULT '',
                room_icon TEXT DEFAULT '/uploads/default-group.png',
                created_by INT REFERENCES users(id) ON DELETE SET NULL
            );
        `);

        // Perform safe checks/alterations for room detail extensions
        await pool.query(`
            ALTER TABLE rooms ADD COLUMN IF NOT EXISTS room_desc TEXT DEFAULT '';
            ALTER TABLE rooms ADD COLUMN IF NOT EXISTS room_icon TEXT DEFAULT '/uploads/default-group.png';
        `);

        // Room Members Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS room_members (
                id SERIAL PRIMARY KEY,
                room_id INT REFERENCES rooms(id) ON DELETE CASCADE,
                user_id INT REFERENCES users(id) ON DELETE CASCADE,
                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_admin BOOLEAN DEFAULT FALSE,
                UNIQUE(room_id, user_id)
            );
        `);

        // Add is_admin dynamically to room_members if it doesn't exist
        await pool.query(`
            ALTER TABLE room_members ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
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

        // Perform safe checks/alterations for messaging extensions
        await pool.query(`
            ALTER TABLE messages ADD COLUMN IF NOT EXISTS room_id INT REFERENCES rooms(id) ON DELETE CASCADE;
            ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type VARCHAR(50) DEFAULT 'text';
            ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_url TEXT;
            ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
            ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to_message_id INT REFERENCES messages(id) ON DELETE SET NULL;
            ALTER TABLE messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;
            ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE;
        `);

        // Group Message Reads
        await pool.query(`
            CREATE TABLE IF NOT EXISTS group_message_reads (
                id SERIAL PRIMARY KEY,
                message_id INT REFERENCES messages(id) ON DELETE CASCADE,
                user_id INT REFERENCES users(id) ON DELETE CASCADE,
                read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(message_id, user_id)
            );
        `);

        // Message Reactions Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS message_reactions (
                id SERIAL PRIMARY KEY,
                message_id INT REFERENCES messages(id) ON DELETE CASCADE,
                user_id INT REFERENCES users(id) ON DELETE CASCADE,
                emoji VARCHAR(10) NOT NULL,
                UNIQUE(message_id, user_id)
            );
        `);

        // Pinned Chats Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS pinned_chats (
                id SERIAL PRIMARY KEY,
                user_id INT REFERENCES users(id) ON DELETE CASCADE,
                target_user_id INT REFERENCES users(id) ON DELETE CASCADE,
                room_id INT REFERENCES rooms(id) ON DELETE CASCADE,
                pinned_at TIMESTAMPTZ DEFAULT NOW(),
                CONSTRAINT unique_user_target UNIQUE(user_id, target_user_id),
                CONSTRAINT unique_user_room UNIQUE(user_id, room_id)
            );
        `);

        // Message Reports Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS message_reports (
                id SERIAL PRIMARY KEY,
                message_id INT REFERENCES messages(id) ON DELETE CASCADE,
                reporter_id INT REFERENCES users(id) ON DELETE CASCADE,
                reason TEXT NOT NULL,
                status VARCHAR(50) DEFAULT 'pending',
                reported_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);

        // Create Performance Indexes
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_messages_private ON messages(sender_id, receiver_id) WHERE room_id IS NULL;
            CREATE INDEX IF NOT EXISTS idx_messages_room ON messages(room_id) WHERE room_id IS NOT NULL;
            CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
            CREATE INDEX IF NOT EXISTS idx_room_members ON room_members(room_id, user_id);
            CREATE INDEX IF NOT EXISTS idx_group_reads ON group_message_reads(message_id, user_id);
        `);

        console.log('Successfully connected to Cloud Database & Tables and Indexes Verified!');
    } catch (err) {
        console.error('Database initialization failed:', err);
        process.exit(1); 
    }
};

module.exports = { pool, initDB };