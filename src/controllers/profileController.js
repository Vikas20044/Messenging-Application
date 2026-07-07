const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

const getMe = async (req, res) => {
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
};

const getUserById = async (req, res) => {
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
};

const updateInfo = async (req, res) => {
    const { full_name, bio } = req.body;
    try {
        await pool.query(
            'UPDATE users SET full_name = $1, bio = $2 WHERE id = $3',
            [full_name, bio, req.session.userId]
        );
        
        const io = req.app.get('socketio');
        if (io) {
            io.emit('profileUpdated', { userId: req.session.userId, full_name, bio });
        }
        
        res.json({ success: true, message: 'Profile metadata synchronized.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update user database profile information.' });
    }
};

const uploadAvatar = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Please select an image file asset.' });
    }
    const targetPublicPath = `/uploads/${req.file.filename}`;
    try {
        await pool.query(
            'UPDATE users SET profile_pic_url = $1 WHERE id = $2',
            [targetPublicPath, req.session.userId]
        );
        
        const io = req.app.get('socketio');
        if (io) {
            io.emit('profileUpdated', { userId: req.session.userId, profile_pic_url: targetPublicPath });
        }
        
        res.json({ success: true, profile_pic_url: targetPublicPath });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to write custom image destination file path properties.' });
    }
};

const updateCredentials = async (req, res) => {
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
            const hashedPassword = await bcrypt.hash(password, 10);
            await pool.query(
                'UPDATE users SET username = $1, password = $2 WHERE id = $3',
                [username, hashedPassword, req.session.userId]
            );
        } else {
            await pool.query('UPDATE users SET username = $1 WHERE id = $2', [username, req.session.userId]);
        }

        req.session.username = username;
        
        const io = req.app.get('socketio');
        if (io) {
            io.emit('profileUpdated', { userId: req.session.userId, username: username });
        }
        
        res.json({ success: true, message: 'System access criteria updated successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Security structural adjustment sequence crash.' });
    }
};

module.exports = {
    getMe,
    getUserById,
    updateInfo,
    uploadAvatar,
    updateCredentials
};
