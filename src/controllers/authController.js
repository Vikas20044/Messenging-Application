const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

const signup = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const normalizedUsername = username.trim();
        const normalizedEmail = email.toLowerCase().trim();

        const userCheck = await pool.query('SELECT id FROM users WHERE username = $1 OR email = $2', [normalizedUsername, normalizedEmail]);
        if (userCheck.rows.length > 0) return res.status(400).send('Username or Email already registered.');

        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query('INSERT INTO users (username, email, password) VALUES ($1, $2, $3)', [normalizedUsername, normalizedEmail, hashedPassword]);
        res.status(201).send('Signup successful');
    } catch (err) {
        res.status(500).send('Error creating account');
    }
};

const login = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const result = await pool.query('SELECT * FROM users WHERE username = $1 AND email = $2', [username.trim(), email.toLowerCase().trim()]);
        
        if (result.rows.length === 0) return res.status(400).send('User details not found');

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).send('Incorrect password');

        req.session.userId = user.id;
        req.session.username = user.username;
        res.json({ success: true, username: user.username });
    } catch (err) {
        res.status(500).send('Server login error');
    }
};

const forgotPassword = async (req, res) => {
    try {
        const { username, email, newPassword } = req.body;
        const result = await pool.query('SELECT id FROM users WHERE username = $1 AND email = $2', [username.trim(), email.toLowerCase().trim()]);
        if (result.rows.length === 0) return res.status(400).send('User not found');

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedNewPassword, result.rows[0].id]);
        res.send('Password reset successfully');
    } catch (err) {
        res.status(500).send('Reset server error');
    }
};

const searchUsers = async (req, res) => {
    try {
        if (!req.session.userId) return res.status(401).send('Unauthorized');
        const { q } = req.query;
        
        const result = await pool.query(
            "SELECT id, username, COALESCE(profile_pic_url, '/uploads/default-avatar.png') as profile_pic_url FROM users WHERE username ILIKE $1 AND id != $2 LIMIT 10",
            [`%${q}%`, req.session.userId]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).send('Search execution failure');
    }
};

const activeChats = async (req, res) => {
    try {
        if (!req.session.userId) return res.status(401).send('Unauthorized');
        
        const result = await pool.query(`
            SELECT DISTINCT u.id, u.username, COALESCE(u.profile_pic_url, '/uploads/default-avatar.png') as profile_pic_url 
            FROM users u
            JOIN messages m ON (u.id = m.sender_id OR u.id = m.receiver_id)
            WHERE (m.sender_id = $1 OR m.receiver_id = $1) AND u.id != $1
        `, [req.session.userId]);
        
        res.json(result.rows);
    } catch (err) {
        res.status(500).send('Failed to fetch active chats');
    }
};

const logout = (req, res) => {
    req.session.destroy();
    res.send('Logged out');
};

module.exports = {
    signup,
    login,
    forgotPassword,
    searchUsers,
    activeChats,
    logout
};
