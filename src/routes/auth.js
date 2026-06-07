const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

const router = express.Router();

// --- SIGNUP MODULE ---
router.post('/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const normalizedUsername = username.trim();
        const normalizedEmail = email.toLowerCase().trim();

        const userCheck = await pool.query(
            'SELECT id FROM users WHERE username = $1 OR email = $2',
            [normalizedUsername, normalizedEmail]
        );
        if (userCheck.rows.length > 0) {
            return res.status(400).send('Username or Email already registered.');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

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

// --- LOGIN MODULE ---
router.post('/login', async (req, res) => {
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

// --- FORGOT PASSWORD MODULE ---
router.post('/forgot-password', async (req, res) => {
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

// --- LOGOUT MODULE ---
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.send('Logged out');
});

module.exports = router;