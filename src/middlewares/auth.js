function checkAuthSession(req, res, next) {
    if (req.session && req.session.userId) {
        return next();
    }
    res.status(401).json({ error: 'Unauthorized structural access request.' });
}

module.exports = { checkAuthSession };
