const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const dotenv = require('dotenv');
const session = require('express-session');

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

// Serve style.css globally out of the /app directory
app.use(express.static(path.join(__dirname, 'app'), { index: false }));

initDB();

// Bind Authentication API Routes
app.use('/api', authRoutes);

// --- STATIC PAGE ROUTING LAYER ---

app.get('/', (req, res) => {
    res.redirect('/login');
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

// Protected Route: Only access if active session username is established
app.get('/chat', (req, res) => {
    if (!req.session || !req.session.username) {
        return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname, 'app', 'chat.html'));
});

// Endpoint to expose session to client-side JS safely
app.get('/api/session-user', (req, res) => {
    if (req.session && req.session.username) {
        res.json({ username: req.session.username });
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
});

// --- REALTIME WEB_SOCKET LAYER ---
const formatMessage = (msg) => {
    if (!msg) return null;
    return {
        _id: msg.id,
        username: msg.username,
        text: msg.text,
        timestamp: msg.timestamp,
        isRead: msg.isread
    };
};

io.on('connection', async (socket) => {
    try {
        const result = await pool.query('SELECT * FROM messages ORDER BY timestamp ASC LIMIT 100');
        socket.emit('chatHistory', result.rows.map(formatMessage));
    } catch (err) {
        console.error('Error fetching chat history:', err);
    }

    socket.on('chatMessage', async (data) => {
        try {
            const result = await pool.query(
                'INSERT INTO messages (username, text) VALUES ($1, $2) RETURNING *',
                [data.username, data.text]
            );
            io.emit('message', formatMessage(result.rows[0]));
        } catch (err) {
            console.error('Message serialization dropped:', err);
        }
    });

    socket.on('markAsRead', async (messageId) => {
        try {
            await pool.query('UPDATE messages SET isRead = TRUE WHERE id = $1', [messageId]);
            io.emit('messageReadUpdate', messageId);
        } catch (err) {
            console.error('Failed to patch read state:', err);
        }
    });

    socket.on('clearChat', async () => {
        try {
            await pool.query('TRUNCATE TABLE messages RESTART IDENTITY');
            io.emit('chatCleared');
        } catch (err) {
            console.error('Purge error:', err);
        }
    });
});

server.listen(PORT, () => {
    console.log(`Application running dynamically at http://localhost:${PORT}`);
});