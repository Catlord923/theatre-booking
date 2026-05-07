// App entry point. Configures middleware, mounts routes, and starts the server.

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint; useful for uptime monitoring
app.get('/health', (req, res) => res.json({status: 'ok'}));

// Routes
app.use('/api', routes);

// Error handler; must be registered after all routes!
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Theatre Booking API running on http://localhost:${PORT}`);
});
