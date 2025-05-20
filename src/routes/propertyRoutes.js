const express = require('express');
const propertyController = require('../controllers/propertyController');
const apiKeyAuth = require('../middlewares/apiKeyAuth');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Apply API key authentication to random properties endpoint
router.get('/random', apiKeyAuth, propertyController.getRandomProperties);

// Property types endpoint
router.get('/types', apiKeyAuth, propertyController.getPropertyTypes);

// Property price types endpoint
router.get('/price-types', apiKeyAuth, propertyController.getPropertyPriceTypes);

// My Properties endpoint - requires authentication
router.get('/backoffice/my-properties', authMiddleware.authenticate, propertyController.getUserProperties);

// Other routes...
router.get('/', propertyController.getAllProperties);
router.get('/:id', propertyController.getPropertyById);

module.exports = router;