const { pool } = require('../config/db');

const connectedUsersMap = new Map(); // tracks runtime allocations format: userId -> Set of socketIds

module.exports = function (io) {
    io.on('connection', (socket) => {

        // Trace active authentication state synchronization signals
        socket.on('declareIdentity', ({ userId }) => {
            if (!userId) return;
            socket.userId = userId;
            if (!connectedUsersMap.has(userId)) {
                connectedUsersMap.set(userId, new Set());
            }
            connectedUsersMap.get(userId).add(socket.id);
            io.emit('networkIdentityStatusChange', { userId, status: 'online' });
        });

        socket.on('requestUserOnlineStatus', ({ targetUserId }, callback) => {
            const status = connectedUsersMap.has(targetUserId) && connectedUsersMap.get(targetUserId).size > 0 ? 'online' : 'offline';
            if (callback) callback({ status });
        });

        // BUG FIXED: Now pulls absolute database memberships and matches profiles against application-wide global trackers
        socket.on('fetchGroupOnlineRoster', async ({ roomId }, callback) => {
            try {
                const result = await pool.query(`
                    SELECT u.id, u.username, COALESCE(u.profile_pic_url, '/uploads/default-avatar.png') as profile_pic_url, rm.is_admin
                    FROM room_members rm
                    JOIN users u ON rm.user_id = u.id
                    WHERE rm.room_id = $1
                    ORDER BY u.username ASC
                `, [roomId]);

                const dynamicRoster = result.rows.map(user => {
                    const isOnline = connectedUsersMap.has(user.id) && connectedUsersMap.get(user.id).size > 0;
                    return {
                        id: user.id,
                        username: user.username,
                        profile_pic_url: user.profile_pic_url,
                        status: isOnline ? 'online' : 'offline',
                        is_admin: user.is_admin
                    };
                });

                if (callback) callback(dynamicRoster);
            } catch (err) {
                console.error('Error computing dynamic group tracking registry:', err);
                if (callback) callback([]);
            }
        });

        socket.on('joinRoom', async ({ currentUserId, targetUserId }) => {
            const roomName = `chat_${Math.min(currentUserId, targetUserId)}_${Math.max(currentUserId, targetUserId)}`;
            
            socket.rooms.forEach(room => { 
                if (room !== socket.id) socket.leave(room); 
            });
            socket.join(roomName);

            try {
                const result = await pool.query(`
                    SELECT m.id as _id, m.text, m.timestamp, m.isread as "isRead", 
                           u.username as username, m.sender_id, m.message_type, m.file_url, m.is_deleted,
                           COALESCE(u.profile_pic_url, '/uploads/default-avatar.png') as profile_pic_url,
                           m.reply_to_message_id,
                           p.text as reply_to_text,
                           pu.username as reply_to_username,
                           p.is_deleted as reply_to_is_deleted,
                           m.transcription, m.read_at,
                           (
                               SELECT COALESCE(json_object_agg(eg.emoji, eg.users), '{}'::json)
                               FROM (
                                   SELECT mr.emoji, json_agg(u2.username) as users
                                   FROM message_reactions mr
                                   JOIN users u2 ON mr.user_id = u2.id
                                   WHERE mr.message_id = m.id
                                   GROUP BY mr.emoji
                               ) eg
                           ) as reactions
                    FROM messages m
                    JOIN users u ON m.sender_id = u.id
                    LEFT JOIN messages p ON m.reply_to_message_id = p.id
                    LEFT JOIN users pu ON p.sender_id = pu.id
                    WHERE ((m.sender_id = $1 AND m.receiver_id = $2) 
                       OR (m.sender_id = $2 AND m.receiver_id = $1)) AND m.room_id IS NULL
                    ORDER BY m.timestamp ASC LIMIT 100
                `, [currentUserId, targetUserId]);

                socket.emit('chatHistory', result.rows);
            } catch (err) {
                console.error('Error gathering private room thread history:', err);
            }
        });

        socket.on('privateMessage', async ({ sender_id, receiver_id, text, message_type, file_url, reply_to_message_id }) => {
            const roomName = `chat_${Math.min(sender_id, receiver_id)}_${Math.max(sender_id, receiver_id)}`;
            const type = message_type || 'text';
            const url = file_url || null;
            const parentId = reply_to_message_id || null;
            try {
                const result = await pool.query(`
                    INSERT INTO messages (sender_id, receiver_id, text, message_type, file_url, reply_to_message_id) 
                    VALUES ($1, $2, $3, $4, $5, $6) 
                    RETURNING id as _id, text, timestamp, isread as "isRead", message_type, file_url, is_deleted, reply_to_message_id, transcription, read_at
                `, [sender_id, receiver_id, text, type, url, parentId]);

                const userResult = await pool.query("SELECT username, COALESCE(profile_pic_url, '/uploads/default-avatar.png') as profile_pic_url FROM users WHERE id = $1", [sender_id]);

                let parentMsg = null;
                if (parentId) {
                    const parentRes = await pool.query(
                        "SELECT m.text, u.username, m.is_deleted FROM messages m JOIN users u ON m.sender_id = u.id WHERE m.id = $1", 
                        [parentId]
                    );
                    if (parentRes.rows.length > 0) {
                        parentMsg = parentRes.rows[0];
                    }
                }

                const payload = {
                    ...result.rows[0],
                    sender_id,
                    username: userResult.rows[0].username,
                    profile_pic_url: userResult.rows[0].profile_pic_url,
                    reply_to_text: parentMsg ? parentMsg.text : null,
                    reply_to_username: parentMsg ? parentMsg.username : null,
                    reply_to_is_deleted: parentMsg ? parentMsg.is_deleted : false,
                    reactions: {}
                };

                io.to(roomName).emit('message', payload);
            } catch (err) {
                console.error('Failed to execute private message database insert sequence:', err);
            }
        });

        socket.on('joinGroupRoom', async ({ roomId }) => {
            const roomName = `group_room_${roomId}`;
            
            socket.rooms.forEach(room => { 
                if (room !== socket.id) socket.leave(room); 
            });
            socket.join(roomName);

            try {
                const result = await pool.query(`
                    SELECT m.id as _id, m.text, m.timestamp, m.isread as "isRead", 
                           u.username as username, m.sender_id, m.message_type, m.file_url, m.is_deleted,
                           COALESCE(u.profile_pic_url, '/uploads/default-avatar.png') as profile_pic_url,
                           m.reply_to_message_id,
                           p.text as reply_to_text,
                           pu.username as reply_to_username,
                           p.is_deleted as reply_to_is_deleted,
                           m.transcription, m.read_at,
                           (
                               SELECT COALESCE(json_object_agg(eg.emoji, eg.users), '{}'::json)
                               FROM (
                                   SELECT mr.emoji, json_agg(u2.username) as users
                                   FROM message_reactions mr
                                   JOIN users u2 ON mr.user_id = u2.id
                                   WHERE mr.message_id = m.id
                                   GROUP BY mr.emoji
                               ) eg
                           ) as reactions
                    FROM messages m
                    JOIN users u ON m.sender_id = u.id
                    LEFT JOIN messages p ON m.reply_to_message_id = p.id
                    LEFT JOIN users pu ON p.sender_id = pu.id
                    WHERE m.room_id = $1
                    ORDER BY m.timestamp ASC LIMIT 100
                `, [roomId]);

                // Flush dynamic individual group message read records on workspace join entry
                if (socket.userId) {
                    await pool.query(`
                        INSERT INTO group_message_reads (message_id, user_id)
                        SELECT id, $1 FROM messages WHERE room_id = $2 AND sender_id != $1
                        ON CONFLICT DO NOTHING
                    `, [socket.userId, roomId]);
                    
                    io.to(roomName).emit('broadcastGroupReadsSynchronized', { roomId });
                }

                socket.emit('chatHistory', result.rows);
            } catch (err) {
                console.error('Failed processing bulk group history lookups:', err);
            }
        });

        socket.on('groupMessage', async ({ sender_id, room_id, text, message_type, file_url, reply_to_message_id }) => {
            const roomName = `group_room_${room_id}`;
            const type = message_type || 'text';
            const url = file_url || null;
            const parentId = reply_to_message_id || null;
            try {
                const result = await pool.query(`
                    INSERT INTO messages (sender_id, room_id, text, message_type, file_url, reply_to_message_id) 
                    VALUES ($1, $2, $3, $4, $5, $6) 
                    RETURNING id as _id, text, timestamp, isread as "isRead", message_type, file_url, room_id, is_deleted, reply_to_message_id, transcription, read_at
                `, [sender_id, room_id, text, type, url, parentId]);

                const targetMessageId = result.rows[0]._id;
                const userResult = await pool.query("SELECT username, COALESCE(profile_pic_url, '/uploads/default-avatar.png') as profile_pic_url FROM users WHERE id = $1", [sender_id]);

                // Auto log implicit visibility metrics for sockets active inside the workspace stream context
                const activeRoomSockets = io.sockets.adapter.rooms.get(roomName) || new Set();
                for (const sockId of activeRoomSockets) {
                    const clientSock = io.sockets.sockets.get(sockId);
                    if (clientSock && clientSock.userId) {
                        await pool.query(`
                            INSERT INTO group_message_reads (message_id, user_id) 
                            VALUES ($1, $2) ON CONFLICT DO NOTHING
                        `, [targetMessageId, clientSock.userId]);
                    }
                }

                let parentMsg = null;
                if (parentId) {
                    const parentRes = await pool.query(
                        "SELECT m.text, u.username, m.is_deleted FROM messages m JOIN users u ON m.sender_id = u.id WHERE m.id = $1", 
                        [parentId]
                    );
                    if (parentRes.rows.length > 0) {
                        parentMsg = parentRes.rows[0];
                    }
                }

                const payload = {
                    ...result.rows[0],
                    sender_id,
                    username: userResult.rows[0].username,
                    profile_pic_url: userResult.rows[0].profile_pic_url,
                    reply_to_text: parentMsg ? parentMsg.text : null,
                    reply_to_username: parentMsg ? parentMsg.username : null,
                    reply_to_is_deleted: parentMsg ? parentMsg.is_deleted : false,
                    reactions: {}
                };

                io.to(roomName).emit('message', payload);
            } catch (err) {
                console.error('Group processing mutation execution insert failure:', err);
            }
        });

        socket.on('markAsRead', async (messageId) => {
            try {
                await pool.query('UPDATE messages SET isread = TRUE, read_at = NOW() WHERE id = $1 AND isread = FALSE', [messageId]);
                io.emit('messageReadUpdate', messageId);
            } catch (err) {
                console.error('Failed to update private thread state receipt:', err);
            }
        });

        socket.on('fetchPrivateMessageReadReceipt', async ({ messageId }, callback) => {
            try {
                const result = await pool.query('SELECT timestamp as sent_at, read_at, isread FROM messages WHERE id = $1', [messageId]);
                if (callback) callback(result.rows.length > 0 ? result.rows[0] : null);
            } catch (err) {
                console.error('Failed to fetch private message receipt:', err);
                if (callback) callback(null);
            }
        });

        socket.on('saveMessageTranscription', async ({ messageId, roomId, receiverId, transcription }) => {
            try {
                await pool.query('UPDATE messages SET transcription = $1 WHERE id = $2', [transcription, messageId]);
                
                const senderId = socket.userId;
                if (roomId) {
                    io.to(`group_room_${roomId}`).emit('transcriptionUpdated', { messageId, transcription });
                } else if (receiverId) {
                    const chatRoomName = `chat_${Math.min(senderId, receiverId)}_${Math.max(senderId, receiverId)}`;
                    io.to(chatRoomName).emit('transcriptionUpdated', { messageId, transcription });
                }
            } catch (err) {
                console.error('Failed to save audio message transcription:', err);
            }
        });

        socket.on('explicitMarkGroupMessageAsRead', async ({ messageId, userId, roomId }) => {
            try {
                await pool.query(`
                    INSERT INTO group_message_reads (message_id, user_id) 
                    VALUES ($1, $2) ON CONFLICT DO NOTHING
                `, [messageId, userId]);
                io.to(`group_room_${roomId}`).emit('broadcastGroupReadsSynchronized', { roomId });
            } catch (err) {
                console.error(err);
            }
        });

        socket.on('fetchGroupMessageReadLedger', async ({ messageId }, callback) => {
            try {
                const result = await pool.query(`
                    SELECT u.username, r.read_at 
                    FROM group_message_reads r
                    JOIN users u ON r.user_id = u.id
                    WHERE r.message_id = $1
                    ORDER BY r.read_at ASC
                `, [messageId]);
                if (callback) callback(result.rows);
            } catch (err) {
                if (callback) callback([]);
            }
        });

        socket.on('typing', ({ sender_id, receiver_id, room_id, isTyping }) => {
            if (room_id) {
                socket.to(`group_room_${room_id}`).emit('userTyping', { userId: sender_id, roomId: room_id, isTyping });
            } else if (receiver_id) {
                const chatRoomName = `chat_${Math.min(sender_id, receiver_id)}_${Math.max(sender_id, receiver_id)}`;
                socket.to(chatRoomName).emit('userTyping', { userId: sender_id, isTyping });
            }
        });

        socket.on('messageReaction', async ({ messageId, emoji, roomId, receiverId }) => {
            try {
                const userId = socket.userId;
                if (!userId) return;

                // Check if reaction already exists
                const checkRes = await pool.query('SELECT emoji FROM message_reactions WHERE message_id = $1 AND user_id = $2', [messageId, userId]);
                
                if (checkRes.rows.length > 0) {
                    if (checkRes.rows[0].emoji === emoji) {
                        // Toggle off
                        await pool.query('DELETE FROM message_reactions WHERE message_id = $1 AND user_id = $2', [messageId, userId]);
                    } else {
                        // Update reaction
                        await pool.query('UPDATE message_reactions SET emoji = $3 WHERE message_id = $1 AND user_id = $2', [messageId, userId, emoji]);
                    }
                } else {
                    // Add new reaction
                    await pool.query('INSERT INTO message_reactions (message_id, user_id, emoji) VALUES ($1, $2, $3)', [messageId, userId, emoji]);
                }

                // Compile updated reaction map for this message
                const reactionMapRes = await pool.query(`
                    SELECT mr.emoji, json_agg(u.username) as users
                    FROM message_reactions mr
                    JOIN users u ON mr.user_id = u.id
                    WHERE mr.message_id = $1
                    GROUP BY mr.emoji
                `, [messageId]);

                const reactions = {};
                reactionMapRes.rows.forEach(row => {
                    reactions[row.emoji] = row.users;
                });

                // Emit the updated reactions
                if (roomId) {
                    io.to(`group_room_${roomId}`).emit('reactionUpdated', { messageId, reactions });
                } else if (receiverId) {
                    const chatRoomName = `chat_${Math.min(userId, receiverId)}_${Math.max(userId, receiverId)}`;
                    io.to(chatRoomName).emit('reactionUpdated', { messageId, reactions });
                }
            } catch (err) {
                console.error('Failed to handle reaction event:', err);
            }
        });

        socket.on('disconnect', () => {
            if (socket.userId && connectedUsersMap.has(socket.userId)) {
                const identityTrackingScope = connectedUsersMap.get(socket.userId);
                identityTrackingScope.delete(socket.id);
                if (identityTrackingScope.size === 0) {
                    connectedUsersMap.delete(socket.userId);
                    io.emit('networkIdentityStatusChange', { userId: socket.userId, status: 'offline' });
                }
            }
        });
    });
};
