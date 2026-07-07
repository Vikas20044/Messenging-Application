const { pool } = require('../config/db');

const createRoom = async (req, res) => {
    const { room_name, room_desc } = req.body;
    if (!room_name) return res.status(400).json({ error: 'Room name token parameter missing.' });
    
    const generateCode = () => Math.random().toString(36).substring(2, 7).toUpperCase();
    let roomCode = generateCode();
    
    try {
        const collisionCheck = await pool.query('SELECT id FROM rooms WHERE room_code = $1', [roomCode]);
        if (collisionCheck.rows.length > 0) roomCode = generateCode(); 

        const result = await pool.query(
            'INSERT INTO rooms (room_name, room_code, room_desc, room_icon, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING id, room_name, room_code, room_desc, room_icon',
            [room_name, roomCode, room_desc || '', '/uploads/default-group.png', req.session.userId]
        );
        
        // Auto-link creator to room member persistence registry with admin flag set to TRUE
        const dynamicRoom = result.rows[0];
        await pool.query(
            'INSERT INTO room_members (room_id, user_id, is_admin) VALUES ($1, $2, TRUE) ON CONFLICT DO NOTHING',
            [dynamicRoom.id, req.session.userId]
        );

        res.json(dynamicRoom);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database context group configuration failure.' });
    }
};

const lookupRoom = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, room_name, room_code, room_desc, room_icon FROM rooms WHERE room_code = $1', 
            [req.params.code.toUpperCase().trim()]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Target room configuration mismatch parameters.' });
        }
        
        // Auto-enroll user inside the room membership directory table upon lookups
        const TargetRoom = result.rows[0];
        await pool.query(
            'INSERT INTO room_members (room_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [TargetRoom.id, req.session.userId]
        );

        res.json(TargetRoom);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to query database room registries.' });
    }
};

const getJoinedRooms = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT r.id, r.room_name, r.room_code, r.room_desc, r.room_icon, r.created_by, rm.is_admin
            FROM rooms r
            JOIN room_members rm ON r.id = rm.room_id
            WHERE rm.user_id = $1
            ORDER BY r.room_name ASC
        `, [req.session.userId]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch joined rooms.' });
    }
};

const leaveRoom = async (req, res) => {
    const { roomId } = req.body;
    if (!roomId) return res.status(400).json({ error: 'Room ID parameter is missing.' });
    try {
        await pool.query('DELETE FROM room_members WHERE room_id = $1 AND user_id = $2', [roomId, req.session.userId]);
        
        // Notify socket clients in the room that the user left
        const io = req.app.get('socketio');
        if (io) {
            io.to(`group_room_${roomId}`).emit('broadcastGroupReadsSynchronized', { roomId });
        }
        
        res.json({ success: true, message: 'Successfully left the group room.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database conflict occurred leaving group.' });
    }
};

const removeMember = async (req, res) => {
    const { roomId, targetUserId } = req.body;
    if (!roomId || !targetUserId) {
        return res.status(400).json({ error: 'Missing parameters (roomId, targetUserId).' });
    }
    try {
        // Verify current user is an admin of the room
        const adminCheck = await pool.query('SELECT is_admin FROM room_members WHERE room_id = $1 AND user_id = $2', [roomId, req.session.userId]);
        if (adminCheck.rows.length === 0 || !adminCheck.rows[0].is_admin) {
            return res.status(403).json({ error: 'Forbidden: Only administrators can remove group members.' });
        }

        await pool.query('DELETE FROM room_members WHERE room_id = $1 AND user_id = $2', [roomId, targetUserId]);

        // Emit dynamic kick socket notification to force front-end reload
        const io = req.app.get('socketio');
        if (io) {
            io.emit('userKickedFromRoom', { roomId: parseInt(roomId), userId: parseInt(targetUserId) });
        }

        res.json({ success: true, message: 'Successfully kicked user from group.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to execute removal.' });
    }
};

const toggleAdmin = async (req, res) => {
    const { roomId, targetUserId, isAdmin } = req.body;
    if (!roomId || !targetUserId || isAdmin === undefined) {
        return res.status(400).json({ error: 'Missing parameters (roomId, targetUserId, isAdmin).' });
    }
    try {
        // Verify current user is an admin of the room
        const adminCheck = await pool.query('SELECT is_admin FROM room_members WHERE room_id = $1 AND user_id = $2', [roomId, req.session.userId]);
        if (adminCheck.rows.length === 0 || !adminCheck.rows[0].is_admin) {
            return res.status(403).json({ error: 'Forbidden: Only administrators can adjust credentials.' });
        }

        await pool.query(
            'UPDATE room_members SET is_admin = $3 WHERE room_id = $1 AND user_id = $2', 
            [roomId, targetUserId, isAdmin]
        );

        // Notify room members of updated details roster
        const io = req.app.get('socketio');
        if (io) {
            io.to(`group_room_${roomId}`).emit('broadcastGroupReadsSynchronized', { roomId });
        }

        res.json({ success: true, message: 'Admin state toggled successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to toggle admin status.' });
    }
};

module.exports = {
    createRoom,
    lookupRoom,
    getJoinedRooms,
    leaveRoom,
    removeMember,
    toggleAdmin
};
