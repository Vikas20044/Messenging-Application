const express = require('express');
const { checkAuthSession } = require('../middlewares/auth');
const { uploadChatMediaBulk } = require('../middlewares/upload');

const router = express.Router();

router.post('/upload', checkAuthSession, uploadChatMediaBulk.array('chatFiles', 10), (req, res) => {
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

module.exports = router;
