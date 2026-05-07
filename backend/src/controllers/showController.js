// Controller layer for show routes. Delegates all business logic to showService
// and forwards any errors to Express's central error handler via next(err).

const showService = require('../services/showService');

// Get all shows; optionally filtered by theatreId, title, and/or date via req.query
async function list(req, res, next) {
    try {
        const {theatreId, title, date} = req.query;
        const shows = await showService.getAllShows({theatreId, title, date});
        res.json(shows);
    } catch (err) {
        next(err);
    }
}

// Get details for a single show by ID
async function detail(req, res, next) {
    try {
        const show = await showService.getShowById(req.params.id);
        res.json(show);
    } catch (err) {
        next(err);
    }
}

module.exports = {list, detail};