const propertyService = require('../services/propertyService');
const { ApiError } = require('../middlewares/errorHandler');
const { validationResult } = require('express-validator');

/**
 * Property Controller - Handles HTTP requests for properties
 */
class PropertyController {
  /**
   * Get all properties
   * @route GET /api/properties
   */
  async getAllProperties(req, res, next) {
    try {
      const properties = await propertyService.getAllProperties(req.query);
      res.status(200).json({
        status: 'success',
        ...properties,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get random properties
   * @route GET /api/properties/random
   */
  async getRandomProperties(req, res, next) {
    try {
      const properties = await propertyService.getRandomProperties(req.query.count);
      res.status(200).json({
        status: 'success',
        data: properties,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all property types
   * @route GET /api/properties/types
   */
  async getPropertyTypes(req, res, next) {
    try {
      const propertyTypes = await propertyService.getPropertyTypes();
      res.status(200).json({
        status: 'success',
        data: propertyTypes,
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Get property types with price statistics and counts
   * @route GET /api/properties/price-types
   */
  async getPropertyPriceTypes(req, res, next) {
    try {
      const propertyPriceTypes = await propertyService.getPropertyPriceTypes();
      res.status(200).json({
        status: 'success',
        data: propertyPriceTypes,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get property by ID
   * @route GET /api/properties/:id
   */
  async getPropertyById(req, res, next) {
    try {
      const property = await propertyService.getPropertyById(req.params.id);
      res.status(200).json({
        status: 'success',
        data: property,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new property
   * @route POST /api/properties
   */
  async createProperty(req, res, next) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, 'Validation error', true, null, errors.array());
      }
      
      // Process form data
      const propertyData = {
        ...req.body,
        // Convert numeric fields
        bedrooms: req.body.bedrooms ? parseInt(req.body.bedrooms) : undefined,
        bathrooms: req.body.bathrooms ? parseInt(req.body.bathrooms) : undefined,
        area: req.body.area ? parseFloat(req.body.area) : undefined,
        price: req.body.price ? parseFloat(req.body.price) : undefined,
        
        // Process features if they exist in form data
        features: req.body.features ? 
          (typeof req.body.features === 'string' ? 
            JSON.parse(req.body.features) : req.body.features) : 
          undefined,
          
        // Process highlights if they exist in form data
        highlights: req.body.highlights ? 
          (typeof req.body.highlights === 'string' ? 
            JSON.parse(req.body.highlights) : req.body.highlights) : 
          undefined,
            
        // Process nearby if they exist in form data
        nearby: req.body.nearby ? 
          (typeof req.body.nearby === 'string' ? 
            JSON.parse(req.body.nearby) : req.body.nearby) : 
          undefined,
            
        // Process views if they exist in form data
        views: req.body.views ? 
          (typeof req.body.views === 'string' ? 
            JSON.parse(req.body.views) : req.body.views) : 
          undefined,
            
        // Process facilities if they exist in form data
        facilities: req.body.facilities ? 
          (typeof req.body.facilities === 'string' ? 
            JSON.parse(req.body.facilities) : req.body.facilities) : 
          undefined,
            
        // Process contact info if it exists in form data
        contactInfo: req.body.contactInfo ? 
          (typeof req.body.contactInfo === 'string' ? 
            JSON.parse(req.body.contactInfo) : req.body.contactInfo) : 
          undefined,
            
        // Process social media if it exists in form data
        socialMedia: req.body.socialMedia ? 
          (typeof req.body.socialMedia === 'string' ? 
            JSON.parse(req.body.socialMedia) : req.body.socialMedia) : 
          undefined,
            
        // Process translations if they exist in form data
        translatedTitles: req.body.translatedTitles ? 
          (typeof req.body.translatedTitles === 'string' ? 
            JSON.parse(req.body.translatedTitles) : req.body.translatedTitles) : 
          undefined,
            
        translatedDescriptions: req.body.translatedDescriptions ? 
          (typeof req.body.translatedDescriptions === 'string' ? 
            JSON.parse(req.body.translatedDescriptions) : req.body.translatedDescriptions) : 
          undefined,
            
        translatedPaymentPlans: req.body.translatedPaymentPlans ? 
          (typeof req.body.translatedPaymentPlans === 'string' ? 
            JSON.parse(req.body.translatedPaymentPlans) : req.body.translatedPaymentPlans) : 
          undefined,
      };

      const property = await propertyService.createProperty(propertyData, req.user.id);
      res.status(201).json({
        status: 'success',
        data: property,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update property
   * @route PUT /api/properties/:id
   */
  async updateProperty(req, res, next) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, 'Validation error', true, null, errors.array());
      }

      const property = await propertyService.updateProperty(
        req.params.id,
        req.body,
        req.user.id
      );

      res.status(200).json({
        status: 'success',
        data: property,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete property
   * @route DELETE /api/properties/:id
   */
  async deleteProperty(req, res, next) {
    try {
      await propertyService.deleteProperty(req.params.id, req.user.id);
      res.status(200).json({
        status: 'success',
        message: 'Property deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add property image
   * @route POST /api/properties/:id/images
   */
  async addPropertyImage(req, res, next) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, 'Validation error', true, null, errors.array());
      }

      const image = await propertyService.addPropertyImage(
        req.params.id,
        req.body,
        req.user.id
      );

      res.status(201).json({
        status: 'success',
        data: image,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete property image
   * @route DELETE /api/properties/images/:id
   */
  async deletePropertyImage(req, res, next) {
    try {
      await propertyService.deletePropertyImage(req.params.id, req.user.id);
      res.status(200).json({
        status: 'success',
        message: 'Image deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Get properties for the authenticated user with pagination, search, and sorting
   * @route GET /api/properties/my-properties
   */
  async getUserProperties(req, res, next) {
    try {
      console.log("query", req.query)
      const result = await propertyService.getUserProperties(req.user.userId, req.query);
      res.status(200).json({
        status: 'success',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add property feature
   * @route POST /api/properties/:id/features
   */
  async addPropertyFeature(req, res, next) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, 'Validation error', true, null, errors.array());
      }

      const feature = await propertyService.addPropertyFeature(
        req.params.id,
        req.body,
        req.user.id
      );

      res.status(201).json({
        status: 'success',
        data: feature,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete property feature
   * @route DELETE /api/properties/features/:id
   */
  async deletePropertyFeature(req, res, next) {
    try {
      await propertyService.deletePropertyFeature(req.params.id, req.user.id);
      res.status(200).json({
        status: 'success',
        message: 'Feature deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PropertyController();
