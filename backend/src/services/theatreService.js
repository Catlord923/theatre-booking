// Business logic for theatres.

const pool = require('../config/db');

// Fetch all theatres; optionally filtered by a search term matched against name and location.
async function getAllTheatres({search} = {}) {
    let sql = 'SELECT * FROM theatres';
    const params = [];

    if (search) {
        sql += ' WHERE name LIKE ? OR location LIKE ?';
        params.push(`%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY name';
    const [rows] = await pool.execute(sql, params);
    return rows;
}

async function getTheatreById(id) {
    const [rows] = await pool.execute(
        'SELECT * FROM theatres WHERE theatre_id = ?', [id]
    );
    if (!rows[0]) {
        const err = new Error('Theatre not found.');
        err.status = 404;
        throw err;
    }
    return rows[0];
}

module.exports = {getAllTheatres, getTheatreById};
