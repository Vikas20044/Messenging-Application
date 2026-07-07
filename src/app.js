const express = require('express');
const path = require('path');
const session = require('express-session');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

// Run migrations on startup
const { runMigrations } = require('./config/migrate');
runMigrations().catch(err => {
    console.error('Fatal: Database migrations failed at startup.', err);
});

// Import route modules
const authRoutes = require('./routes/auth');
const roomsRoutes = require('./routes/rooms');
const profileRoutes = require('./routes/profile');
const adminRoutes = require('./routes/admin');
const aiRoutes = require('./routes/ai');
const chatRoutes = require('./routes/chat');

const app = express();

// Enable parsing of JSON payloads with a higher limit (e.g. 50MB) for audio float vectors
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(session({
    secret: process.env.SESSION_SECRET || 'echochat_ultra_secure_key_2026',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// Serves client assets
const appDir = path.join(__dirname, '..', 'app');
app.use(express.static(appDir, { index: false }));
app.use('/uploads', express.static(path.join(appDir, 'uploads')));

// --- STATIC PAGE ROUTING LAYER ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(appDir, 'login.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(appDir, 'signup.html'));
});

app.get('/forgot-password', (req, res) => {
    res.sendFile(path.join(appDir, 'forgot.html'));
});

app.get('/chat', (req, res) => {
    if (!req.session || !req.session.username) {
        return res.redirect('/login');
    }
    res.sendFile(path.join(appDir, 'home.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(appDir, 'admin.html'));
});

app.get('/developer', (req, res) => {
    res.sendFile(path.join(appDir, 'developer.html'));
});

app.get('/faq', (req, res) => {
    res.sendFile(path.join(appDir, 'faq.html'));
});

// Session status endpoint
app.get('/api/session-user', (req, res) => {
    if (req.session && req.session.username) {
        res.json({ id: req.session.userId, username: req.session.username });
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
});

// Bind API Routing Layers
app.use('/api', authRoutes);
app.use('/api/rooms', roomsRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/chat', chatRoutes);

module.exports = app;
