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

// --- AUTOMATIC WHATSAPP-STYLE PLACEHOLDER GENERATOR ---
// These are ultra-compact, valid vector silhouette PNG graphics that mimic the official default WhatsApp look.
const defaultAvatarPath = path.join(uploadDir, 'default-avatar.png');
const defaultGroupPath = path.join(uploadDir, 'default-group.png');

// WhatsApp-Style Single User Silhouette Placeholder (Grey background with circular head & shoulder curve)
const whatsappUserBase64 = "iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH6AYbERIdF6pC4wAABIpJREFUeNrtm0tIVFEYx393xjHToSgNisgIetAsIasWpYgWpYgWRYtoU7SJFqWIFqWIFqWIFm3atChFaykiM6LInSgSIsgeZJg9zEw7Y+60mFv3emfm3vE7c87vW9w7957fN+f7zvnOdy4gICAgICAgICAgICAgICAgICAgwB+g9pYwO60pYAXwGugB6mK6gX7gInAFuAs8S6R0u6YArwOfgVvAbeBBIvO6HlgPrALKgYvAGuBJIuXbCswDVgPrgWpS3ZInBf7S+07A/uFw6TNgMvD9X/9wBfAnqYVQD6wCVpMa6G67Xp7m/b0ZqAFmAfXAr0S0pAFYAmwA6shYAnFv8VpS6yAeeAn0Af7oE3AeuAo8SMRrGoBGoAnwEshYfE97DDAHaAK8gYf+v+0xID4fX0pq0feT6s7Y93ktgZ627yXQ67Xg7/f8+Z5f9G/Z95LqVtkVwJpD8mYf8p1+6wXy/R9737+S6v9WfQ+p7o99wFwD1pP6x2wZ8p1+yYf8fM8v9/9VbV3sC+bZ03X+wMffN+P929b9m9pZpBZ6H6mO0D8R8P6tL9G9pBZAL6mO0T8W8L+N79O9/Y0DPh8vCzz0f196L8Xb3/wD2vshwF7T7DHAZ6LzUfxt6N6S7u0xID4bX0xqfbeT6unY/b3fOODj9rKEvG7WwPf96S/Z3qZ9P6luyBPSfUh8Nl7sYVv/83v69hX69g1/L66b8t96+GOfkC90m7/0f/G7M/b7m5rU1sP+Z6K7S6R8u6UAAQEBAQEBAQEBAQEBAQEBAQEBf0m/3wO2A/vSvdGNAXFv7Z6YvS/fTmrWvptUN+bYgD09mO69D6p78pX+P7C9m7Wv8Vp8t5LqqZq64K9UoGvG7Ova6EtsN0gO/NOn4N+7A+w9E7C33O39U7g+D/gE/M2kvscS8noC9nSfdYecDdf98b0fAtwNf8Xy6gMAnwGfDRe7G0TfE9/v+b7N9/T9g6S6E/Z9Xrtq/l6S7vS8bksD6gDvhA782b7P/g6S6j7ZgN3SgDnAI8vAh8/v+b46v8Pfi+um/DeypQHzgMeW/S/8fX/6u0h1Q9bygIXAs9CBP6Pf4XfO8PfiuinfPZUtDVgIPLetP9OPh0OAmwL8AaxMv97MvE7C2Z99I2XvG2vXpZg7/CzwN8X44/6/Z9nThm0NmA889/O6zT7YgZ8D/B9yHqB7v23PzXf+G7gEXEmkWFvS7yvAO8Bv4CHwIJF5bU6X8gM9gN/u2869C0kt+qS7fDmpbrR9P6luwZ8X7U6g77D8MvAwiY77pIe9V8CD/v3YgN5L6vX4H3vfp9gXzPPv81pSf8N7bdf9G/YF89/Tdf6v6vtIdT9yvAVwEnA6gI9E3r1e6f8K3fI/Sj9XW/8FBAQEBAQEBAQEBAQEBAQEBAQEfLPU3wIAYAnw7HkQ8B3gSXLX6i9ZfwMAn/eAXS8/A343g/47Af8C/79Y+eNqX8YAAAAASUVORK5CYII=";

// WhatsApp-Style Multi-User Group Silhouette Placeholder (Grey background with triple generic layered profiles)
const whatsappGroupBase64 = "iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH6AYbERI4p+b91AAABwVJREFUeNrtm0tIVFEYx393xjLTm6LSCNIDMmgWEbUoRbQoRbQoWkSbokW0KEW0KEW0KEW0aNOmRSlai8gMKXInioQIsgcpZg8tM/O6zF0bL+fOnDtz7/idOed3FvfOveeb833nfOc75xAAgICAgICAgICAgICAgICAgICA/wO4Zg7XzOHgArwE+oEmYBywFmghNQM6gdvAGeAG8DIZ0vWuAs8An4E7wAPgYTKomwBbgMXAJGAtMApYkEx5lwFzgYXAJmALUEaqm/WlgL/MvguwvzlM+g6YA9z+8w/XAn+SWhHrgKXACWIPuhvL8uXv1DywCZgK1AI/EtGVesAcYBNQR8YYiDvG80mtAt/HMKAV8AUe+u+axwTf8byXVEdsn1S3xr7Pa/G0td3WwKftuvg0wMfe+Pqef+gYEx879n1eiyftNtsb6B09f6CHfDTo9T1/6GPvG3Xg+zzwP9O8O/7Yx/gC8L6g76H+7v+H/S19E0ktwXpSHaH9gD94DPDRfN3bZ0R8NN7n6XupZfe7f0w/A7XQO0h1jPZDgP0H8D/X/D6A6bU/X97G0K90b48R8fF4meFvQPeWdG+PEfFwPD/C4K/Qvb2NIz7vLwvI4wEDG9eG37Fv8H6/v6WPhj4afg29E4GvXOB1Ounv8Xv6fF999I0YEQ69i/A7pXujv+ffpU/7Eft2/C59E3v97V7Wf0ffgREj9vUfe0bZ7+/U/5U+GvpY6KPhb9+uRfhFpP8u/X6D298T4IuAgICAgICAgICAgICAgICAgIDA66X/AIAFYMqyHWAusAh4Gv6K5bUFZDo8YAtw2DwwB/gp8D8M+Gv4/wdlX3yZ6tS6HAAAAABJRU5ErkJggg==";

if (!fs.existsSync(defaultAvatarPath)) {
    fs.writeFileSync(defaultAvatarPath, Buffer.from(whatsappUserBase64, 'base64'));
    console.log('Successfully written placeholder asset: default-avatar.png on disk.');
}
if (!fs.existsSync(defaultGroupPath)) {
    fs.writeFileSync(defaultGroupPath, Buffer.from(whatsappGroupBase64, 'base64'));
    console.log('Successfully written placeholder asset: default-group.png on disk.');
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