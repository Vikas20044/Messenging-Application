const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure local file storage paths exist for profile photos and chat media attachments
const uploadDir = path.join(__dirname, '..', '..', 'app', 'uploads');
const chatUploadDir = path.join(__dirname, '..', '..', 'app', 'uploads', 'chat');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(chatUploadDir)) {
    fs.mkdirSync(chatUploadDir, { recursive: true });
}

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

module.exports = {
    uploadProfile,
    uploadChatMediaBulk,
    uploadDir,
    chatUploadDir
};
