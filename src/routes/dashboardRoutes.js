const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middlewares/authMiddleware');

// Dashboard stats route (requires authentication)
router.get('/stats', authMiddleware.authenticate, dashboardController.getDashboardStats);

module.exports = router;
