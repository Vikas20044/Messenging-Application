const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const dotenv = require('dotenv');
const session = require('express-session');
const fs = require('fs');
const multer = require('multer');
const bcrypt = require('bcryptjs');

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
    secret: process.env.SESSION_SECRET || 'echochat_ultra_secure_key_2026',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: 'lax'
    }
}));

// Ensure local file storage paths exist for profile photos and chat media attachments
const uploadDir = path.join(__dirname, 'app', 'uploads');
const chatUploadDir = path.join(__dirname, 'app', 'uploads', 'chat');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(chatUploadDir)) {
    fs.mkdirSync(chatUploadDir, { recursive: true });
}

// --- AUTOMATIC WHATSAPP-STYLE PLACEHOLDER GENERATOR ---
const defaultAvatarPath = path.join(uploadDir, 'default-avatar.png');
const defaultGroupPath = path.join(uploadDir, 'default-group.png');

const whatsappUserBase64 = "iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH6AcbEhkAFv7ieQAABYBJREFUeNrtm0toVFUYhp9zZtIxiSgNojSgIuZp0qgVpYgWpYgWpYgWpYgWpYgWpYgWbdq0KEVrKSIzI5p5K4oEEXQPUsw8tMzMcS7mXv9w7zSjmXvOnHPOf9wz56uG8//f9//nP99/zoGkpKSkpKSkpKSkpKSkpKSkpKTkpMTb4kYVpD0FBVgALAdmA9OBI0AjUAs0A6XAPeAecBu4AdwCHgKPEinf6mD9gGEAasA5YBMwGVgF1Nf7mIeAW8BfwB3gA3E6kfIuCFQCvAKuAdcBSoAnYALQAq0D1v88Pge/AL8AnYA6wA5gHbAKagBeD//V7An8CHgEPgYfAbeBWMuVbGKwNsAFYBywHGoENwBygE6it0gK8Ah4Bv4FfAnW6gY3BWpLq7/XfD7wEHgH3gD+S2gIrgvUBdgC7gZPADqATmFvxXb8D3AN+A78Gf28HdgE7gV3ATmAtsDSpMh8BfwC/gYfAn8mUbyWwAsBeYC+wD9gPrALmZfndfwt8C9b7b6AL2AfsA/YDe4B9wIsZfO9LwEvgOfAsme3v6bF/A7uBvWf0GvWlYhWpP9D3wE1S/UGrgG6gB3gJeAn0Ar0ZfO9LpP5Y30Fq+3v9VwB7T8f3Z/TzO0m9wVqgWf7v3wX+DNY8+FvPGe1vM6ktoM6Mfr4T2Av0A73Aa7S+wXof77v/HPD/2t884E2gL/h7Sxl9rA+p78/13wX8SGoLqAvWh9S2tz3X6w/W3F7+F8C8f3rff0C96I8H6+nEtoC6YL1IbevccyN+f08n9ofT+X3Bf2N/9ID90T996P0uS7b9PfX9Pf0R+zH7H7MfsR+xP2b/T9of6wPrZ/T/oP1B+7HfsX/Mfn/PfW6S2ALqgfUzte39vN7P6/v7vVf6Bf1/Zbe91N7T9rFfsl9v+9gfdg70Bf+NvT+pZfW9B6nv7fVb0vpt6v37gGZ6/186sS+gHljzUv/8S2BfUv3D6fsO6vuD7mUfUD+kX6T+mO7rC/6T+oP2D9vvfUj9oP1D9oc7sR+xP9wfTvf32Y/ZH+nH/pC7g7Vw6I/Zfyr9Y3/An/bH7EfsR+wP2T9k/1C6v6S/vR/8Zf2yfvD79cv6Ze8H/f5S+9ivt70f9P8/sB986f1e6pf0S/pL7T3pL++X/X7tsvaH7MftR+zH7Sfrp+z366S7WbKzYCnwFrASeAtYSTr7gK8L9m3Dvu98XwUscD+k+gD6p9R6OvuADmBtznv6OfAncCf8/VbgVvD3ZlKPoX5Iv+T+I3m/v20/Yv+Y/eF0fzv9H0Xb7/f37A+p78fsl/STgI9P7RfwCfCJwOfAnwU+9An4Y/8v+78F/gH+wP4H+H/8Xw9fBPwV8H/C1+9R4FwOfvUdB87Lz7u+U8A593nfcRI4WeAn31mO9XGsf59XnGP887ziPOMYf8pfx/oX9H9b1gX/gP6AsvVfVvo8XG9gHfA68AbwBvAm6XwOOBP67M3+n+wU8AvwY8Afev+G/Y6vO+HvUvq6bNfTZZb/XfCHvvpY70NqWwPqX9H3u6m1pfX7bWptZ7S+zay9fG3Z9pZaW7X1V63r4wM8A+7m8bFfwBPgH6S+r1N/0DpgDdB6xo6g9YBaS0r972N9XbY81DqS69rS67fDdQyvH0wHrgLXAtfCWmAd8I0bXWAtVv2A9Vj1E9ZzEbgE/PscBK7X913Xp/p/Wdf1wI9S+73UP+H6A+sN/HuuC1bMre5XgY+AnwN+A0+AJ8DjHPh/L8p57Mv2Xb7/AnZ8P9gX/D8W++6XWv/Fuv8OALs8qR8Zf/2pAAAAAElRU5ErkJggg==";
const whatsappGroupBase64 = "iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH6AcbEhkYlM5zKAAABmNJREFUeN7t22tsVFUUx/Hzu9MptBRaCi0F6pQC9UGBWqiPFqqPFqqPFmqPFqoPtVCoD1SoUAtV6gMVaqH6QAsVKD7wUR8gUExIID6gKCoGg9GoGIwPo0bFSDQeY0Rizv6Ym3bGO3fu3Dtz78ydOf8kk7SZO/fM2Xutvdfae60FCAgICAgICAgICAgICAgICAgIiL9T3KiCjL+gAHOBecC8wDPgGFAEFAFpYByYAcaASeA6MATcBG4AVwE/CizfEWApMB9YBswHlgELgaXAKmBVsP/+I+AHYBvQAnwD/AgMBZb/P96bAn8DPwC7gC+BrUBzYBlwH7AKWBXir/+A/A9gG/AisBX4FPgoYPmWANMALAKWAnXAUmApUBuYVw+wG/gU+AhYA6TDeIAdgZUi8d///cCrwGfAL0BiwPIdDrAcsACYAqwAlgGrgNpgz6sNfA58AnwE1ALpMB4wK7CSpHjPvwaIAnXAb0BvsHY0/O93hPIA8wJrgGhgXp8L1g9Kvf6pYI9XvX6v6+9zvdfrdf6v+vtIrR9bY3/U698P1hS8A3wKvAmsC5b2gZ6/A/gM+AR4F+gNlq6BPr9XgA+BN4E3+wW4g6VpoOcHwBvA68BrwMvAy8BLffQZ8BLwIvA8sDRYmnp7XwLMD7g/WDo6vT6gW8wU8AnwZ8BdwY/qZ8BPgU/6Y6A3+gPge+D7oE9A8HcwN/Cg/xYwPzCvHwA/BP+7vwd6oj8AeqJvgv5hA7ZgKewO+r0B77/S790f9W/fM+C33r/80u/L9+737rf8X7H/z3O/8T/j/zb/n+t+zv+M+zl/R6Wft2/Pbeft7fO25/bwdvV279/1T/x/rPtY97LuYd3FunuP7bztuXf8qf/T2/8FBAR+U5Gf+3/9P+p/8t3X39fR0ZHB69VdYVfB9+rK4L9XZwY+b2bA68/wuv9/yPfqp6C79b8O4I+An3eFfQfclZ6fA9wG9D4X7Atf6b8D3AX0Rk9f8Evg9zXf+T8wIPi7+Rdw95rgTjE/MC8/sC98T/Az7p7izv/b/A/clb4T3CnumTf/BXeNfSfYPWe6f677v7p/rvv67Zzr/onmOn8HeCtwN3A38NfAnfT89f8B+E3gbS6g/3Xg/376I8BP/eRP+3179/v77O9f4fN6/Z8Enp/y18CHgBsn9uofv9b69wN8CPhXAn6F8Z8CngQeX9G/P6H/m/pXIn7Z7wO4637f9+UfBPg94I8v7t+fs/6lC/n5gP/+7f8g8Pv6I+C3/wZg9T/Hfgv4beCPdf9N/Ru8A/w6wI8Cvz7Fj+Y+wN0Zvg/w/Sg/9v91/z3A9wPc+eM/D3zO/87fA3wO+GvgP879fI7wWcCvAZ76w68Bfg3wa+AnpT98BvhpwN2Auwf967D/R3gU+GnAwz/8M8CHgV8FfL0vAb/kZ8CXAz/+4Z8BPhj6YOCnPX/as6I/M+rP8v4X5+gPHZpZ3LOfz0h9eDqz6OdfUuCnv0+Bn/ZfUuCrv8+BP+1Z1p9R8WeG/enOn0n8mSFPf9jW0N6Vz0h6ZscP+OOfFfGZRT+fWevPnC2fP1c+P+npM/lzR7+V7b87Wz66G9N97Mbyvdkf0V3tU9w9pvu8bXv/P7fHdmO6j2wH7M12N9uX7FeyH3f+H9m92t66ZPeFtu1fUdvFp7bzP2vbxSe3z/H++X32M7Y9tgv7GdsV+5Xsz+wH7VfC8T7NnZq7M3+n+0q6n3T3Dfd4z3/LPeYf72vuvmD7Zfsl2wXbd/wXth+2H7K9L/GepHvKdkH3XzB9w/b6fEeyva7fV/Xz9+3p/q/gPv+XUfqfQ97Xb57yv0XwUfo6vX3D/yZ7C3v9/UfGevwOAC08V486Z3zKAAAAAElRU5ErkJggg==";

if (!fs.existsSync(defaultAvatarPath)) {
    fs.writeFileSync(defaultAvatarPath, Buffer.from(whatsappUserBase64, 'base64'));
}
if (!fs.existsSync(defaultGroupPath)) {
    fs.writeFileSync(defaultGroupPath, Buffer.from(whatsappGroupBase64, 'base64'));
}

// Serve static assets out of the /app directory
app.use(express.static(path.join(__dirname, 'app'), { index: false }));
app.use('/uploads', express.static(path.join(__dirname, 'app', 'uploads')));

// Initialize PostgreSQL Tables and Performance Indexes
initDB();

// Bind Modular Authentication Endpoints
app.use('/api', authRoutes);

// --- MULTER STORAGE CONFIGURATIONS ---
const profileStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const uploadProfile = multer({
    storage: profileStorage,
    limits: { fileSize: 2 * 1024 * 1024 }, // Max 2MB
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (mimetype && extname) return cb(null, true);
        cb(new Error('Only system image formats (jpeg, jpg, png, webp) are permitted.'));
    }
});

const chatMediaStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, chatUploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'media-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const uploadChatMediaBulk = multer({
    storage: chatMediaStorage,
    limits: { fileSize: 15 * 1024 * 1024 }, // Max 15MB
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp|mp3|wav|ogg|mpeg|mp4|webm|pdf/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (mimetype && extname) return cb(null, true);
        cb(new Error('Unsupported file extension for conversation transmission.'));
    }
});

// --- AUTHENTICATION MIDDLEWARES ---
function checkAuthSession(req, res, next) {
    if (req.session && req.session.userId) {
        return next();
    }
    res.status(401).json({ error: 'Unauthorized: Session required.' });
}

function checkAdminSession(req, res, next) {
    if (req.session && req.session.isAdmin) {
        return next();
    }
    res.status(403).json({ error: 'Access Denied: Admin privileges required.' });
}

// --- SECURE MULTIMEDIA ATTACHMENTS UPLOAD ROUTE ---
app.post('/api/chat/upload', checkAuthSession, (req, res, next) => {
    uploadChatMediaBulk.array('chatFiles', 10)(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ error: `Upload validation failed: ${err.message}` });
        } else if (err) {
            return res.status(400).json({ error: err.message });
        }
        next();
    });
}, (req, res) => {
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
    if (!room_name || !room_name.trim()) {
        return res.status(400).json({ error: 'Room name is required.' });
    }
    
    const generateCode = () => Math.random().toString(36).substring(2, 7).toUpperCase();
    let roomCode = generateCode();
    
    try {
        let attempts = 0;
        while (attempts < 5) {
            const collisionCheck = await pool.query('SELECT id FROM rooms WHERE room_code = $1', [roomCode]);
            if (collisionCheck.rows.length === 0) break;
            roomCode = generateCode();
            attempts++;
        }

        const result = await pool.query(
            'INSERT INTO rooms (room_name, room_code, room_desc, room_icon, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING id, room_name, room_code, room_desc, room_icon',
            [room_name.trim(), roomCode, (room_desc || '').trim(), '/uploads/default-group.png', req.session.userId]
        );
        
        const dynamicRoom = result.rows[0];
        await pool.query(
            'INSERT INTO room_members (room_id, user_id, is_admin) VALUES ($1, $2, TRUE) ON CONFLICT DO NOTHING',
            [dynamicRoom.id, req.session.userId]
        );

        res.json(dynamicRoom);
    } catch (err) {
        console.error('Group room creation failure:', err);
        res.status(500).json({ error: 'Failed to create group community.' });
    }
});

app.get('/api/rooms/lookup/:code', checkAuthSession, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, room_name, room_code, room_desc, room_icon FROM rooms WHERE room_code = $1', 
            [req.params.code.toUpperCase().trim()]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Invalid room pass code.' });
        }
        
        const TargetRoom = result.rows[0];
        await pool.query(
            'INSERT INTO room_members (room_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [TargetRoom.id, req.session.userId]
        );

        res.json(TargetRoom);
    } catch (err) {
        console.error('Room lookup failure:', err);
        res.status(500).json({ error: 'Failed to query room registries.' });
    }
});

app.get('/api/rooms/joined', checkAuthSession, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                r.id, 
                r.room_name, 
                r.room_code, 
                r.room_desc, 
                r.room_icon, 
                r.created_by, 
                rm.is_admin,
                lm.text as last_message,
                lm.message_type as last_message_type,
                lm.sender_username as last_message_sender,
                lm.timestamp as last_activity,
                COALESCE(unread.unread_count, 0)::int as unread_count
            FROM rooms r
            JOIN room_members rm ON r.id = rm.room_id
            LEFT JOIN (
                SELECT DISTINCT ON (m.room_id)
                    m.room_id, m.text, m.message_type, u.username as sender_username, m.timestamp
                FROM messages m
                JOIN users u ON m.sender_id = u.id
                WHERE m.room_id IS NOT NULL
                ORDER BY m.room_id, m.timestamp DESC
            ) lm ON r.id = lm.room_id
            LEFT JOIN (
                SELECT m.room_id, COUNT(*)::int as unread_count
                FROM messages m
                LEFT JOIN group_message_reads gmr ON m.id = gmr.message_id AND gmr.user_id = $1
                WHERE m.room_id IS NOT NULL AND m.sender_id != $1 AND gmr.id IS NULL
                GROUP BY m.room_id
            ) unread ON r.id = unread.room_id
            WHERE rm.user_id = $1
            ORDER BY COALESCE(lm.timestamp, rm.joined_at) DESC
        `, [req.session.userId]);
        res.json(result.rows);
    } catch (err) {
        console.error('Failed to fetch joined rooms:', err);
        res.status(500).json({ error: 'Failed to fetch joined rooms.' });
    }
});

app.post('/api/rooms/leave', checkAuthSession, async (req, res) => {
    const { roomId } = req.body;
    if (!roomId) return res.status(400).json({ error: 'Room ID parameter is missing.' });
    try {
        await pool.query('DELETE FROM room_members WHERE room_id = $1 AND user_id = $2', [roomId, req.session.userId]);
        io.to(`group_room_${roomId}`).emit('broadcastGroupReadsSynchronized', { roomId });
        res.json({ success: true, message: 'Successfully left the group room.' });
    } catch (err) {
        console.error('Error leaving group:', err);
        res.status(500).json({ error: 'Failed to leave group.' });
    }
});

app.post('/api/rooms/members/remove', checkAuthSession, async (req, res) => {
    const { roomId, targetUserId } = req.body;
    if (!roomId || !targetUserId) {
        return res.status(400).json({ error: 'Missing parameters (roomId, targetUserId).' });
    }
    try {
        const adminCheck = await pool.query('SELECT is_admin FROM room_members WHERE room_id = $1 AND user_id = $2', [roomId, req.session.userId]);
        if (adminCheck.rows.length === 0 || !adminCheck.rows[0].is_admin) {
            return res.status(403).json({ error: 'Forbidden: Only administrators can remove group members.' });
        }

        await pool.query('DELETE FROM room_members WHERE room_id = $1 AND user_id = $2', [roomId, targetUserId]);
        io.emit('userKickedFromRoom', { roomId: parseInt(roomId), userId: parseInt(targetUserId) });

        res.json({ success: true, message: 'Successfully removed user from group.' });
    } catch (err) {
        console.error('Failed to remove member:', err);
        res.status(500).json({ error: 'Failed to execute removal.' });
    }
});

app.post('/api/rooms/members/toggle-admin', checkAuthSession, async (req, res) => {
    const { roomId, targetUserId, isAdmin } = req.body;
    if (!roomId || !targetUserId || isAdmin === undefined) {
        return res.status(400).json({ error: 'Missing parameters (roomId, targetUserId, isAdmin).' });
    }
    try {
        const adminCheck = await pool.query('SELECT is_admin FROM room_members WHERE room_id = $1 AND user_id = $2', [roomId, req.session.userId]);
        if (adminCheck.rows.length === 0 || !adminCheck.rows[0].is_admin) {
            return res.status(403).json({ error: 'Forbidden: Only administrators can adjust credentials.' });
        }

        await pool.query(
            'UPDATE room_members SET is_admin = $3 WHERE room_id = $1 AND user_id = $2', 
            [roomId, targetUserId, isAdmin]
        );

        io.to(`group_room_${roomId}`).emit('broadcastGroupReadsSynchronized', { roomId });
        res.json({ success: true, message: 'Admin state toggled successfully.' });
    } catch (err) {
        console.error('Failed to toggle admin status:', err);
        res.status(500).json({ error: 'Failed to toggle admin status.' });
    }
});

// --- PROFILE MANAGEMENT ENDPOINTS ---
app.get('/api/profile/me', checkAuthSession, async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, username, full_name, bio, COALESCE(profile_pic_url, '/uploads/default-avatar.png') as profile_pic_url FROM users WHERE id = $1", 
            [req.session.userId]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Profile retrieval error:', err);
        res.status(500).json({ error: 'Failed to retrieve profile data.' });
    }
});

app.get('/api/profile/user/:id', checkAuthSession, async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, username, full_name, bio, COALESCE(profile_pic_url, '/uploads/default-avatar.png') as profile_pic_url FROM users WHERE id = $1", 
            [req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Failed to extract user metadata:', err);
        res.status(500).json({ error: 'Failed to extract profile metadata.' });
    }
});

app.put('/api/profile/update-info', checkAuthSession, async (req, res) => {
    const { full_name, bio } = req.body;
    try {
        await pool.query(
            'UPDATE users SET full_name = $1, bio = $2 WHERE id = $3',
            [(full_name || '').trim(), (bio || '').trim(), req.session.userId]
        );
        io.emit('profileUpdated', { userId: req.session.userId, full_name, bio });
        res.json({ success: true, message: 'Profile information updated.' });
    } catch (err) {
        console.error('Failed to update user profile information:', err);
        res.status(500).json({ error: 'Failed to update user profile information.' });
    }
});

app.post('/api/profile/upload-avatar', checkAuthSession, (req, res, next) => {
    uploadProfile.single('avatar')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ error: `Avatar upload validation: ${err.message}` });
        } else if (err) {
            return res.status(400).json({ error: err.message });
        }
        next();
    });
}, async (req, res) => {
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
        console.error('Failed to update avatar:', err);
        res.status(500).json({ error: 'Failed to update avatar image.' });
    }
});

app.put('/api/profile/update-credentials', checkAuthSession, async (req, res) => {
    const { username, password } = req.body;
    if (!username || !username.trim()) {
        return res.status(400).json({ error: 'Username cannot be empty.' });
    }
    const normalizedUsername = username.trim();
    if (normalizedUsername.length < 3 || normalizedUsername.length > 50) {
        return res.status(400).json({ error: 'Username must be between 3 and 50 characters.' });
    }

    try {
        const collisionCheck = await pool.query(
            'SELECT id FROM users WHERE username = $1 AND id != $2', 
            [normalizedUsername, req.session.userId]
        );
        if (collisionCheck.rows.length > 0) {
            return res.status(400).json({ error: 'The selected username is already taken.' });
        }

        if (password && password.trim() !== "") {
            if (password.length < 6) {
                return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
            }
            const hashedPassword = await bcrypt.hash(password, 10);
            await pool.query(
                'UPDATE users SET username = $1, password = $2 WHERE id = $3',
                [normalizedUsername, hashedPassword, req.session.userId]
            );
        } else {
            await pool.query('UPDATE users SET username = $1 WHERE id = $2', [normalizedUsername, req.session.userId]);
        }

        req.session.username = normalizedUsername;
        io.emit('profileUpdated', { userId: req.session.userId, username: normalizedUsername });
        res.json({ success: true, message: 'Account credentials updated successfully.' });
    } catch (err) {
        console.error('Credentials update error:', err);
        res.status(500).json({ error: 'Failed to update security credentials.' });
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

app.get('/developer', (req, res) => {
    res.sendFile(path.join(__dirname, 'app', 'developer.html'));
});

app.get('/faq', (req, res) => {
    res.sendFile(path.join(__dirname, 'app', 'faq.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'app', 'admin.html'));
});

app.get('/api/session-user', (req, res) => {
    if (req.session && req.session.username) {
        res.json({ id: req.session.userId, username: req.session.username });
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
});

// --- CHATS & MESSAGES API ---
app.get('/api/chats/active', checkAuthSession, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                u.id, 
                u.username, 
                u.full_name,
                COALESCE(u.profile_pic_url, '/uploads/default-avatar.png') as profile_pic_url,
                lm.text as last_message,
                lm.message_type as last_message_type,
                lm.sender_id as last_message_sender_id,
                lm.timestamp as last_activity,
                COALESCE(unread.unread_count, 0)::int as unread_count
            FROM users u
            JOIN (
                SELECT DISTINCT ON (partner_id) 
                    partner_id, id, text, message_type, sender_id, timestamp
                FROM (
                    SELECT 
                        CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END as partner_id,
                        id, text, message_type, sender_id, timestamp
                    FROM messages
                    WHERE room_id IS NULL AND (sender_id = $1 OR receiver_id = $1)
                ) m_sub
                ORDER BY partner_id, timestamp DESC
            ) lm ON u.id = lm.partner_id
            LEFT JOIN (
                SELECT sender_id, COUNT(*)::int as unread_count
                FROM messages
                WHERE receiver_id = $1 AND room_id IS NULL AND isread = FALSE
                GROUP BY sender_id
            ) unread ON u.id = unread.sender_id
            ORDER BY lm.timestamp DESC
        `, [req.session.userId]);
        res.json(result.rows);
    } catch (err) {
        console.error('Active chats query error:', err);
        res.status(500).json([]);
    }
});

app.get('/api/users/search', checkAuthSession, async (req, res) => {
    const query = (req.query.q || '').trim();
    if (!query) return res.json([]);
    try {
        const result = await pool.query(
            "SELECT id, username, full_name, COALESCE(profile_pic_url, '/uploads/default-avatar.png') as profile_pic_url FROM users WHERE (username ILIKE $1 OR full_name ILIKE $1) AND id != $2 LIMIT 10",
            [`%${query}%`, req.session.userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('User search error:', err);
        res.status(500).json([]);
    }
});

app.post('/api/messages/star-toggle', checkAuthSession, async (req, res) => {
    const userId = req.session.userId;
    const { messageId } = req.body;

    if (!messageId) return res.status(400).json({ error: 'Message ID is required.' });

    try {
        const existing = await pool.query('SELECT id FROM starred_messages WHERE user_id = $1 AND message_id = $2', [userId, messageId]);
        if (existing.rows.length > 0) {
            await pool.query('DELETE FROM starred_messages WHERE user_id = $1 AND message_id = $2', [userId, messageId]);
            return res.json({ success: true, isStarred: false, messageId });
        } else {
            await pool.query('INSERT INTO starred_messages (user_id, message_id) VALUES ($1, $2)', [userId, messageId]);
            return res.json({ success: true, isStarred: true, messageId });
        }
    } catch (err) {
        console.error('Star toggle error:', err);
        res.status(500).json({ error: 'Failed to toggle message star.' });
    }
});

app.get('/api/messages/starred', checkAuthSession, async (req, res) => {
    const userId = req.session.userId;
    try {
        const result = await pool.query(`
            SELECT sm.id as star_id, sm.starred_at, m.id as message_id, m.text, m.timestamp, m.message_type, m.file_url, m.sender_id, m.receiver_id, m.room_id,
                   u.username as sender_username, COALESCE(u.profile_pic_url, '/uploads/default-avatar.png') as sender_avatar,
                   r.room_name, r.room_code, r.room_desc, r.room_icon,
                   tu.id as target_user_id, tu.username as target_username, COALESCE(tu.profile_pic_url, '/uploads/default-avatar.png') as target_avatar
            FROM starred_messages sm
            JOIN messages m ON sm.message_id = m.id
            JOIN users u ON m.sender_id = u.id
            LEFT JOIN rooms r ON m.room_id = r.id
            LEFT JOIN users tu ON tu.id = (CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END)
            WHERE sm.user_id = $1
            ORDER BY sm.starred_at DESC
        `, [userId]);
        res.json(result.rows);
    } catch (err) {
        console.error('Starred messages error:', err);
        res.status(500).json([]);
    }
});

app.post('/api/messages/report', checkAuthSession, async (req, res) => {
    const { messageId, reason } = req.body;
    if (!messageId || !reason || !reason.trim()) {
        return res.status(400).json({ error: 'Message ID and report reason description are required.' });
    }
    try {
        const reporterId = req.session.userId;
        const msgCheck = await pool.query('SELECT id, sender_id FROM messages WHERE id = $1', [messageId]);
        if (msgCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Target message not found.' });
        }
        if (msgCheck.rows[0].sender_id === reporterId) {
            return res.status(400).json({ error: 'Self-reporting is not allowed. You cannot report your own message.' });
        }
        await pool.query(
            'INSERT INTO message_reports (message_id, reporter_id, reason) VALUES ($1, $2, $3)',
            [messageId, reporterId, reason.trim()]
        );
        io.emit('newReportCreated', { messageId, reporterId });
        res.json({ success: true, message: 'Message reported successfully to system administrators.' });
    } catch (err) {
        console.error('Error recording message report:', err);
        res.status(500).json({ error: 'Failed to record message report.' });
    }
});

// --- AI CHAT SUMMARIZATION PIPELINE (GROQ CLOUD AI) ---
app.post('/api/chat/summarize', checkAuthSession, async (req, res) => {
    const { targetUserId, targetRoomId } = req.body;
    const currentUserId = req.session.userId;

    if (!targetUserId && !targetRoomId) {
        return res.status(400).json({ error: 'Missing target conversation parameters (targetUserId or targetRoomId).' });
    }

    try {
        let messages = [];
        let chatTitle = 'Chat Conversation';

        if (targetRoomId) {
            // Verify group membership
            const memberCheck = await pool.query('SELECT 1 FROM room_members WHERE room_id = $1 AND user_id = $2', [targetRoomId, currentUserId]);
            if (memberCheck.rows.length === 0) {
                return res.status(403).json({ error: 'Access denied: You are not a member of this community room.' });
            }

            const roomRes = await pool.query('SELECT room_name FROM rooms WHERE id = $1', [targetRoomId]);
            if (roomRes.rows.length > 0) {
                chatTitle = `Group: ${roomRes.rows[0].room_name}`;
            }

            const msgsRes = await pool.query(`
                SELECT m.id, m.text, m.message_type, m.file_url, m.is_deleted, m.timestamp, u.username
                FROM messages m
                JOIN users u ON m.sender_id = u.id
                WHERE m.room_id = $1
                ORDER BY m.timestamp DESC
                LIMIT 50
            `, [targetRoomId]);
            messages = msgsRes.rows.reverse();
        } else if (targetUserId) {
            const userRes = await pool.query('SELECT username FROM users WHERE id = $1', [targetUserId]);
            if (userRes.rows.length > 0) {
                chatTitle = `Direct Chat with @${userRes.rows[0].username}`;
            }

            const msgsRes = await pool.query(`
                SELECT m.id, m.text, m.message_type, m.file_url, m.is_deleted, m.timestamp, u.username
                FROM messages m
                JOIN users u ON m.sender_id = u.id
                WHERE m.room_id IS NULL AND (
                    (m.sender_id = $1 AND m.receiver_id = $2) OR
                    (m.sender_id = $2 AND m.receiver_id = $1)
                )
                ORDER BY m.timestamp DESC
                LIMIT 50
            `, [currentUserId, targetUserId]);
            messages = msgsRes.rows.reverse();
        }

        const validMessages = messages.filter(m => !m.is_deleted);
        if (validMessages.length < 2) {
            return res.status(400).json({ 
                error: 'Not enough conversation messages to summarize yet. Please exchange a few messages first!' 
            });
        }

        // Build transcript string
        const transcript = validMessages.map(m => {
            const time = new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            let content = m.text || '';
            if (m.message_type === 'image') content = `[Sent Image: ${m.text || 'Photo'}]`;
            else if (m.message_type === 'audio') content = `[Sent Voice Note / Audio]`;
            else if (m.message_type === 'video') content = `[Sent Video Clip]`;
            else if (m.message_type === 'pdf') content = `[Sent Document / PDF: ${m.text || 'File'}]`;
            return `[${time}] ${m.username}: ${content}`;
        }).join('\n');

        const groqApiKey = process.env.GROQ_API_KEY;
        if (!groqApiKey || !groqApiKey.trim()) {
            return res.status(400).json({
                error: 'Groq API Key not found. Please add your free key to GROQ_API_KEY in the .env file (obtainable instantly for free at https://console.groq.com).'
            });
        }

        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${groqApiKey.trim()}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: 'system',
                        content: `You are a direct, concise conversation summarizer.
Your task is to summarize ALL the messages provided in the chat transcript accurately and comprehensively.

CRITICAL INSTRUCTIONS:
- Include ONLY the summarized points of the messages.
- Do NOT include any conversational filler, greetings, preambles (such as "Here is the summary:", "Sure! Here is a breakdown:"), meta-commentary, or closing notes.
- Ensure every significant topic or update discussed across all messages is included in the summary.
- Format strictly as clean bullet points:

### 📌 Summary of Conversation
- Bullet points summarizing all discussion points and information exchanged across the messages.

### 📋 Key Decisions & Action Items
- Bullet points for any decisions, agreements, or tasks (omit this section if none exist).

Start directly with the summary points and nothing else.`
                    },
                    {
                        role: 'user',
                        content: `Summarize all messages from this transcript:\n\n${transcript}`
                    }
                ],
                temperature: 0.2,
                max_tokens: 800
            })
        });

        if (!groqResponse.ok) {
            const errBody = await groqResponse.text();
            console.error('Groq API Error Response:', errBody);
            let errMsg = 'Failed to generate summary with Groq AI.';
            try {
                const parsed = JSON.parse(errBody);
                if (parsed.error && parsed.error.message) errMsg = parsed.error.message;
            } catch (e) {}
            return res.status(500).json({ error: errMsg });
        }

        const groqData = await groqResponse.json();
        const summaryText = groqData.choices && groqData.choices[0] && groqData.choices[0].message
            ? groqData.choices[0].message.content
            : 'No summary could be generated.';

        res.json({
            success: true,
            summary: summaryText,
            messageCount: validMessages.length,
            chatTitle
        });
    } catch (err) {
        console.error('Error generating chat summary:', err);
        res.status(500).json({ error: 'Server error while processing AI chat summary.' });
    }
});

// --- GLOBAL LIVE DICTIONARY TRACKING SYSTEM ---
const connectedUsersMap = new Map(); // userId -> Set of socketIds

// --- ADVANCED SECURE WEB_SOCKET LAYER ---
io.on('connection', (socket) => {

    socket.on('declareIdentity', async ({ userId }) => {
        if (!userId) return;
        socket.userId = parseInt(userId, 10);
        socket.join(`user_${socket.userId}`);
        if (!connectedUsersMap.has(socket.userId)) {
            connectedUsersMap.set(socket.userId, new Set());
        }
        connectedUsersMap.get(socket.userId).add(socket.id);
        io.emit('networkIdentityStatusChange', { userId: socket.userId, status: 'online' });

        // Auto-join all community group rooms for real-time delivery and live unread counts
        try {
            const groupRoomsRes = await pool.query('SELECT room_id FROM room_members WHERE user_id = $1', [socket.userId]);
            groupRoomsRes.rows.forEach(r => {
                socket.join(`group_room_${r.room_id}`);
            });
        } catch (e) {
            console.error('Error auto-joining socket group rooms:', e);
        }
    });

    socket.on('requestUserOnlineStatus', ({ targetUserId }, callback) => {
        const parsedTargetId = parseInt(targetUserId, 10);
        const status = connectedUsersMap.has(parsedTargetId) && connectedUsersMap.get(parsedTargetId).size > 0 ? 'online' : 'offline';
        if (callback) callback({ status });
    });

    socket.on('fetchGroupOnlineRoster', async ({ roomId }, callback) => {
        try {
            const result = await pool.query(`
                SELECT u.id, u.username, COALESCE(u.profile_pic_url, '/uploads/default-avatar.png') as profile_pic_url, rm.is_admin
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
                    status: isOnline ? 'online' : 'offline',
                    is_admin: user.is_admin
                };
            });

            if (callback) callback(dynamicRoster);
        } catch (err) {
            console.error('Error computing dynamic group tracking registry:', err);
            if (callback) callback([]);
        }
    });

    socket.on('joinRoom', async ({ currentUserId, targetUserId }) => {
        const curId = parseInt(currentUserId || socket.userId, 10);
        const tgtId = parseInt(targetUserId, 10);
        if (!curId || !tgtId) return;

        const roomName = `chat_${Math.min(curId, tgtId)}_${Math.max(curId, tgtId)}`;
        
        socket.rooms.forEach(room => { 
            if (room !== socket.id && !room.startsWith('user_') && !room.startsWith('group_room_')) {
                socket.leave(room);
            }
        });
        socket.join(roomName);

        try {
            // Batch update all unread messages from target partner to current user
            const updateRes = await pool.query(`
                UPDATE messages 
                SET isread = TRUE, read_at = NOW() 
                WHERE sender_id = $1 AND receiver_id = $2 AND isread = FALSE AND room_id IS NULL
                RETURNING id
            `, [tgtId, curId]);

            if (updateRes.rows.length > 0) {
                updateRes.rows.forEach(r => {
                    io.to(roomName).emit('messageReadUpdate', r.id);
                    io.to(`user_${tgtId}`).emit('messageReadUpdate', r.id);
                });
            }

            const result = await pool.query(`
                SELECT m.id as _id, m.text, m.timestamp, m.isread as "isRead", 
                       u.username as username, m.sender_id, m.message_type, m.file_url, m.is_deleted, m.is_edited,
                       COALESCE(u.profile_pic_url, '/uploads/default-avatar.png') as profile_pic_url,
                       m.reply_to_message_id,
                       p.text as reply_to_text,
                       pu.username as reply_to_username,
                       p.is_deleted as reply_to_is_deleted,
                       m.read_at,
                       ((SELECT COUNT(*) FROM starred_messages sm WHERE sm.message_id = m.id AND sm.user_id = $1) > 0) AS "isStarred",
                       (
                           SELECT COALESCE(json_object_agg(eg.emoji, eg.users), '{}'::json)
                           FROM (
                                SELECT mr.emoji, json_agg(u2.username) as users
                                FROM message_reactions mr
                                JOIN users u2 ON mr.user_id = u2.id
                                WHERE mr.message_id = m.id
                                GROUP BY mr.emoji
                           ) eg
                       ) as reactions
                FROM messages m
                JOIN users u ON m.sender_id = u.id
                LEFT JOIN messages p ON m.reply_to_message_id = p.id
                LEFT JOIN users pu ON p.sender_id = pu.id
                WHERE ((m.sender_id = $1 AND m.receiver_id = $2) 
                   OR (m.sender_id = $2 AND m.receiver_id = $1)) AND m.room_id IS NULL
                ORDER BY m.timestamp ASC LIMIT 100
            `, [curId, tgtId]);

            socket.emit('chatHistory', result.rows);
        } catch (err) {
            console.error('Error gathering private room thread history:', err);
        }
    });

    socket.on('privateMessage', async ({ receiver_id, text, message_type, file_url, reply_to_message_id }) => {
        const sender_id = socket.userId;
        const receiverIdParsed = parseInt(receiver_id, 10);
        if (!sender_id || !receiverIdParsed) return;

        const roomName = `chat_${Math.min(sender_id, receiverIdParsed)}_${Math.max(sender_id, receiverIdParsed)}`;
        const type = message_type || 'text';
        const url = file_url || null;
        const parentId = reply_to_message_id || null;
        try {
            const result = await pool.query(`
                INSERT INTO messages (sender_id, receiver_id, text, message_type, file_url, reply_to_message_id) 
                VALUES ($1, $2, $3, $4, $5, $6) 
                RETURNING id as _id, text, timestamp, isread as "isRead", message_type, file_url, is_deleted, reply_to_message_id, read_at
            `, [sender_id, receiverIdParsed, text, type, url, parentId]);

            const userResult = await pool.query("SELECT username, COALESCE(profile_pic_url, '/uploads/default-avatar.png') as profile_pic_url FROM users WHERE id = $1", [sender_id]);

            let parentMsg = null;
            if (parentId) {
                const parentRes = await pool.query(
                    "SELECT m.text, u.username, m.is_deleted FROM messages m JOIN users u ON m.sender_id = u.id WHERE m.id = $1", 
                    [parentId]
                );
                if (parentRes.rows.length > 0) {
                    parentMsg = parentRes.rows[0];
                }
            }

            const payload = {
                ...result.rows[0],
                sender_id,
                receiver_id: receiverIdParsed,
                username: userResult.rows[0].username,
                profile_pic_url: userResult.rows[0].profile_pic_url,
                reply_to_text: parentMsg ? parentMsg.text : null,
                reply_to_username: parentMsg ? parentMsg.username : null,
                reply_to_is_deleted: parentMsg ? parentMsg.is_deleted : false,
                reactions: {}
            };

            // Emit to direct chat room and both users' personal rooms for real-time inbox updates
            io.to(roomName).emit('message', payload);
            io.to(`user_${receiverIdParsed}`).emit('message', payload);
            io.to(`user_${sender_id}`).emit('message', payload);
        } catch (err) {
            console.error('Failed to execute private message insert:', err);
        }
    });

    socket.on('joinGroupRoom', async ({ roomId }) => {
        const userId = socket.userId;
        const roomIdParsed = parseInt(roomId, 10);
        if (!roomIdParsed) return;

        // Verify membership in room_members table
        if (userId) {
            const memberCheck = await pool.query('SELECT 1 FROM room_members WHERE room_id = $1 AND user_id = $2', [roomIdParsed, userId]);
            if (memberCheck.rows.length === 0) {
                // Auto-enroll if missing
                await pool.query('INSERT INTO room_members (room_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [roomIdParsed, userId]);
            }
        }

        const roomName = `group_room_${roomIdParsed}`;
        socket.join(roomName);

        try {
            // Track individual group message reads first so counts are accurate in history
            if (userId) {
                await pool.query(`
                    INSERT INTO group_message_reads (message_id, user_id)
                    SELECT id, $1 FROM messages WHERE room_id = $2 AND sender_id != $1
                    ON CONFLICT DO NOTHING
                `, [userId, roomIdParsed]);
                
                io.to(roomName).emit('broadcastGroupReadsSynchronized', { roomId: roomIdParsed });
            }

            const result = await pool.query(`
                SELECT m.id as _id, m.text, m.timestamp, m.isread as "isRead", 
                       u.username as username, m.sender_id, m.message_type, m.file_url, m.is_deleted, m.is_edited,
                       COALESCE(u.profile_pic_url, '/uploads/default-avatar.png') as profile_pic_url,
                       m.reply_to_message_id,
                       p.text as reply_to_text,
                       pu.username as reply_to_username,
                       p.is_deleted as reply_to_is_deleted,
                       m.read_at,
                       (SELECT COUNT(*)::int FROM group_message_reads gmr WHERE gmr.message_id = m.id) AS "seen_count",
                       ((SELECT COUNT(*) FROM starred_messages sm WHERE sm.message_id = m.id AND sm.user_id = $2) > 0) AS "isStarred",
                       (
                           SELECT COALESCE(json_object_agg(eg.emoji, eg.users), '{}'::json)
                           FROM (
                                SELECT mr.emoji, json_agg(u2.username) as users
                                FROM message_reactions mr
                                JOIN users u2 ON mr.user_id = u2.id
                                WHERE mr.message_id = m.id
                                GROUP BY mr.emoji
                           ) eg
                       ) as reactions
                FROM messages m
                JOIN users u ON m.sender_id = u.id
                LEFT JOIN messages p ON m.reply_to_message_id = p.id
                LEFT JOIN users pu ON p.sender_id = pu.id
                WHERE m.room_id = $1
                ORDER BY m.timestamp ASC LIMIT 100
            `, [roomIdParsed, userId || 0]);

            socket.emit('chatHistory', result.rows);
        } catch (err) {
            console.error('Failed processing group history lookup:', err);
        }
    });

    socket.on('groupMessage', async ({ room_id, text, message_type, file_url, reply_to_message_id }) => {
        const sender_id = socket.userId;
        const roomIdParsed = parseInt(room_id, 10);
        if (!sender_id || !roomIdParsed) return;

        // Verify membership
        const memberCheck = await pool.query('SELECT 1 FROM room_members WHERE room_id = $1 AND user_id = $2', [roomIdParsed, sender_id]);
        if (memberCheck.rows.length === 0) return;

        const roomName = `group_room_${roomIdParsed}`;
        const type = message_type || 'text';
        const url = file_url || null;
        const parentId = reply_to_message_id || null;
        try {
            const result = await pool.query(`
                INSERT INTO messages (sender_id, room_id, text, message_type, file_url, reply_to_message_id) 
                VALUES ($1, $2, $3, $4, $5, $6) 
                RETURNING id as _id, text, timestamp, isread as "isRead", message_type, file_url, room_id, is_deleted, reply_to_message_id, read_at
            `, [sender_id, roomIdParsed, text, type, url, parentId]);

            const targetMessageId = result.rows[0]._id;
            const userResult = await pool.query("SELECT username, COALESCE(profile_pic_url, '/uploads/default-avatar.png') as profile_pic_url FROM users WHERE id = $1", [sender_id]);

            let room_name = 'Group';
            try {
                const rRes = await pool.query('SELECT room_name FROM rooms WHERE id = $1', [roomIdParsed]);
                if (rRes.rows.length > 0) room_name = rRes.rows[0].room_name;
            } catch (e) {}

            // Auto log reads for other sockets currently in the room (excluding sender)
            const activeRoomSockets = io.sockets.adapter.rooms.get(roomName) || new Set();
            let initialSeenCount = 0;
            for (const sockId of activeRoomSockets) {
                const clientSock = io.sockets.sockets.get(sockId);
                if (clientSock && clientSock.userId && clientSock.userId !== sender_id) {
                    await pool.query(`
                        INSERT INTO group_message_reads (message_id, user_id) 
                        VALUES ($1, $2) ON CONFLICT DO NOTHING
                    `, [targetMessageId, clientSock.userId]);
                    initialSeenCount++;
                }
            }

            let parentMsg = null;
            if (parentId) {
                const parentRes = await pool.query(
                    "SELECT m.text, u.username, m.is_deleted FROM messages m JOIN users u ON m.sender_id = u.id WHERE m.id = $1", 
                    [parentId]
                );
                if (parentRes.rows.length > 0) {
                    parentMsg = parentRes.rows[0];
                }
            }

            const payload = {
                ...result.rows[0],
                sender_id,
                room_name,
                seen_count: initialSeenCount,
                username: userResult.rows[0].username,
                profile_pic_url: userResult.rows[0].profile_pic_url,
                reply_to_text: parentMsg ? parentMsg.text : null,
                reply_to_username: parentMsg ? parentMsg.username : null,
                reply_to_is_deleted: parentMsg ? parentMsg.is_deleted : false,
                reactions: {}
            };

            io.to(roomName).emit('message', payload);
        } catch (err) {
            console.error('Group message insertion failure:', err);
        }
    });

    socket.on('markAsRead', async (messageId) => {
        try {
            const msgCheck = await pool.query('SELECT sender_id, receiver_id FROM messages WHERE id = $1', [messageId]);
            if (msgCheck.rows.length === 0) return;
            const msg = msgCheck.rows[0];

            await pool.query('UPDATE messages SET isread = TRUE, read_at = NOW() WHERE id = $1 AND isread = FALSE', [messageId]);
            
            const chatRoomName = `chat_${Math.min(msg.sender_id, msg.receiver_id)}_${Math.max(msg.sender_id, msg.receiver_id)}`;
            io.to(chatRoomName).emit('messageReadUpdate', messageId);
        } catch (err) {
            console.error('Failed to update message read receipt:', err);
        }
    });

    socket.on('fetchPrivateMessageReadReceipt', async ({ messageId }, callback) => {
        try {
            const result = await pool.query('SELECT timestamp as sent_at, read_at, isread FROM messages WHERE id = $1', [messageId]);
            if (callback) callback(result.rows.length > 0 ? result.rows[0] : null);
        } catch (err) {
            console.error('Failed to fetch private message receipt:', err);
            if (callback) callback(null);
        }
    });

    socket.on('explicitMarkGroupMessageAsRead', async ({ messageId, userId, roomId }) => {
        try {
            const uId = userId || socket.userId;
            if (!uId || !messageId) return;

            // Don't mark own message as read
            const msgCheck = await pool.query('SELECT sender_id FROM messages WHERE id = $1', [messageId]);
            if (msgCheck.rows.length > 0 && msgCheck.rows[0].sender_id === uId) return;

            await pool.query(`
                INSERT INTO group_message_reads (message_id, user_id) 
                VALUES ($1, $2) ON CONFLICT DO NOTHING
            `, [messageId, uId]);
            io.to(`group_room_${roomId}`).emit('broadcastGroupReadsSynchronized', { roomId });
        } catch (err) {
            console.error('Error marking group message read:', err);
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

    socket.on('typing', ({ sender_id, sender_username, receiver_id, room_id, isTyping }) => {
        const userId = socket.userId || sender_id;
        if (room_id) {
            socket.to(`group_room_${room_id}`).emit('userTyping', { userId, username: sender_username, roomId: room_id, isTyping });
        } else if (receiver_id) {
            const chatRoomName = `chat_${Math.min(userId, receiver_id)}_${Math.max(userId, receiver_id)}`;
            socket.to(chatRoomName).emit('userTyping', { userId, username: sender_username, isTyping });
        }
    });

    socket.on('messageReaction', async ({ messageId, emoji, roomId, receiverId }) => {
        try {
            const userId = socket.userId;
            if (!userId || !messageId || !emoji) return;

            const checkRes = await pool.query('SELECT emoji FROM message_reactions WHERE message_id = $1 AND user_id = $2', [messageId, userId]);
            
            if (checkRes.rows.length > 0) {
                if (checkRes.rows[0].emoji === emoji) {
                    await pool.query('DELETE FROM message_reactions WHERE message_id = $1 AND user_id = $2', [messageId, userId]);
                } else {
                    await pool.query('UPDATE message_reactions SET emoji = $3 WHERE message_id = $1 AND user_id = $2', [messageId, userId, emoji]);
                }
            } else {
                await pool.query('INSERT INTO message_reactions (message_id, user_id, emoji) VALUES ($1, $2, $3)', [messageId, userId, emoji]);
            }

            const reactionMapRes = await pool.query(`
                SELECT mr.emoji, json_agg(u.username) as users
                FROM message_reactions mr
                JOIN users u ON mr.user_id = u.id
                WHERE mr.message_id = $1
                GROUP BY mr.emoji
            `, [messageId]);

            const reactions = {};
            reactionMapRes.rows.forEach(row => {
                reactions[row.emoji] = row.users;
            });

            if (roomId) {
                io.to(`group_room_${roomId}`).emit('reactionUpdated', { messageId, reactions });
            } else if (receiverId) {
                const chatRoomName = `chat_${Math.min(userId, receiverId)}_${Math.max(userId, receiverId)}`;
                io.to(chatRoomName).emit('reactionUpdated', { messageId, reactions });
            }
        } catch (err) {
            console.error('Failed to handle reaction event:', err);
        }
    });

    socket.on('editMessage', async ({ messageId, text }) => {
        try {
            const userId = socket.userId;
            if (!userId || !text || !text.trim()) return;

            const messageRes = await pool.query(
                'SELECT sender_id, receiver_id, room_id, is_deleted FROM messages WHERE id = $1',
                [messageId]
            );

            if (messageRes.rows.length === 0) return;
            const message = messageRes.rows[0];

            if (parseInt(userId, 10) !== message.sender_id) {
                console.error(`Unauthorized edit attempt by user ${userId} on message ${messageId}`);
                return;
            }

            if (message.is_deleted) return;

            await pool.query(
                'UPDATE messages SET text = $1, is_edited = TRUE WHERE id = $2',
                [text.trim(), messageId]
            );

            const payload = { messageId, newText: text.trim() };
            if (message.room_id) {
                io.to(`group_room_${message.room_id}`).emit('messageEdited', payload);
            } else {
                const chatRoomName = `chat_${Math.min(userId, message.receiver_id)}_${Math.max(userId, message.receiver_id)}`;
                io.to(chatRoomName).emit('messageEdited', payload);
            }
        } catch (err) {
            console.error('Failed to handle editMessage event:', err);
        }
    });

    socket.on('deleteMessage', async ({ messageId }) => {
        try {
            const parsedMessageId = parseInt(messageId, 10);
            if (isNaN(parsedMessageId)) return;

            const messageRes = await pool.query(
                'SELECT sender_id, receiver_id, room_id FROM messages WHERE id = $1',
                [parsedMessageId]
            );

            if (messageRes.rows.length === 0) return;
            const message = messageRes.rows[0];

            // Verify ownership
            if (parseInt(socket.userId, 10) !== message.sender_id) {
                console.error(`Unauthorized delete attempt by user ${socket.userId} on message ${parsedMessageId}`);
                return;
            }

            await pool.query(
                "UPDATE messages SET is_deleted = TRUE, text = 'This message was deleted' WHERE id = $1",
                [parsedMessageId]
            );

            const payload = { messageId: parsedMessageId };
            if (message.room_id) {
                io.to(`group_room_${message.room_id}`).emit('messageDeleted', payload);
            } else {
                const chatRoomName = `chat_${Math.min(message.sender_id, message.receiver_id)}_${Math.max(message.sender_id, message.receiver_id)}`;
                io.to(chatRoomName).emit('messageDeleted', payload);
            }
        } catch (err) {
            console.error('Failed to handle deleteMessage event:', err);
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

// --- ADMINISTRATIVE SECURITY & CONTROL PIPELINE ---

// Admin Session Verification
app.post('/api/admin/verify', (req, res) => {
    const { username, password } = req.body;
    const expectedAdmin = process.env.ADMIN_USER || 'admin';
    const expectedPass = process.env.ADMIN_PASS || 'admin123';

    if (username === expectedAdmin && password === expectedPass) {
        req.session.isAdmin = true;
        req.session.adminUser = username;
        return res.json({ success: true, message: 'Administrative authentication verified.' });
    }
    res.status(401).send('Access Denied: Invalid Administrative Credentials.');
});

app.get('/api/admin/check-auth', (req, res) => {
    if (req.session && req.session.isAdmin) {
        return res.json({ isAuthenticated: true, username: req.session.adminUser || 'admin' });
    }
    res.json({ isAuthenticated: false });
});

app.post('/api/admin/logout', (req, res) => {
    if (req.session) {
        req.session.isAdmin = false;
        req.session.adminUser = null;
    }
    res.json({ success: true, message: 'Logged out of admin console.' });
});

// Dynamic Admin Metrics
app.get('/api/admin/metrics', checkAdminSession, async (req, res) => {
    try {
        const userCountRes = await pool.query('SELECT COUNT(*) FROM users');
        const roomCountRes = await pool.query('SELECT COUNT(*) FROM rooms');
        const messageCountRes = await pool.query('SELECT COUNT(*) FROM messages');
        const reportCountRes = await pool.query('SELECT COUNT(*) FROM message_reports');
        const pendingReportCountRes = await pool.query("SELECT COUNT(*) FROM message_reports WHERE status = 'pending'");
        
        const usersListRes = await pool.query('SELECT id, username, full_name, bio FROM users ORDER BY id DESC LIMIT 50');
        const roomsListRes = await pool.query('SELECT id, room_name, room_code, room_desc, created_by FROM rooms ORDER BY id DESC LIMIT 50');

        res.json({
            counters: {
                userCount: userCountRes.rows[0].count,
                roomCount: roomCountRes.rows[0].count,
                messageCount: messageCountRes.rows[0].count,
                reportCount: reportCountRes.rows[0].count,
                pendingReportCount: pendingReportCountRes.rows[0].count
            },
            users: usersListRes.rows,
            rooms: roomsListRes.rows
        });
    } catch (err) {
        console.error('Admin metrics calculation crash:', err);
        res.status(500).json({ error: 'Administrative dashboard analytics failure.' });
    }
});

app.post('/api/admin/users/:id/flag', checkAdminSession, async (req, res) => {
    const targetedUserId = req.params.id;
    try {
        await pool.query(
            "UPDATE users SET bio = '⚠️ This profile content description is undergoing review by system administrative safety officers.' WHERE id = $1", 
            [targetedUserId]
        );
        
        io.emit('profileUpdated', { userId: targetedUserId, bio: '⚠️ Undergoing review.' });
        res.sendStatus(200);
    } catch (err) {
        console.error('Error flagging user bio:', err);
        res.status(500).send('Database mutation action sequence conflict.');
    }
});

app.delete('/api/admin/users/:id', checkAdminSession, async (req, res) => {
    const targetedUserId = req.params.id;
    try {
        await pool.query('DELETE FROM users WHERE id = $1', [targetedUserId]);
        io.emit('userModerated', { userId: targetedUserId, action: 'deleted' });
        res.sendStatus(200);
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).send('User deletion failed.');
    }
});

app.delete('/api/admin/rooms/:id', checkAdminSession, async (req, res) => {
    const targetedRoomId = req.params.id;
    try {
        await pool.query('DELETE FROM rooms WHERE id = $1', [targetedRoomId]);
        io.emit('roomDeleted', { roomId: parseInt(targetedRoomId, 10) });
        io.emit('userKickedFromRoom', { roomId: parseInt(targetedRoomId, 10), userId: null });
        res.sendStatus(200);
    } catch (err) {
        console.error('Error deleting room:', err);
        res.status(500).send('Room deletion failed.');
    }
});

app.post('/api/admin/users/:id/reset-password', checkAdminSession, async (req, res) => {
    const targetedUserId = req.params.id;
    try {
        const defaultHashedPassword = await bcrypt.hash('reset123', 10);
        await pool.query('UPDATE users SET password = $1 WHERE id = $2', [defaultHashedPassword, targetedUserId]);
        res.status(200).send('Password reset to default "reset123" successfully.');
    } catch (err) {
        console.error('Error resetting password:', err);
        res.status(500).send('Password reset failed.');
    }
});

app.get('/api/admin/reports', checkAdminSession, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                mr.id as report_id,
                mr.message_id,
                mr.reason,
                mr.status,
                mr.reported_at,
                rep.id as reporter_id,
                rep.username as reporter_username,
                rep.email as reporter_email,
                snd.id as sender_id,
                snd.username as sender_username,
                snd.email as sender_email,
                m.text as message_text,
                m.message_type,
                m.file_url,
                m.is_deleted,
                m.timestamp as message_timestamp,
                m.room_id
            FROM message_reports mr
            LEFT JOIN users rep ON mr.reporter_id = rep.id
            LEFT JOIN messages m ON mr.message_id = m.id
            LEFT JOIN users snd ON m.sender_id = snd.id
            ORDER BY mr.reported_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching admin reports:', err);
        res.status(500).json({ error: 'Failed to fetch message reports.' });
    }
});

app.post('/api/admin/reports/:id/action', checkAdminSession, async (req, res) => {
    const reportId = req.params.id;
    const { action } = req.body;
    try {
        const reportRes = await pool.query('SELECT mr.*, m.sender_id FROM message_reports mr LEFT JOIN messages m ON mr.message_id = m.id WHERE mr.id = $1', [reportId]);
        if (reportRes.rows.length === 0) {
            return res.status(404).json({ error: 'Report record not found.' });
        }
        const report = reportRes.rows[0];

        if (action === 'delete_message' && report.message_id) {
            await pool.query(
                "UPDATE messages SET is_deleted = TRUE, text = 'This message was deleted by system admin' WHERE id = $1",
                [report.message_id]
            );
            await pool.query("UPDATE message_reports SET status = 'resolved' WHERE id = $1", [reportId]);
            io.emit('messageDeleted', { messageId: report.message_id });
        } else if (action === 'flag_sender' && report.sender_id) {
            await pool.query(
                "UPDATE users SET bio = '⚠️ Profile content under review by system admin.' WHERE id = $1",
                [report.sender_id]
            );
            await pool.query("UPDATE message_reports SET status = 'resolved' WHERE id = $1", [reportId]);
            io.emit('profileUpdated', { userId: report.sender_id, bio: '⚠️ Undergoing review.' });
        } else if (action === 'reset_sender_pass' && report.sender_id) {
            const defaultHashedPassword = await bcrypt.hash('reset123', 10);
            await pool.query('UPDATE users SET password = $1 WHERE id = $2', [defaultHashedPassword, report.sender_id]);
            await pool.query("UPDATE message_reports SET status = 'resolved' WHERE id = $1", [reportId]);
        } else if (action === 'delete_sender' && report.sender_id) {
            await pool.query('DELETE FROM users WHERE id = $1', [report.sender_id]);
            await pool.query("UPDATE message_reports SET status = 'resolved' WHERE id = $1", [reportId]);
            io.emit('userModerated', { userId: report.sender_id, action: 'deleted' });
        } else if (action === 'dismiss_report') {
            await pool.query("UPDATE message_reports SET status = 'dismissed' WHERE id = $1", [reportId]);
        } else if (action === 'resolve_report') {
            await pool.query("UPDATE message_reports SET status = 'resolved' WHERE id = $1", [reportId]);
        } else {
            return res.status(400).json({ error: 'Invalid moderation action parameter.' });
        }

        io.emit('reportStatusUpdated', { reportId });
        res.json({ success: true, message: 'Report action executed successfully.' });
    } catch (err) {
        console.error('Failed to execute report action:', err);
        res.status(500).json({ error: 'Database conflict executing report action.' });
    }
});

server.listen(PORT, () => {
    console.log(`Application running dynamically at http://localhost:${PORT}`);
});