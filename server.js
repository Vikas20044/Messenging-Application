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
const defaultAvatarPath = path.join(uploadDir, 'default-avatar.png');
const defaultGroupPath = path.join(uploadDir, 'default-group.png');

const whatsappUserBase64 = "iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH6AcbEhkAFv7ieQAABYBJREFUeNrtm0toVFUYhp9zZtIxiSgNojSgIuZp0qgVpYgWpYgWpYgWpYgWpYgWpYgWpYgWbdq0KEVrKSIzI5p5K4oEEXQPUsw8tMzMcS7mXv9w7zSjmXvOnHPOf9wz56uG8//f9//nP99/zoGkpKSkpKSkpKSkpKSkpKSkpKTkpMTb4kYVpD0FBVgALAdmA9OBI0AjUAs0A6XAPeAecBu4AdwCHgKPEinf6mD9gGEAasA5YBMwGVgF1Nf7mIeAW8BfwB3gA3E6kfIuCFQCvAKuAdcBSoAnYALQAq0D1v88Pge/AL8AnYA6wA5gHbAKagBeD//V7An8CHgEPgYfAbeBWMuVbGKwNsAFYBywHGoENwBygE6it0gK8Ah4Bv4FfAnW6gY3BWpLq7/XfD7wEHgH3gD+S2gIrgvUBdgC7gZPADqATmFvxXb8D3AN+A78Gf28HdgE7gV3ATmAtsDSpMh8BfwC/gYfAn8mUbyWwAsBeYC+wD9gPrALmZfndfwt8C9b7b6AL2AfsA/YDe4B9wIsZfO9LwEvgOfAsme3v6bF/A7uBvWf0GvWlYhWpP9D3wE1S/UGrgG6gB3gJeAn0Ar0ZfO9LpP5Y30Fq+3v9VwB7T8f3Z/TzO0m9wVqgWf7v3wX+DNY8+FvPGe1vM6ktoM6Mfr4T2Av0A73Aa7S+wXof77v/HPD/2t884E2gL/h7Sxl9rA+p78/13wX8SGoLqAvWh9S2tz3X6w/W3F7+F8C8f3rff0C96I8H6+nEtoC6YL1IbevccyN+f08n9ofT+X3Bf2N/9ID90T996P0uS7b9PfX9Pf0R+zH7H7MfsR+xP2b/T9of6wPrZ/T/oP1B+7HfsX/Mfn/PfW6S2ALqgfUzte39vN7P6/v7vVf6Bf1/Zbe91N7T9rFfsl9v+9gfdg70Bf+NvT+pZfW9B6nv7fVb0vpt6v37gGZ6/186sS+gHljzUv/8S2BfUv3D6fsO6vuD7mUfUD+kX6T+mO7rC/6T+oP2D9vvfUj9oP1D9oc7sR+xP9wfTvf32Y/ZH+nH/pC7g7Vw6I/Zfyr9Y3/An/bH7EfsR+wP2T9k/1C6v6S/vR/8Zf2yfvD79cv6Ze8H/f5S+9ivt70f9P8/sB986f1e6pf0S/pL7T3pL++X/X7tsvaH7MftR+zH7Sfrp+z366S7WbKzYCnwFrASeAtYSTr7gK8L9m3Dvu98XwUscD+k+gD6p9R6OvuADmBtznv6OfAncCf8/VbgVvD3ZlKPoX5Iv+T+I3m/v20/Yv+Y/eF0fzv9H0Xb7/f37A+p78fsl/STgI9P7RfwCfCJwOfAnwU+9An4Y/8v+78F/gH+wP4H+H/8Xw9fBPwV8H/C1+9R4FwOfvUdB87Lz7u+U8A593nfcRI4WeAn31mO9XGsf59XnGP887ziPOMYf8pfx/oX9H9b1gX/gP6AsvVfVvo8XG9gHfA68AbwBvAm6XwOOBP67M3+n+wU8AvwY8Afev+G/Y6vO+HvUvq6bNfTZZb/XfCHvvpY70NqWwPqX9H3u6m1pfX7bWptZ7S+zay9fG3Z9pZaW7X1V63r4wM8A+7m8bFfwBPgH6S+r1N/0DpgDdB6xo6g9YBaS0r972N9XbY81DqS69rS67fDdQyvH0wHrgLXAtfCWmAd8I0bXWAtVv2A9Vj1E9ZzEbgE/PscBK7X913Xp/p/Wdf1wI9S+73UP+H6A+sN/HuuC1bMre5XgY+AnwN+A0+AJ8DjHPh/L8p57Mv2Xb7/AnZ8P9gX/D8W++6XWv/Fuv8OALs8qR8Zf/2pAAAAAElRU5ErkJggg==";
const whatsappGroupBase64 = "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";

if (!fs.existsSync(defaultAvatarPath)) {
    fs.writeFileSync(defaultAvatarPath, Buffer.from(whatsappUserBase64, 'base64'));
    console.log('Successfully written crisp placeholder asset: default-avatar.png on disk.');
}
if (!fs.existsSync(defaultGroupPath)) {
    fs.writeFileSync(defaultGroupPath, Buffer.from(whatsappGroupBase64, 'base64'));
    console.log('Successfully written crisp placeholder asset: default-group.png on disk.');
}

// Serve static assets out of the /app directory
app.use(express.static(path.join(__dirname, 'app'), { index: false }));
app.use('/uploads', express.static(path.join(__dirname, 'app', 'uploads')));

// Initialize PostgreSQL Tables
initDB();

// HOT DATABASE SCHEMA MIGRATION: Adjusted to handle permanent community member structures
async function checkSchemaMigration() {
    try {
        await pool.query(`
            ALTER TABLE rooms ADD COLUMN IF NOT EXISTS room_desc TEXT DEFAULT '';
            ALTER TABLE rooms ADD COLUMN IF NOT EXISTS room_icon TEXT DEFAULT '/uploads/default-group.png';
            
            -- Dynamic runtime table expansion for group message reads tracking ledger
            CREATE TABLE IF NOT EXISTS group_message_reads (
                id SERIAL PRIMARY KEY,
                message_id INT NOT NULL,
                user_id INT NOT NULL,
                read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(message_id, user_id)
            );

            -- NEW: Dynamic tracking table for permanent group entry registries
            CREATE TABLE IF NOT EXISTS room_members (
                id SERIAL PRIMARY KEY,
                room_id INT NOT NULL,
                user_id INT NOT NULL,
                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(room_id, user_id)
            );
        `);
        console.log('PostgreSQL database room details, members registry & reads status schema synchronized successfully.');
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
        
        // Auto-link creator to room member persistence registry
        const dynamicRoom = result.rows[0];
        await pool.query(
            'INSERT INTO room_members (room_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [dynamicRoom.id, req.session.userId]
        );

        res.json(dynamicRoom);
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
        
        // Auto-enroll user inside the room membership directory table upon lookups
        const TargetRoom = result.rows[0];
        await pool.query(
            'INSERT INTO room_members (room_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [TargetRoom.id, req.session.userId]
        );

        res.json(TargetRoom);
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

// --- GLOBAL LIVE DICTIONARY TRACKING SYSTEM ---
const connectedUsersMap = new Map(); // tracks runtime allocations format: userId -> Set of socketIds

// --- ADVANCED SECURE WEB_SOCKET LAYER ---
io.on('connection', (socket) => {

    // Trace active authentication state synchronization signals
    socket.on('declareIdentity', ({ userId }) => {
        if (!userId) return;
        socket.userId = userId;
        if (!connectedUsersMap.has(userId)) {
            connectedUsersMap.set(userId, new Set());
        }
        connectedUsersMap.get(userId).add(socket.id);
        io.emit('networkIdentityStatusChange', { userId, status: 'online' });
    });

    socket.on('requestUserOnlineStatus', ({ targetUserId }, callback) => {
        const status = connectedUsersMap.has(targetUserId) && connectedUsersMap.get(targetUserId).size > 0 ? 'online' : 'offline';
        if (callback) callback({ status });
    });

    // BUG FIXED: Now pulls absolute database memberships and matches profiles against application-wide global trackers
    socket.on('fetchGroupOnlineRoster', async ({ roomId }, callback) => {
        try {
            const result = await pool.query(`
                SELECT u.id, u.username, COALESCE(u.profile_pic_url, '/uploads/default-avatar.png') as profile_pic_url
                FROM room_members rm
                JOIN users u ON rm.user_id = u.id
                WHERE rm.room_id = $1
                ORDER BY u.username ASC
            `, [roomId]);

            const dynamicRoster = result.rows.map(user => {
                const isOnline = connectedUsersMap.has(user.id) && connectedUsersMap.get(user.id).size > 0;
                return {
                    id: user.id,
                    username: user.username,
                    profile_pic_url: user.profile_pic_url,
                    status: isOnline ? 'online' : 'offline'
                };
            });

            if (callback) callback(dynamicRoster);
        } catch (err) {
            console.error('Error computing dynamic group tracking registry:', err);
            if (callback) callback([]);
        }
    });

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

            // Flush dynamic individual group message read records on workspace join entry
            if (socket.userId) {
                await pool.query(`
                    INSERT INTO group_message_reads (message_id, user_id)
                    SELECT id, $1 FROM messages WHERE room_id = $2 AND sender_id != $1
                    ON CONFLICT DO NOTHING
                `, [socket.userId, roomId]);
                
                io.to(roomName).emit('broadcastGroupReadsSynchronized', { roomId });
            }

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

            const targetMessageId = result.rows[0]._id;
            const userResult = await pool.query("SELECT username, COALESCE(profile_pic_url, '/uploads/default-avatar.png') as profile_pic_url FROM users WHERE id = $1", [sender_id]);

            // Auto log implicit visibility metrics for sockets active inside the workspace stream context
            const activeRoomSockets = io.sockets.adapter.rooms.get(roomName) || new Set();
            for (const sockId of activeRoomSockets) {
                const clientSock = io.sockets.sockets.get(sockId);
                if (clientSock && clientSock.userId) {
                    await pool.query(`
                        INSERT INTO group_message_reads (message_id, user_id) 
                        VALUES ($1, $2) ON CONFLICT DO NOTHING
                    `, [targetMessageId, clientSock.userId]);
                }
            }

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

    // --- FIXED: Removed stray text from the database query execution string ---
socket.on('explicitMarkGroupMessageAsRead', async ({ messageId, userId, roomId }) => {
    try {
        await pool.query(`
            INSERT INTO group_message_reads (message_id, user_id) 
            VALUES ($1, $2) ON CONFLICT DO NOTHING
        `, [messageId, userId]);
        io.to(`group_room_${roomId}`).emit('broadcastGroupReadsSynchronized', { roomId });
    } catch (err) {
        console.error(err);
    }
});

    socket.on('fetchGroupMessageReadLedger', async ({ messageId }, callback) => {
        try {
            const result = await pool.query(`
                SELECT u.username, r.read_at 
                FROM group_message_reads r
                JOIN users u ON r.user_id = u.id
                WHERE r.message_id = $1
                ORDER BY r.read_at ASC
            `, [messageId]);
            if (callback) callback(result.rows);
        } catch (err) {
            if (callback) callback([]);
        }
    });

    socket.on('disconnect', () => {
        if (socket.userId && connectedUsersMap.has(socket.userId)) {
            const identityTrackingScope = connectedUsersMap.get(socket.userId);
            identityTrackingScope.delete(socket.id);
            if (identityTrackingScope.size === 0) {
                connectedUsersMap.delete(socket.userId);
                io.emit('networkIdentityStatusChange', { userId: socket.userId, status: 'offline' });
            }
        }
    });
});



// --- UPDATED ADMINISTRATIVE PIPELINE GATEWAYS & EXTENDED MODERATION STUBS ---

// 1. Serving Admin Interface View safely from the directory route path
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'app', 'admin.html'));
});

// 2. Security Gate Verification Handler
app.post('/api/admin/verify', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'admin123') {
        return res.sendStatus(200);
    }
    res.status(401).send('Access Denied: Invalid Administrative Credentials.');
});

// 3. ENHANCED: Dynamic Database Aggregations for Active Communities & Core Tables
app.get('/api/admin/metrics', async (req, res) => {
    try {
        // Collect analytical counter variables tracking sizes across tables concurrently
        const userCountRes = await pool.query('SELECT COUNT(*) FROM users');
        const roomCountRes = await pool.query('SELECT COUNT(*) FROM rooms');
        const messageCountRes = await pool.query('SELECT COUNT(*) FROM messages');
        
        // Dynamic lookups parsing profiles ledger tables data 
        const usersListRes = await pool.query('SELECT id, username, full_name, bio FROM users ORDER BY id DESC LIMIT 50');
        
        // NEW EXTENDED QUERY: Gathers live group chat telemetry schemas
        const roomsListRes = await pool.query('SELECT id, room_name, room_code, room_desc, created_by FROM rooms ORDER BY id DESC LIMIT 50');

        res.json({
            counters: {
                userCount: userCountRes.rows[0].count,
                roomCount: roomCountRes.rows[0].count,
                messageCount: messageCountRes.rows[0].count
            },
            users: usersListRes.rows,
            rooms: roomsListRes.rows
        });
    } catch (err) {
        console.error('Failure mapping tracking system matrix indexes telemetry:', err);
        res.status(500).json({ error: 'Administrative dashboard analytics sequence runtime crash.' });
    }
});

// 4. NEW FUNCTIONALITY: Operational Moderation Route Hookup
app.post('/api/admin/users/:id/flag', async (req, res) => {
    const targetedUserId = req.params.id;
    try {
        // Example System Level Reset: Flags account by setting a diagnostic system placeholder notification
        await pool.query(
            "UPDATE users SET bio = '⚠️ This profile content description is undergoing review by system administrative safety officers.' WHERE id = $1", 
            [targetedUserId]
        );
        
        // Notify the application ecosystem in real time that structural information parameters altered
        io.emit('profileUpdated', { userId: targetedUserId, bio: '⚠️ Undergoing review.' });
        
        res.sendStatus(200);
    } catch (err) {
        console.error(err);
        res.status(500).send('Database mutation action sequence conflict.');
    }
});

// Add these stubs alongside your existing standalone routing views in server.js
app.get('/developer', (req, res) => {
    res.sendFile(path.join(__dirname, 'app', 'developer.html'));
});

app.get('/faq', (req, res) => {
    res.sendFile(path.join(__dirname, 'app', 'faq.html'));
});

server.listen(PORT, () => {
    console.log(`Application running dynamically at http://localhost:${PORT}`);
});