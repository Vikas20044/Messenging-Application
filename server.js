const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const dotenv = require('dotenv');
const session = require('express-session');

// Import modular database configurations and authentication routes
const { pool, initDB } = require('./src/config/db');
const authRoutes = require('./src/routes/auth');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'echochat_ultra_secure_key_2026',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// Serve static assets out of the /app directory (disabling default index fallback)
app.use(express.static(path.join(__dirname, 'app'), { index: false }));

// Initialize PostgreSQL Tables
initDB();

// Bind Modular API endpoints
app.use('/api', authRoutes);

// --- STATIC PAGE ROUTING LAYER ---

// Serves the security router gateway index.html from the root folder
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'app', 'login.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'app', 'signup.html'));
});

app.get('/forgot-password', (req, res) => {
    res.sendFile(path.join(__dirname, 'app', 'forgot.html'));
});

// Protected Route: Only accessible if an active session exists
app.get('/chat', (req, res) => {
    if (!req.session || !req.session.username) {
        return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname, 'app', 'home.html'));
});

// Endpoint to expose session attributes safely to client-side JS
app.get('/api/session-user', (req, res) => {
    if (req.session && req.session.username) {
        res.json({ id: req.session.userId, username: req.session.username });
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
});

// --- ADVANCED SECURE WEB_SOCKET LAYER ---
io.on('connection', (socket) => {

    // Triggers when a user selects a contact from their sidebar or search results
    socket.on('joinRoom', async ({ currentUserId, targetUserId }) => {
        // Generate a deterministic unique room identifier using sorted primary keys
        const roomName = `chat_${Math.min(currentUserId, targetUserId)}_${Math.max(currentUserId, targetUserId)}`;
        
        // Leave any previous private chat rooms to optimize message boundaries
        socket.rooms.forEach(room => { 
            if (room !== socket.id) socket.leave(room); 
        });
        socket.join(roomName);

        try {
            // Fetch the chat history explicitly exchanged between these two users
            // Uses exact lowercase columns matching our Postgres table definitions
            const result = await pool.query(`
                SELECT m.id as _id, m.text, m.timestamp, m.isread as "isRead", 
                       u.username as username, m.sender_id
                FROM messages m
                JOIN users u ON m.sender_id = u.id
                WHERE (m.sender_id = $1 AND m.receiver_id = $2) 
                   OR (m.sender_id = $2 AND m.receiver_id = $1)
                ORDER BY m.timestamp ASC LIMIT 100
            `, [currentUserId, targetUserId]);

            socket.emit('chatHistory', result.rows);
        } catch (err) {
            console.error('Error gathering private room thread history:', err);
        }
    });

    // Triggers when a message is dispatched within a private stream
    socket.on('privateMessage', async ({ sender_id, receiver_id, text }) => {
        const roomName = `chat_${Math.min(sender_id, receiver_id)}_${Math.max(sender_id, receiver_id)}`;
        try {
            // Uses exact lowercase columns matching our Postgres table definitions
            const result = await pool.query(`
                INSERT INTO messages (sender_id, receiver_id, text) 
                VALUES ($1, $2, $3) 
                RETURNING id as _id, text, timestamp, isread as "isRead"
            `, [sender_id, receiver_id, text]);

            const userResult = await pool.query('SELECT username FROM users WHERE id = $1', [sender_id]);

            const payload = {
                ...result.rows[0],
                sender_id,
                username: userResult.rows[0].username
            };

            // Stream exclusively to the isolated room signature
            io.to(roomName).emit('message', payload);
        } catch (err) {
            console.error('Failed to execute private message database insert sequence:', err);
        }
    });

    // Handles read-receipt double-tick state management
    socket.on('markAsRead', async (messageId) => {
        try {
            await pool.query('UPDATE messages SET isread = TRUE WHERE id = $1', [messageId]);
            io.emit('messageReadUpdate', messageId);
        } catch (err) {
            console.error('Failed to update private thread state receipt:', err);
        }
    });
});

server.listen(PORT, () => {
    console.log(`Application running dynamically at http://localhost:${PORT}`);
});