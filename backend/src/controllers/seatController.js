// Controller layer for seat routes. Delegates all business logic to seatService
// and forwards any errors to Express's central error handler via next(err).

const seatService = require('../services/seatService');

// Get available seats for a showtime; optionally filtered by category via req.query
async function available(req, res, next) {
    try {
        const {category} = req.query;
        const seats = await seatService.getAvailableSeats(req.params.showtimeId, category);
        res.json(seats);
    } catch (err) {
        next(err);
    }
}

module.exports = {available};
