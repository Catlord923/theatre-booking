// Business logic for seats.

const pool = require('../config/db');

// Fetch available seats for a showtime from the v_available_seats view;
// optionally filtered by category (e.g. 'std', 'vip')
async function getAvailableSeats(showtimeId, category) {
    let sql = `
        SELECT *
        FROM v_available_seats
        WHERE showtime_id = ?
    `;
    const params = [showtimeId];

    if (category) {
        sql += ' AND category = ?';
        params.push(category);
    }
    sql += ' ORDER BY row_label, seat_number';

    const [rows] = await pool.execute(sql, params);
    return rows;
}

module.exports = {getAvailableSeats};
