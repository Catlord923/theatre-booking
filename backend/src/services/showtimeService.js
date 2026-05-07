// Business logic for showtimes.

const pool = require('../config/db');

// Fetch all scheduled showtimes for a given show, including live seat availability counts.
// Only counts seats from non-cancelled reservations.
async function getShowtimesForShow(showId) {
    const [rows] = await pool.execute(
        `SELECT st.*,
                h.name                       AS hall_name,
                h.total_seats,
                COUNT(rs.id)                 AS seats_reserved,
                h.total_seats - COUNT(rs.id) AS seats_available
         FROM showtimes st
                  JOIN halls h ON h.hall_id = st.hall_id
                  LEFT JOIN reservation_seats rs ON rs.showtime_id = st.showtime_id
             AND EXISTS (SELECT 1
                         FROM reservations r
                         WHERE r.reservation_id = rs.reservation_id
                           AND r.status != 'cancelled')
         WHERE st.show_id = ?
           AND st.status = 'scheduled'
         GROUP BY st.showtime_id
         ORDER BY st.start_time`,
        [showId]
    );
    return rows;
}

async function getShowtimeById(id) {
    const [rows] = await pool.execute(
        `SELECT st.*,
                h.name   AS hall_name,
                h.total_seats,
                sh.title AS show_title,
                t.name   AS theatre_name
         FROM showtimes st
                  JOIN halls h ON h.hall_id = st.hall_id
                  JOIN shows sh ON sh.show_id = st.show_id
                  JOIN theatres t ON t.theatre_id = sh.theatre_id
         WHERE st.showtime_id = ?`,
        [id]
    );
    if (!rows[0]) {
        const err = new Error('Showtime not found.');
        err.status = 404;
        throw err;
    }
    return rows[0];
}

module.exports = {getShowtimesForShow, getShowtimeById};
