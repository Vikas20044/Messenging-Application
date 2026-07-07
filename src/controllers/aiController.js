const { translateText, transcribeAudio } = require('../services/aiService');
const { pool } = require('../config/db');

const translate = async (req, res) => {
    const { text, targetLang } = req.body;
    if (!text || !targetLang) {
        return res.status(400).json({ error: 'Missing parameter: text and targetLang are required.' });
    }

    try {
        const translatedText = await translateText(text, targetLang);
        res.json({ success: true, translatedText });
    } catch (err) {
        res.status(500).json({ error: 'Failed to translate text.' });
    }
};

const transcribe = async (req, res) => {
    const { audioSamples, messageId, roomId, receiverId } = req.body;
    if (!audioSamples || !messageId) {
        return res.status(400).json({ error: 'Missing parameters: audioSamples and messageId are required.' });
    }

    try {
        const transcription = await transcribeAudio(audioSamples);
        
        // Save transcription to database
        await pool.query('UPDATE messages SET transcription = $1 WHERE id = $2', [transcription, messageId]);
        
        // Emit socket notification to sync transcription dynamically in the UI
        const io = req.app.get('socketio');
        if (io) {
            const senderId = req.session.userId;
            if (roomId) {
                io.to(`group_room_${roomId}`).emit('transcriptionUpdated', { messageId, transcription });
            } else if (receiverId) {
                const chatRoomName = `chat_${Math.min(senderId, receiverId)}_${Math.max(senderId, receiverId)}`;
                io.to(chatRoomName).emit('transcriptionUpdated', { messageId, transcription });
            }
        }

        res.json({ success: true, transcription });
    } catch (err) {
        res.status(500).json({ error: 'Failed to transcribe audio.' });
    }
};

module.exports = {
    translate,
    transcribe
};
