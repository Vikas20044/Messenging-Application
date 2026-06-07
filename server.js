const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const { Pool } = require('pg');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'echochat_ultra_secure_key_2026',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// PostgreSQL Pool Connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

// Initialize database tables
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
    }
};
initDB();

// Helper to map PostgreSQL syntax field '_id' safely for the frontend 
const formatMessage = (msg) => {
    if (!msg) return null;
    return {
        _id: msg.id, // Maps Postgres serial 'id' to '_id' so index.html doesn't break
        username: msg.username,
        text: msg.text,
        timestamp: msg.timestamp,
        isRead: msg.isread // PostgreSQL sets columns to lowercase by default
    };
};

// --- AUTH ROUTES ---

app.post('/api/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const normalizedUsername = username.trim();
        const normalizedEmail = email.toLowerCase().trim();

        // Check if user exists
        const userCheck = await pool.query(
            'SELECT id FROM users WHERE username = $1 OR email = $2',
            [normalizedUsername, normalizedEmail]
        );
        if (userCheck.rows.length > 0) {
            return res.status(400).send('Username or Email already registered.');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user
        await pool.query(
            'INSERT INTO users (username, email, password) VALUES ($1, $2, $3)',
            [normalizedUsername, normalizedEmail, hashedPassword]
        );
        
        res.status(201).send('Signup successful');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error creating account');
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        const result = await pool.query(
            'SELECT * FROM users WHERE username = $1 AND email = $2',
            [username.trim(), email.toLowerCase().trim()]
        );
        
        if (result.rows.length === 0) {
            return res.status(400).send('Matching User & Email combination not found');
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).send('Incorrect password');

        req.session.username = user.username;
        res.json({ success: true, username: user.username });
    } catch (err) {
        res.status(500).send('Server login error');
    }
});

app.post('/api/forgot-password', async (req, res) => {
    try {
        const { username, email, newPassword } = req.body;
        const normalizedUsername = username.trim();
        const normalizedEmail = email.toLowerCase().trim();

        const result = await pool.query(
            'SELECT id FROM users WHERE username = $1 AND email = $2',
            [normalizedUsername, normalizedEmail]
        );
        if (result.rows.length === 0) {
            return res.status(400).send('Matching User & Email combination not found');
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        await pool.query(
            'UPDATE users SET password = $1 WHERE id = $2',
            [hashedNewPassword, result.rows[0].id]
        );

        res.send('Password reset successfully');
    } catch (err) {
        res.status(500).send('Reset server error');
    }
});

app.get('/api/logout', (req, res) => {
    req.session.destroy();
    res.send('Logged out');
});

// --- SOCKET.IO REALTIME EVENTS ---

io.on('connection', async (socket) => {
    try {
        // Fetch last 100 messages sorted by timestamp oldest first
        const result = await pool.query(
            'SELECT * FROM messages ORDER BY timestamp ASC LIMIT 100'
        );
        const history = result.rows.map(formatMessage);
        socket.emit('chatHistory', history);
    } catch (err) {
        console.error('Error fetching chat history:', err);
    }

    socket.on('chatMessage', async (data) => {
        try {
            const result = await pool.query(
                'INSERT INTO messages (username, text) VALUES ($1, $2) RETURNING *',
                [data.username, data.text]
            );
            const savedMessage = formatMessage(result.rows[0]);
            io.emit('message', savedMessage);
        } catch (err) {
            console.error('Message dropped: Failed to write to PostgreSQL', err);
        }
    });

    socket.on('markAsRead', async (messageId) => {
        try {
            await pool.query(
                'UPDATE messages SET isRead = TRUE WHERE id = $1',
                [messageId]
            );
            io.emit('messageReadUpdate', messageId);
        } catch (err) {
            console.error('Failed to update read status', err);
        }
    });

    socket.on('clearChat', async () => {
        try {
            await pool.query('TRUNCATE TABLE messages RESTART IDENTITY');
            io.emit('chatCleared');
        } catch (err) {
            console.error('Failed to purge database messages:', err);
        }
    });
});

server.listen(PORT, () => {
    console.log(`Application running dynamically at http://localhost:${PORT}`);
});