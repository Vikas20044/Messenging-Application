const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const dotenv = require('dotenv');
const session = require('express-session');
const fs = require('fs');
const multer = require('multer');

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

// Ensure local file storage paths exist for profile photos and chat media attachments
const uploadDir = path.join(__dirname, 'app', 'uploads');
const chatUploadDir = path.join(__dirname, 'app', 'uploads', 'chat');

if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(chatUploadDir)){
    fs.mkdirSync(chatUploadDir, { recursive: true });
}

// Serve static assets out of the /app directory (Where home.html and style.css live)
app.use(express.static(path.join(__dirname, 'app'), { index: false }));
app.use('/uploads', express.static(path.join(__dirname, 'app', 'uploads')));

// Initialize PostgreSQL Tables
initDB();

// HOT DATABASE SCHEMA MIGRATION: Ensure details columns exist on the rooms table structure
async function checkSchemaMigration() {
    try {
        await pool.query(`
            ALTER TABLE rooms ADD COLUMN IF NOT EXISTS room_desc TEXT DEFAULT '';
            ALTER TABLE rooms ADD COLUMN IF NOT EXISTS room_icon TEXT DEFAULT '/uploads/default-group.png';
        `);
        console.log('PostgreSQL database room details schema synchronized successfully.');
    } catch (err) {
        console.error('Error executing live rooms database structure alteration adjustments:', err);
    }
}
setTimeout(checkSchemaMigration, 1500);

// Bind Modular API endpoints
app.use('/api', authRoutes);

// --- MULTER LAYER 1: CONFIGURATION FOR PROFILE PHOTO UPLOADS ---
const profileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const uploadProfile = multer({
    storage: profileStorage,
    limits: { fileSize: 2 * 1024 * 1024 }, // Max 2MB file size limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (mimetype && extname) return cb(null, true);
        cb(new Error('Only system images (jpeg, jpg, png, webp) are permitted.'));
    }
});

// --- MULTER LAYER 2: CONFIGURATION FOR BULK CHAT MEDIA ATTACHMENTS ---
const chatMediaStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, chatUploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'media-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const uploadChatMediaBulk = multer({
    storage: chatMediaStorage,
    limits: { fileSize: 15 * 1024 * 1024 }, // Allowed maximum size: 15MB per file
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp|mp3|wav|ogg|mp4|webm|pdf/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (mimetype && extname) return cb(null, true);
        cb(new Error('Unsupported file extension for safe transmission inside conversations.'));
    }
});

// Middleware helper to secure incoming express profile mutations
function checkAuthSession(req, res, next) {
    if (req.session && req.session.userId) {
        return next();
    }
    res.status(401).json({ error: 'Unauthorized structural access request.' });
}

// --- ENHANCED BULK MULTIMEDIA ATTACHMENTS UPLOAD ROUTE ---
app.post('/api/chat/upload', checkAuthSession, uploadChatMediaBulk.array('chatFiles', 10), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No data file assets detected for delivery.' });
    }
    
    const uploadedAssets = req.files.map(file => {
        let resolvedType = 'text';
        const mime = file.mimetype;
        
        if (mime.startsWith('image/')) resolvedType = 'image';
        else if (mime.startsWith('audio/')) resolvedType = 'audio';
        else if (mime.startsWith('video/')) resolvedType = 'video';
        else if (mime === 'application/pdf') resolvedType = 'pdf';

        return {
            file_url: `/uploads/chat/${file.filename}`,
            message_type: resolvedType,
            filename: file.originalname
        };
    });

    res.json({
        success: true,
        files: uploadedAssets
    });
});

// --- COMMUNITY GROUP ROOM MANAGEMENT ENDPOINTS ---

app.post('/api/rooms/create', checkAuthSession, async (req, res) => {
    const { room_name, room_desc } = req.body;
    if (!room_name) return res.status(400).json({ error: 'Room name token parameter missing.' });
    
    const generateCode = () => Math.random().toString(36).substring(2, 7).toUpperCase();
    let roomCode = generateCode();
    
    try {
        const collisionCheck = await pool.query('SELECT id FROM rooms WHERE room_code = $1', [roomCode]);
        if (collisionCheck.rows.length > 0) roomCode = generateCode(); 

        const result = await pool.query(
            'INSERT INTO rooms (room_name, room_code, room_desc, room_icon, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING id, room_name, room_code, room_desc, room_icon',
            [room_name, roomCode, room_desc || '', '/uploads/default-group.png', req.session.userId]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database context group configuration failure.' });
    }
});

app.get('/api/rooms/lookup/:code', checkAuthSession, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, room_name, room_code, room_desc, room_icon FROM rooms WHERE room_code = $1', 
            [req.params.code.toUpperCase().trim()]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Target room configuration mismatch parameters.' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to query database room registries.' });
    }
});

// --- CORE PROFILE MANAGEMENT ENDPOINTS ---

app.get('/api/profile/me', checkAuthSession, async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT username, full_name, bio, COALESCE(profile_pic_url, '/uploads/default-avatar.png') as profile_pic_url FROM users WHERE id = $1", 
            [req.session.userId]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database context retrieval error.' });
    }
});

app.get('/api/profile/user/:id', checkAuthSession, async (req, res) => {
    try {
        // FIXED: Added COALESCE to structural lookup queries to secure default assets at DB extraction level
        const result = await pool.query(
            "SELECT username, full_name, bio, COALESCE(profile_pic_url, '/uploads/default-avatar.png') as profile_pic_url FROM users WHERE id = $1", 
            [req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User records missing.' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to extract profile metadata.' });
    }
});

app.put('/api/profile/update-info', checkAuthSession, async (req, res) => {
    const { full_name, bio } = req.body;
    try {
        await pool.query(
            'UPDATE users SET full_name = $1, bio = $2 WHERE id = $3',
            [full_name, bio, req.session.userId]
        );
        io.emit('profileUpdated', { userId: req.session.userId, full_name, bio });
        res.json({ success: true, message: 'Profile metadata synchronized.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update user database profile information.' });
    }
});

app.post('/api/profile/upload-avatar', checkAuthSession, uploadProfile.single('avatar'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Please select an image file asset.' });
    }
    const targetPublicPath = `/uploads/${req.file.filename}`;
    try {
        await pool.query(
            'UPDATE users SET profile_pic_url = $1 WHERE id = $2',
            [targetPublicPath, req.session.userId]
        );
        io.emit('profileUpdated', { userId: req.session.userId, profile_pic_url: targetPublicPath });
        res.json({ success: true, profile_pic_url: targetPublicPath });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to write custom image destination file path properties.' });
    }
});

app.put('/api/profile/update-credentials', checkAuthSession, async (req, res) => {
    const { username, password } = req.body;
    try {
        const collisionCheck = await pool.query(
            'SELECT id FROM users WHERE username = $1 AND id != $2', 
            [username, req.session.userId]
        );
        if (collisionCheck.rows.length > 0) {
            return res.status(400).json({ error: 'The selected username is already assigned to an account.' });
        }

        if (password && password.trim() !== "") {
            await pool.query(
                'UPDATE users SET username = $1, password = $2 WHERE id = $3',
                [username, password, req.session.userId]
            );
        } else {
            await pool.query('UPDATE users SET username = $1 WHERE id = $2', [username, req.session.userId]);
        }

        req.session.username = username;
        io.emit('profileUpdated', { userId: req.session.userId, username: username });
        res.json({ success: true, message: 'System access criteria updated successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Security structural adjustment sequence crash.' });
    }
});

// --- STATIC PAGE ROUTING LAYER ---

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

app.get('/chat', (req, res) => {
    if (!req.session || !req.session.username) {
        return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname, 'app', 'home.html'));
});

app.get('/api/session-user', (req, res) => {
    if (req.session && req.session.username) {
        res.json({ id: req.session.userId, username: req.session.username });
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
});

// --- SYSTEM API ROUTING STUBS ---
app.get('/api/chats/active', checkAuthSession, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT DISTINCT u.id, u.username, COALESCE(u.profile_pic_url, '/uploads/default-avatar.png') as profile_pic_url 
            FROM users u
            JOIN messages m ON (u.id = m.sender_id OR u.id = m.receiver_id)
            WHERE (m.sender_id = $1 OR m.receiver_id = $1) AND u.id != $1
        `, [req.session.userId]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json([]);
    }
});

app.get('/api/users/search', checkAuthSession, async (req, res) => {
    const query = req.query.q || '';
    try {
        const result = await pool.query(
            "SELECT id, username, COALESCE(profile_pic_url, '/uploads/default-avatar.png') as profile_pic_url FROM users WHERE username ILIKE $1 AND id != $2 LIMIT 10",
            [`%${query}%`, req.session.userId]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json([]);
    }
});

// --- ADVANCED SECURE WEB_SOCKET LAYER ---
io.on('connection', (socket) => {

    socket.on('joinRoom', async ({ currentUserId, targetUserId }) => {
        const roomName = `chat_${Math.min(currentUserId, targetUserId)}_${Math.max(currentUserId, targetUserId)}`;
        
        socket.rooms.forEach(room => { 
            if (room !== socket.id) socket.leave(room); 
        });
        socket.join(roomName);

        try {
            const result = await pool.query(`
                SELECT m.id as _id, m.text, m.timestamp, m.isread as "isRead", 
                       u.username as username, m.sender_id, m.message_type, m.file_url,
                       COALESCE(u.profile_pic_url, '/uploads/default-avatar.png') as profile_pic_url
                FROM messages m
                JOIN users u ON m.sender_id = u.id
                WHERE ((m.sender_id = $1 AND m.receiver_id = $2) 
                   OR (m.sender_id = $2 AND m.receiver_id = $1)) AND m.room_id IS NULL
                ORDER BY m.timestamp ASC LIMIT 100
            `, [currentUserId, targetUserId]);

            socket.emit('chatHistory', result.rows);
        } catch (err) {
            console.error('Error gathering private room thread history:', err);
        }
    });

    socket.on('privateMessage', async ({ sender_id, receiver_id, text, message_type, file_url }) => {
        const roomName = `chat_${Math.min(sender_id, receiver_id)}_${Math.max(sender_id, receiver_id)}`;
        const type = message_type || 'text';
        const url = file_url || null;
        try {
            const result = await pool.query(`
                INSERT INTO messages (sender_id, receiver_id, text, message_type, file_url) 
                VALUES ($1, $2, $3, $4, $5) 
                RETURNING id as _id, text, timestamp, isread as "isRead", message_type, file_url
            `, [sender_id, receiver_id, text, type, url]);

            const userResult = await pool.query("SELECT username, COALESCE(profile_pic_url, '/uploads/default-avatar.png') as profile_pic_url FROM users WHERE id = $1", [sender_id]);

            const payload = {
                ...result.rows[0],
                sender_id,
                username: userResult.rows[0].username,
                profile_pic_url: userResult.rows[0].profile_pic_url
            };

            io.to(roomName).emit('message', payload);
        } catch (err) {
            console.error('Failed to execute private message database insert sequence:', err);
        }
    });

    socket.on('joinGroupRoom', async ({ roomId }) => {
        const roomName = `group_room_${roomId}`;
        
        socket.rooms.forEach(room => { 
            if (room !== socket.id) socket.leave(room); 
        });
        socket.join(roomName);

        try {
            const result = await pool.query(`
                SELECT m.id as _id, m.text, m.timestamp, m.isread as "isRead", 
                       u.username as username, m.sender_id, m.message_type, m.file_url,
                       COALESCE(u.profile_pic_url, '/uploads/default-avatar.png') as profile_pic_url
                FROM messages m
                JOIN users u ON m.sender_id = u.id
                WHERE m.room_id = $1
                ORDER BY m.timestamp ASC LIMIT 100
            `, [roomId]);

            socket.emit('chatHistory', result.rows);
        } catch (err) {
            console.error('Failed processing bulk group history lookups:', err);
        }
    });

    socket.on('groupMessage', async ({ sender_id, room_id, text, message_type, file_url }) => {
        const roomName = `group_room_${room_id}`;
        const type = message_type || 'text';
        const url = file_url || null;
        try {
            const result = await pool.query(`
                INSERT INTO messages (sender_id, room_id, text, message_type, file_url) 
                VALUES ($1, $2, $3, $4, $5) 
                RETURNING id as _id, text, timestamp, isread as "isRead", message_type, file_url, room_id
            `, [sender_id, room_id, text, type, url]);

            const userResult = await pool.query("SELECT username, COALESCE(profile_pic_url, '/uploads/default-avatar.png') as profile_pic_url FROM users WHERE id = $1", [sender_id]);

            const payload = {
                ...result.rows[0],
                sender_id,
                username: userResult.rows[0].username,
                profile_pic_url: userResult.rows[0].profile_pic_url
            };

            io.to(roomName).emit('message', payload);
        } catch (err) {
            console.error('Group processing mutation execution insert failure:', err);
        }
    });

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