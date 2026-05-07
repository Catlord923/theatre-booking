// Auth middleware. Provides route protection and role-based access control.

const jwt = require('jsonwebtoken');

/**
 * Protects routes. Requires a valid Bearer token in the Authorization header.
 * Attaches the decoded payload to req.user.
 */
function authenticate(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({error: 'No token provided.'});
    }

    const token = authHeader.split(' ')[1];
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (err) {
        return res.status(401).json({error: 'Invalid or expired token.'});
    }
}

/**
 * Restricts a route to admin users only.
 * Must be used AFTER authenticate().
 */
function requireAdmin(req, res, next) {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({error: 'Admin access required.'});
    }
    next();
}

module.exports = {authenticate, requireAdmin};
