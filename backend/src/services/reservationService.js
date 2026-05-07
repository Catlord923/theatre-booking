// Business logic for reservations: creation, retrieval,
// cancellation and modification.
// All write operations use DB transactions to ensure consistency.

const pool = require('../config/db');

/**
 * Create a reservation for one or more seats in a single showtime.
 * Uses a DB transaction so either all seats are booked or none.
 * The UNIQUE constraint on reservation_seats(seat_id, showtime_id)
 * is the final guard against double-booking.
 */
async function createReservation({userId, showtimeId, seatIds}) {
    if (!showtimeId || !Array.isArray(seatIds) || seatIds.length === 0) {
        const err = new Error('showtime_id and a non-empty seat_ids array are required.');
        err.status = 400;
        throw err;
    }

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // Lock the showtime row to prevent race conditions
        const [stRows] = await conn.execute(
            'SELECT showtime_id, price_std, price_vip FROM showtimes WHERE showtime_id = ? AND status = ? FOR UPDATE',
            [showtimeId, 'scheduled']
        );
        if (!stRows[0]) {
            const err = new Error('Showtime not found or no longer available.');
            err.status = 404;
            throw err;
        }
        const {price_std, price_vip} = stRows[0];

        // Fetch requested seats and verify they belong to the right hall
        const placeholders = seatIds.map(() => '?').join(',');
        const [seats] = await conn.execute(
            `SELECT s.seat_id, s.category
             FROM seats s
                      JOIN showtimes st ON st.hall_id = s.hall_id
             WHERE s.seat_id IN (${placeholders})
               AND st.showtime_id = ?`,
            [...seatIds, showtimeId]
        );

        if (seats.length !== seatIds.length) {
            const err = new Error('One or more seat IDs are invalid for this showtime.');
            err.status = 400;
            throw err;
        }

        const totalPrice = seats.reduce((sum, seat) => {
            return sum + (seat.category === 'vip' ? parseFloat(price_vip) : parseFloat(price_std));
        }, 0);

        const [resResult] = await conn.execute(
            'INSERT INTO reservations (user_id, showtime_id, status, total_price) VALUES (?, ?, ?, ?)',
            [userId, showtimeId, 'confirmed', totalPrice.toFixed(2)]
        );
        const reservationId = resResult.insertId;

        // Insert one row per seat
        // ON DUPLICATE KEY UPDATE handles seats that were previously cancelled
        // Reassigns them to this reservation rather than failing on the UNIQUE constraint
        for (const seat of seats) {
            const pricePaid = seat.category === 'vip' ? price_vip : price_std;
            await conn.execute(
                `INSERT INTO reservation_seats (reservation_id, seat_id, showtime_id, price_paid)
                 VALUES (?, ?, ?, ?) ON DUPLICATE KEY
                UPDATE reservation_id =
                VALUES (reservation_id), price_paid =
                VALUES (price_paid)`,
                [reservationId, seat.seat_id, showtimeId, pricePaid]
            );
        }

        await conn.commit();
        return {reservation_id: reservationId, total_price: totalPrice, seats: seats.length};
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}

/** Get all reservations for the authenticated user. */
async function getUserReservations(userId) {
    const [rows] = await pool.execute(
        `SELECT r.reservation_id,
                r.showtime_id,
                r.status,
                r.total_price,
                r.created_at,
                st.start_time,
                sh.title                              AS show_title,
                t.name                                AS theatre_name,
                t.location                            AS theatre_location,
                IF(COUNT(rs.id) = 0, JSON_ARRAY(), JSON_ARRAYAGG(
                        JSON_OBJECT(
                                'seat_id', rs.seat_id,
                                'row_label', s.row_label,
                                'seat_number', s.seat_number,
                                'category', s.category,
                                'price_paid', rs.price_paid
                        )
                                                   )) AS seats
         FROM reservations r
                  JOIN showtimes st ON st.showtime_id = r.showtime_id
                  JOIN shows sh ON sh.show_id = st.show_id
                  JOIN theatres t ON t.theatre_id = sh.theatre_id
                  LEFT JOIN reservation_seats rs ON rs.reservation_id = r.reservation_id
                  LEFT JOIN seats s ON s.seat_id = rs.seat_id
         WHERE r.user_id = ?
         GROUP BY r.reservation_id
         ORDER BY CASE r.status
                      WHEN 'confirmed' THEN 0
                      WHEN 'pending' THEN 1
                      WHEN 'cancelled' THEN 2
                      ELSE 3
                      END,
                  st.start_time ASC`,
        [userId]
    );

    // Parse the JSON_ARRAYAGG string returned by MariaDB
    return rows.map(row => ({
        ...row,
        seats: typeof row.seats === 'string' ? JSON.parse(row.seats) : row.seats,
    }));
}

/** Get a single reservation; only the owning user (or admin) may view it. */
async function getReservationById(reservationId, userId, role) {
    const [rows] = await pool.execute(
        `SELECT r.*,
                st.start_time,
                sh.title AS show_title,
                t.name   AS theatre_name
         FROM reservations r
                  JOIN showtimes st ON st.showtime_id = r.showtime_id
                  JOIN shows sh ON sh.show_id = st.show_id
                  JOIN theatres t ON t.theatre_id = sh.theatre_id
         WHERE r.reservation_id = ?`,
        [reservationId]
    );

    const res = rows[0];
    if (!res) {
        const err = new Error('Reservation not found.');
        err.status = 404;
        throw err;
    }
    if (role !== 'admin' && res.user_id !== userId) {
        const err = new Error('Forbidden.');
        err.status = 403;
        throw err;
    }
    return res;
}

/** Cancel a reservation (sets status to 'cancelled').
 *  reservation_seats rows are kept for history; the v_available_seats
 *  view already excludes them because status = 'cancelled'.
 */
async function cancelReservation(reservationId, userId, role) {
    const res = await getReservationById(reservationId, userId, role);

    if (res.status === 'cancelled') {
        const err = new Error('Reservation is already cancelled.');
        err.status = 400;
        throw err;
    }
    if (new Date(res.start_time) <= new Date()) {
        const err = new Error('Cannot cancel a reservation for a past showtime.');
        err.status = 400;
        throw err;
    }

    await pool.execute(
        "UPDATE reservations SET status = 'cancelled' WHERE reservation_id = ?",
        [reservationId]
    );

    return {message: 'Reservation cancelled.'};
}

/**
 * Modify a reservation (swap to a new set of seats).
 * Steps:
 *   1. Validate new seat IDs
 *   2. Check for conflicts with other active reservations
 *   3. Free the old seats by deleting their reservation_seats rows
 *   4. Insert new rows using ON DUPLICATE KEY UPDATE to handle any
 *      seats previously freed by a cancelled reservation
 */
async function modifyReservation(reservationId, userId, role, {seatIds}) {
    if (!Array.isArray(seatIds) || seatIds.length === 0) {
        const err = new Error('seat_ids array is required.');
        err.status = 400;
        throw err;
    }

    const res = await getReservationById(reservationId, userId, role);
    if (res.status === 'cancelled') {
        const err = new Error('Cannot modify a cancelled reservation.');
        err.status = 400;
        throw err;
    }
    if (new Date(res.start_time) <= new Date()) {
        const err = new Error('Cannot modify a reservation for a past showtime.');
        err.status = 400;
        throw err;
    }

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // Fetch pricing
        const [stRows] = await conn.execute(
            'SELECT price_std, price_vip FROM showtimes WHERE showtime_id = ?',
            [res.showtime_id]
        );
        const {price_std, price_vip} = stRows[0];

        // Validate new seats belong to this showtime's hall
        const placeholders = seatIds.map(() => '?').join(',');
        const [seats] = await conn.execute(
            `SELECT s.seat_id, s.category
             FROM seats s
                      JOIN showtimes st ON st.hall_id = s.hall_id
             WHERE s.seat_id IN (${placeholders})
               AND st.showtime_id = ?`,
            [...seatIds, res.showtime_id]
        );
        if (seats.length !== seatIds.length) {
            const err = new Error('One or more seat IDs are invalid.');
            err.status = 400;
            throw err;
        }

        // Check none of the new seats are taken by a different active reservation
        const [conflicts] = await conn.execute(
            `SELECT rs.seat_id
             FROM reservation_seats rs
                      JOIN reservations r ON r.reservation_id = rs.reservation_id
             WHERE rs.seat_id IN (${placeholders})
               AND rs.showtime_id = ?
               AND r.status != 'cancelled'
         AND rs.reservation_id != ?`,
            [...seatIds, res.showtime_id, reservationId]
        );
        if (conflicts.length > 0) {
            const err = new Error('One or more selected seats are already taken.');
            err.status = 409;
            throw err;
        }

        // Free the old seats by deleting their rows
        await conn.execute(
            'DELETE FROM reservation_seats WHERE reservation_id = ?',
            [reservationId]
        );

        const totalPrice = seats.reduce((sum, seat) => {
            return sum + (seat.category === 'vip' ? parseFloat(price_vip) : parseFloat(price_std));
        }, 0);

        for (const seat of seats) {
            const pricePaid = seat.category === 'vip' ? price_vip : price_std;
            await conn.execute(
                `INSERT INTO reservation_seats (reservation_id, seat_id, showtime_id, price_paid)
                 VALUES (?, ?, ?, ?) ON DUPLICATE KEY
                UPDATE reservation_id =
                VALUES (reservation_id), price_paid =
                VALUES (price_paid)`,
                [reservationId, seat.seat_id, res.showtime_id, pricePaid]
            );
        }

        await conn.execute(
            'UPDATE reservations SET total_price = ? WHERE reservation_id = ?',
            [totalPrice.toFixed(2), reservationId]
        );

        await conn.commit();
        return {reservation_id: reservationId, total_price: totalPrice, seats: seats.length};
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}

module.exports = {
    createReservation,
    getUserReservations,
    getReservationById,
    cancelReservation,
    modifyReservation,
};
