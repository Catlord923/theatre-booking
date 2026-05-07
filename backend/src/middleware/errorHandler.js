// Central Express error handler. Must be registered last in the middleware chain.

/**
 * Centralised error handler.
 * Catches anything passed to next(err).
 */
function errorHandler(err, req, res, next) {
    console.error(err);

    // Duplicate entry (e.g. seat already booked or email taken)
    if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({error: 'Duplicate entry - resource already exists.'});
    }

    const status = err.status || 500;
    const message = err.message || 'Internal server error.';
    res.status(status).json({error: message});
}

module.exports = errorHandler;
