const express = require('express');
const propertyController = require('../controllers/propertyController');
const apiKeyAuth = require('../middlewares/apiKeyAuth');
const authMiddleware = require('../middlewares/authMiddleware');
const { handlePropertyFormData } = require('../middlewares/uploadMiddleware');
const propertyFormValidation = require('../validations/propertyFormSchema');

const router = express.Router();

// Apply API key authentication to random properties endpoint
router.get('/random', apiKeyAuth, propertyController.getRandomProperties);

// Property types endpoint
router.get('/types', apiKeyAuth, propertyController.getPropertyTypes);

// Property price types endpoint
router.get('/price-types', apiKeyAuth, propertyController.getPropertyPriceTypes);

// My Properties endpoint - requires authentication
router.get('/backoffice/my-properties', authMiddleware.authenticate, propertyController.getUserProperties);

// Property CRUD routes
router.get('/', propertyController.getAllProperties);
router.get('/:id', propertyController.getPropertyById);

// Create property with form data and image upload
router.post('/', 
  authMiddleware.authenticate, 
  handlePropertyFormData, 
  propertyFormValidation,
  propertyController.createProperty
);

// Update property with form data and image upload
router.put('/:id', 
  authMiddleware.authenticate, 
  handlePropertyFormData, 
  propertyFormValidation,
  propertyController.updateProperty
);

// Delete property
router.delete('/:id', 
  authMiddleware.authenticate, 
  propertyController.deleteProperty
);

// Add property image
router.post('/:id/images', 
  authMiddleware.authenticate, 
  handlePropertyFormData, 
  propertyController.addPropertyImage
);

// Delete property image
router.delete('/images/:id', 
  authMiddleware.authenticate, 
  propertyController.deletePropertyImage
);

module.exports = router;