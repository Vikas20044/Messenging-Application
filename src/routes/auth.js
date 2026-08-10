const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

const router = express.Router();

// --- SIGNUP MODULE ---
router.post('/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).send('Username, email, and password are all required.');
        }

        const normalizedUsername = username.trim();
        const normalizedEmail = email.toLowerCase().trim();

        if (normalizedUsername.length < 3 || normalizedUsername.length > 50) {
            return res.status(400).send('Username must be between 3 and 50 characters.');
        }
        if (password.length < 6) {
            return res.status(400).send('Password must be at least 6 characters long.');
        }

        const userCheck = await pool.query('SELECT id FROM users WHERE username = $1 OR email = $2', [normalizedUsername, normalizedEmail]);
        if (userCheck.rows.length > 0) {
            return res.status(400).send('Username or Email already registered.');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query('INSERT INTO users (username, email, password) VALUES ($1, $2, $3)', [normalizedUsername, normalizedEmail, hashedPassword]);
        res.status(201).send('Signup successful');
    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).send('Error creating account');
    }
});

// --- LOGIN MODULE ---
router.post('/login', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username && !email) {
            return res.status(400).send('Username or Email is required.');
        }
        if (!password) {
            return res.status(400).send('Password is required.');
        }

        const inputUser = (username || '').trim();
        const inputEmail = (email || '').toLowerCase().trim();

        let result;
        if (inputUser && inputEmail) {
            result = await pool.query('SELECT * FROM users WHERE username = $1 AND email = $2', [inputUser, inputEmail]);
        } else if (inputUser) {
            result = await pool.query('SELECT * FROM users WHERE username = $1 OR email = $1', [inputUser]);
        } else {
            result = await pool.query('SELECT * FROM users WHERE email = $1', [inputEmail]);
        }
        
        if (result.rows.length === 0) {
            return res.status(400).send('User details not found');
        }

        const user = result.rows[0];
        if (user.is_deleted) {
            return res.status(403).send('This account has been removed by system administrators.');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).send('Incorrect password');
        }

        req.session.userId = user.id;
        req.session.username = user.username;
        res.json({ success: true, username: user.username });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).send('Server login error');
    }
});

// --- FORGOT PASSWORD MODULE ---
router.post('/forgot-password', async (req, res) => {
    try {
        const { username, email, newPassword } = req.body;
        if (!username || !email || !newPassword) {
            return res.status(400).send('Username, email, and new password are required.');
        }
        if (newPassword.length < 6) {
            return res.status(400).send('New password must be at least 6 characters long.');
        }

        const result = await pool.query('SELECT id FROM users WHERE username = $1 AND email = $2', [username.trim(), email.toLowerCase().trim()]);
        if (result.rows.length === 0) {
            return res.status(400).send('User not found with matching username and email.');
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedNewPassword, result.rows[0].id]);
        res.send('Password reset successfully');
    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).send('Reset server error');
    }
});

// --- LOGOUT ENDPOINT ---
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        res.clearCookie('connect.sid');
        res.send('Logged out');
    });
});

module.exports = router;