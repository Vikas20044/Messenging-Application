const express = require('express');
const { checkAuthSession } = require('../middlewares/auth');
const { translate, transcribe } = require('../controllers/aiController');

const router = express.Router();

// Apply auth middleware to all AI routes
router.use(checkAuthSession);

router.post('/translate', translate);
router.post('/transcribe', transcribe);

module.exports = router;
