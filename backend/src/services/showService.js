// Business logic for shows.

const pool = require('../config/db');

// Fetch all shows, optionally filtered by theatreId, title (partial match), and/or date.
// Date filters to shows that have at least one showtime on that day.
async function getAllShows({theatreId, title, date} = {}) {
    let sql = `
        SELECT s.*, t.name AS theatre_name, t.location AS theatre_location
        FROM shows s
                 JOIN theatres t ON t.theatre_id = s.theatre_id
        WHERE 1 = 1
    `;
    const params = [];

    if (theatreId) {
        sql += ' AND s.theatre_id = ?';
        params.push(theatreId);
    }
    if (title) {
        sql += ' AND s.title LIKE ?';
        params.push(`%${title}%`);
    }
    if (date) {
        sql += ` AND EXISTS (
      SELECT 1 FROM showtimes st
      WHERE st.show_id = s.show_id AND DATE(st.start_time) = ?
    )`;
        params.push(date);
    }

    sql += ' ORDER BY s.title';
    const [rows] = await pool.execute(sql, params);
    return rows;
}

async function getShowById(id) {
    const [rows] = await pool.execute(
        `SELECT s.*, t.name AS theatre_name, t.location AS theatre_location
         FROM shows s
                  JOIN theatres t ON t.theatre_id = s.theatre_id
         WHERE s.show_id = ?`,
        [id]
    );
    if (!rows[0]) {
        const err = new Error('Show not found.');
        err.status = 404;
        throw err;
    }
    return rows[0];
}

module.exports = {getAllShows, getShowById};
