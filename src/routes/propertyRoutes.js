const express = require('express');
const propertyController = require('../controllers/propertyController');
const apiKeyAuth = require('../middlewares/apiKeyAuth');

const router = express.Router();

// Apply API key authentication to random properties endpoint
router.get('/random', apiKeyAuth, propertyController.getRandomProperties);

// Other routes...
router.get('/', propertyController.getAllProperties);
router.get('/:id', propertyController.getPropertyById);
// ...

module.exports = router;