// Controller layer for theatre routes. Delegates all business logic to theatreService
// and forwards any errors to Express's central error handler via next(err).

const theatreService = require('../services/theatreService');

// Get all theatres; optionally filtered by name via req.query.search
async function list(req, res, next) {
    try {
        const theatres = await theatreService.getAllTheatres({search: req.query.search});
        res.json(theatres);
    } catch (err) {
        next(err);
    }
}

// Get details for a single theatre by ID
async function detail(req, res, next) {
    try {
        const theatre = await theatreService.getTheatreById(req.params.id);
        res.json(theatre);
    } catch (err) {
        next(err);
    }
}

module.exports = {list, detail};
