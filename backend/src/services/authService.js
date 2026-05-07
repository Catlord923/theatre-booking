// Business logic for authentication: registration, login, and token refresh.

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const SALT_ROUNDS = 12; // bcrypt work factor; higher = slower hash but more secure

async function register({name, email, password}) {
    if (!name || !email || !password) {
        const err = new Error('name, email and password are required.');
        err.status = 400;
        throw err;
    }

    const hash = await bcrypt.hash(password, SALT_ROUNDS);

    const [result] = await pool.execute(
        'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
        [name, email, hash]
    );

    return {user_id: result.insertId, name, email, role: 'user'};
}

async function login({email, password}) {
    if (!email || !password) {
        const err = new Error('email and password are required.');
        err.status = 400;
        throw err;
    }

    const [rows] = await pool.execute(
        'SELECT user_id, name, email, password, role FROM users WHERE email = ?',
        [email]
    );

    const user = rows[0];
    // Deliberately vague error to avoid leaking whether the email exists
    if (!user || !user.password) {
        const err = new Error('Invalid credentials.');
        err.status = 401;
        throw err;
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
        const err = new Error('Invalid credentials.');
        err.status = 401;
        throw err;
    }

    const payload = {user_id: user.user_id, email: user.email, role: user.role};

    // Issue both an access token (short-lived; 1h) and a refresh token (long-lived; 7d)
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
    const refreshToken = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
    });

    return {
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: 'Bearer',
        user: {user_id: user.user_id, name: user.name, email: user.email, role: user.role},
    };
}

// Verifies the refresh token and issues a new access token
// Re-fetches the user from the DB to ensure the account still exists
async function refresh({refresh_token: token}) {
    if (!token) {
        const err = new Error('refresh_token is required.');
        err.status = 400;
        throw err;
    }

    let payload;
    try {
        payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        const err = new Error('Invalid or expired refresh token.');
        err.status = 401;
        throw err;
    }

    const [rows] = await pool.execute(
        'SELECT user_id, email, role FROM users WHERE user_id = ?',
        [payload.user_id]
    );
    if (!rows[0]) {
        const err = new Error('User not found.');
        err.status = 404;
        throw err;
    }

    const {user_id, email, role} = rows[0];
    const accessToken = jwt.sign({user_id, email, role}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });

    return {access_token: accessToken, token_type: 'Bearer'};
}

module.exports = {register, login, refresh};
