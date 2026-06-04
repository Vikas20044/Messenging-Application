const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const session = require('express-session');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'echochat_ultra_secure_key_2026',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected smoothly to MongoDB'))
  .catch((err) => console.error('Database connection failed:', err));

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

const User = mongoose.model('User', UserSchema);

const MessageSchema = new mongoose.Schema({
    username: { type: String, required: true },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    isRead: { type: Boolean, default: false }
});

const Message = mongoose.model('Message', MessageSchema);

app.post('/api/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) return res.status(400).send('Username or Email already registered.');

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({ 
            username: username.trim(), 
            email: email.toLowerCase().trim(), 
            password: hashedPassword 
        });
        
        await newUser.save();
        res.status(201).send('Signup successful');
    } catch (err) {
        res.status(500).send('Error creating account');
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        const user = await User.findOne({ 
            username: username.trim(), 
            email: email.toLowerCase().trim() 
        });
        if (!user) return res.status(400).send('Matching User & Email combination not found');

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).send('Incorrect password');

        req.session.username = user.username;
        res.json({ success: true, username: user.username });
    } catch (err) {
        res.status(500).send('Server login error');
    }
});

app.post('/api/forgot-password', async (req, res) => {
    try {
        const { username, email, newPassword } = req.body;
        
        const user = await User.findOne({ 
            username: username.trim(),
            email: email.toLowerCase().trim() 
        });
        if (!user) return res.status(400).send('Matching User & Email combination not found');

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();
        res.send('Password reset successfully');
    } catch (err) {
        res.status(500).send('Reset server error');
    }
});

app.get('/api/logout', (req, res) => {
    req.session.destroy();
    res.send('Logged out');
});

io.on('connection', async (socket) => {
    try {
        const history = await Message.find().sort({ timestamp: 1 }).limit(100);
        socket.emit('chatHistory', history);
    } catch (err) {
        console.error('Error fetching chat history:', err);
    }

    socket.on('chatMessage', async (data) => {
        const newMessage = new Message({
            username: data.username,
            text: data.text
        });

        try {
            const savedMessage = await newMessage.save();
            io.emit('message', savedMessage);
        } catch (err) {
            console.error('Message dropped: Failed to write to MongoDB', err);
        }
    });

    socket.on('markAsRead', async (messageId) => {
        try {
            await Message.findByIdAndUpdate(messageId, { isRead: true });
            io.emit('messageReadUpdate', messageId);
        } catch (err) {
            console.error('Failed to update read status', err);
        }
    });

    socket.on('clearChat', async () => {
        try {
            await Message.deleteMany({});
            io.emit('chatCleared');
        } catch (err) {
            console.error('Failed to purge database messages:', err);
        }
    });
});

server.listen(PORT, () => {
    console.log(`Application running dynamically at http://localhost:${PORT}`);
});