const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

const verifyAdmin = (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'admin123') {
        return res.sendStatus(200);
    }
    res.status(401).send('Access Denied: Invalid Administrative Credentials.');
};

const getMetrics = async (req, res) => {
    try {
        // Collect analytical counter variables tracking sizes across tables concurrently
        const userCountRes = await pool.query('SELECT COUNT(*) FROM users');
        const roomCountRes = await pool.query('SELECT COUNT(*) FROM rooms');
        const messageCountRes = await pool.query('SELECT COUNT(*) FROM messages');
        
        // Dynamic lookups parsing profiles ledger tables data 
        const usersListRes = await pool.query('SELECT id, username, full_name, bio FROM users ORDER BY id DESC LIMIT 50');
        
        // NEW EXTENDED QUERY: Gathers live group chat telemetry schemas
        const roomsListRes = await pool.query('SELECT id, room_name, room_code, room_desc, created_by FROM rooms ORDER BY id DESC LIMIT 50');

        res.json({
            counters: {
                userCount: userCountRes.rows[0].count,
                roomCount: roomCountRes.rows[0].count,
                messageCount: messageCountRes.rows[0].count
            },
            users: usersListRes.rows,
            rooms: roomsListRes.rows
        });
    } catch (err) {
        console.error('Failure mapping tracking system matrix indexes telemetry:', err);
        res.status(500).json({ error: 'Administrative dashboard analytics sequence runtime crash.' });
    }
};

const flagUser = async (req, res) => {
    const targetedUserId = req.params.id;
    try {
        await pool.query(
            "UPDATE users SET bio = '⚠️ This profile content description is undergoing review by system administrative safety officers.' WHERE id = $1", 
            [targetedUserId]
        );
        
        const io = req.app.get('socketio');
        if (io) {
            io.emit('profileUpdated', { userId: targetedUserId, bio: '⚠️ Undergoing review.' });
        }
        
        res.sendStatus(200);
    } catch (err) {
        console.error(err);
        res.status(500).send('Database mutation action sequence conflict.');
    }
};

const deleteUser = async (req, res) => {
    const targetedUserId = req.params.id;
    try {
        await pool.query('DELETE FROM users WHERE id = $1', [targetedUserId]);
        
        const io = req.app.get('socketio');
        if (io) {
            io.emit('userModerated', { userId: targetedUserId, action: 'deleted' });
        }
        
        res.sendStatus(200);
    } catch (err) {
        console.error(err);
        res.status(500).send('Database mutation action sequence conflict: User deletion failed.');
    }
};

const deleteRoom = async (req, res) => {
    const targetedRoomId = req.params.id;
    try {
        await pool.query('DELETE FROM rooms WHERE id = $1', [targetedRoomId]);
        
        const io = req.app.get('socketio');
        if (io) {
            io.emit('userKickedFromRoom', { roomId: parseInt(targetedRoomId), userId: null });
        }
        
        res.sendStatus(200);
    } catch (err) {
        console.error(err);
        res.status(500).send('Database mutation action sequence conflict: Room deletion failed.');
    }
};

const resetUserPassword = async (req, res) => {
    const targetedUserId = req.params.id;
    try {
        const defaultHashedPassword = await bcrypt.hash('reset123', 10);
        await pool.query('UPDATE users SET password = $1 WHERE id = $2', [defaultHashedPassword, targetedUserId]);
        res.status(200).send('Password reset to default "reset123" successfully.');
    } catch (err) {
        console.error(err);
        res.status(500).send('Database mutation action sequence conflict: Password reset failed.');
    }
};

module.exports = {
    verifyAdmin,
    getMetrics,
    flagUser,
    deleteUser,
    deleteRoom,
    resetUserPassword
};
