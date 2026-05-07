// Controller layer for reservation routes. Delegates all business logic to reservationService
// and forwards any errors to Express's central error handler via next(err).
// req.user is expected to be populated by auth middleware on all routes.

const reservationService = require('../services/reservationService');

// Create a new reservation; expects showtime_id and seat_ids in req.body
async function create(req, res, next) {
    try {
        const {showtime_id, seat_ids} = req.body;

        const result = await reservationService.createReservation({
            userId: req.user.user_id,
            showtimeId: showtime_id,
            seatIds: seat_ids,
        });
        res.status(201).json(result);
    } catch (err) {
        next(err);
    }
}

// Get all reservations belonging to the currently authenticated user
async function myReservations(req, res, next) {
    try {
        const reservations = await reservationService.getUserReservations(req.user.user_id);
        res.json(reservations);
    } catch (err) {
        next(err);
    }
}

// Get details for a single reservation by ID; service enforces ownership/role access
async function detail(req, res, next) {
    try {
        const reservation = await reservationService.getReservationById(
            req.params.id, req.user.user_id, req.user.role
        );
        res.json(reservation);
    } catch (err) {
        next(err);
    }
}

// Cancel a reservation by ID; service enforces ownership/role access
async function cancel(req, res, next) {
    try {
        const result = await reservationService.cancelReservation(
            req.params.id, req.user.user_id, req.user.role
        );
        res.json(result);
    } catch (err) {
        next(err);
    }
}

// Modify a reservation's seats by ID; expects seat_ids in req.body; service enforces ownership/role access
async function modify(req, res, next) {
    try {
        const result = await reservationService.modifyReservation(
            req.params.id, req.user.user_id, req.user.role, {seatIds: req.body.seat_ids}
        );
        res.json(result);
    } catch (err) {
        next(err);
    }
}

module.exports = {create, myReservations, detail, cancel, modify};
