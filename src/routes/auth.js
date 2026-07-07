const express = require('express');
const {
    signup,
    login,
    forgotPassword,
    searchUsers,
    activeChats,
    logout
} = require('../controllers/authController');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.get('/users/search', searchUsers);
router.get('/chats/active', activeChats);
router.get('/logout', logout);

module.exports = router;