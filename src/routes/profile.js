const express = require('express');
const { checkAuthSession } = require('../middlewares/auth');
const { uploadProfile } = require('../middlewares/upload');
const {
    getMe,
    getUserById,
    updateInfo,
    uploadAvatar,
    updateCredentials
} = require('../controllers/profileController');

const router = express.Router();

// Apply auth middleware to all profile routes
router.use(checkAuthSession);

router.get('/me', getMe);
router.get('/user/:id', getUserById);
router.put('/update-info', updateInfo);
router.post('/upload-avatar', uploadProfile.single('avatar'), uploadAvatar);
router.put('/update-credentials', updateCredentials);

module.exports = router;
