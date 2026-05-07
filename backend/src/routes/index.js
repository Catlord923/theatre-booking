// Central router. Mounts all API routes and applies middleware where needed.

const {Router} = require('express');
const {authenticate} = require('../middleware/auth');

const authCtrl = require('../controllers/authController');
const theatreCtrl = require('../controllers/theatreController');
const showCtrl = require('../controllers/showController');
const showtimeCtrl = require('../controllers/showtimeController');
const seatCtrl = require('../controllers/seatController');
const reservationCtrl = require('../controllers/reservationController');

const router = Router();

// Auth
router.post('/register', authCtrl.register);
router.post('/login', authCtrl.login);
router.post('/auth/refresh', authCtrl.refresh);

// Theatres
router.get('/theatres', theatreCtrl.list);
router.get('/theatres/:id', theatreCtrl.detail);

// Shows
router.get('/shows', showCtrl.list);
router.get('/shows/:id', showCtrl.detail);

// Showtimes
router.get('/shows/:showId/showtimes', showtimeCtrl.listForShow);
router.get('/showtimes/:id', showtimeCtrl.detail);

// Seats
router.get('/showtimes/:showtimeId/seats', seatCtrl.available);

// Reservations (all routes require authentication)
router.post('/reservations', authenticate, reservationCtrl.create);
router.get('/user/reservations', authenticate, reservationCtrl.myReservations);
router.get('/reservations/:id', authenticate, reservationCtrl.detail);
router.patch('/reservations/:id/cancel', authenticate, reservationCtrl.cancel);
router.put('/reservations/:id', authenticate, reservationCtrl.modify);

module.exports = router;
