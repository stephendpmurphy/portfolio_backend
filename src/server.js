const express = require('express');
const cors = require('cors');
const logger = require('./middleware/logger');
const rateLimit = require('express-rate-limit');

// Listen on the provided PORT or fallback to port 5000
const PORT = process.env.PORT || 5000;

// Create the express app instance
const app = express();

// Create a new rate limiter config
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // 100 reqs per 'windowMs'
});

// Init Middleware
app.use(cors());
app.use(limiter);
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(logger);
// Setup the router
app.use('/api/skills', require('./api/skills'));

// Start listening on the specified port and emit a message when we start
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));