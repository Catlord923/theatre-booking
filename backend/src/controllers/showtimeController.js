// Controller layer for showtime routes. Delegates all business logic to showtimeService
// and forwards any errors to Express's central error handler via next(err).

const showtimeService = require('../services/showtimeService');

// Get all showtimes for a given show by showId
async function listForShow(req, res, next) {
    try {
        const showtimes = await showtimeService.getShowtimesForShow(req.params.showId);
        res.json(showtimes);
    } catch (err) {
        next(err);
    }
}

// Get details for a single showtime by ID
async function detail(req, res, next) {
    try {
        const showtime = await showtimeService.getShowtimeById(req.params.id);
        res.json(showtime);
    } catch (err) {
        next(err);
    }
}

module.exports = {listForShow, detail};
