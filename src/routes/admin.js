const express = require('express');
const {
    verifyAdmin,
    getMetrics,
    flagUser,
    deleteUser,
    deleteRoom,
    resetUserPassword
} = require('../controllers/adminController');

const router = express.Router();

router.post('/verify', verifyAdmin);
router.get('/metrics', getMetrics);
router.post('/users/:id/flag', flagUser);
router.delete('/users/:id', deleteUser);
router.delete('/rooms/:id', deleteRoom);
router.post('/users/:id/reset-password', resetUserPassword);

module.exports = router;
