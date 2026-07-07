const express = require('express');
const { checkAuthSession } = require('../middlewares/auth');
const {
    createRoom,
    lookupRoom,
    getJoinedRooms,
    leaveRoom,
    removeMember,
    toggleAdmin
} = require('../controllers/roomsController');

const router = express.Router();

// Apply auth middleware to all room routes
router.use(checkAuthSession);

router.post('/create', createRoom);
router.get('/lookup/:code', lookupRoom);
router.get('/joined', getJoinedRooms);
router.post('/leave', leaveRoom);
router.post('/members/remove', removeMember);
router.post('/members/toggle-admin', toggleAdmin);

module.exports = router;
