// Controller layer for auth routes. Delegates all business logic to authService
// and forwards any errors to Express's central error handler via next(err).

const authService = require('../services/authService');

// Handle user registration
async function register(req, res, next) {
    try {
        const user = await authService.register(req.body);
        res.status(201).json({message: 'User registered successfully.', user});
    } catch (err) {
        next(err);
    }
}

// Handle user login
async function login(req, res, next) {
    try {
        const result = await authService.login(req.body);
        res.json(result);
    } catch (err) {
        next(err);
    }
}

// Handle token refresh
async function refresh(req, res, next) {
    try {
        const result = await authService.refresh(req.body);
        res.json(result);
    } catch (err) {
        next(err);
    }
}

module.exports = {register, login, refresh};
