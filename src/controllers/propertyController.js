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
      const userId = req.user.userId;
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, 'Validation error', true, null, errors.array());
      }

      const parseJsonField = (field) => {
        if (!field) return undefined;
        if (typeof field === 'string') {
          try {
            return JSON.parse(field);
          } catch (error) {
            return field;
          }
        }
        return field;
      };

      // Process form data - convert numeric fields and parse JSON strings
      const propertyData = {
        ...req.body,
        // Convert numeric fields
        userId: userId,
        listings : JSON.parse(req.body.listings),
        bedrooms: req.body.bedrooms ? parseInt(req.body.bedrooms, 10) : undefined,
        bathrooms: req.body.bathrooms ? parseInt(req.body.bathrooms, 10) : undefined,
        area: req.body.area ? parseFloat(req.body.area) : undefined,
        price: req.body.price ? parseFloat(req.body.price) : undefined,
        promotionalPrice: req.body.promotionalPrice ? parseFloat(req.body.promotionalPrice) : undefined,
        rentalPrice: req.body.rentalPrice ? parseFloat(req.body.rentalPrice) : undefined,
        shortTerm3Months: req.body.shortTerm3Months ? parseFloat(req.body.shortTerm3Months) : undefined,
        shortTerm6Months: req.body.shortTerm6Months ? parseFloat(req.body.shortTerm6Months) : undefined,
        shortTerm1Year: req.body.shortTerm1Year ? parseFloat(req.body.shortTerm1Year) : undefined,
        zone_id : req.body.zone_id ? parseInt(req.body.zone_id, 10) : undefined,
        // Parse JSON strings for various fields
        features: parseJsonField(req.body.features),
        highlights: parseJsonField(req.body.highlights),
        nearby: parseJsonField(req.body.nearby),
        views: parseJsonField(req.body.views),
        facilities: parseJsonField(req.body.facilities),
        amenities: parseJsonField(req.body.amenities),
        labels: parseJsonField(req.body.labels),
        unitPlans: parseJsonField(req.body.unitPlans),
        floorPlans: parseJsonField(req.body.floorPlans),
        contactInfo: parseJsonField(req.body.contactInfo),
        socialMedia: parseJsonField(req.body.socialMedia),
        
        // Parse translations
        translatedTitles: parseJsonField(req.body.translatedTitles),
        translatedDescriptions: parseJsonField(req.body.translatedDescriptions),
        translatedPaymentPlans: parseJsonField(req.body.translatedPaymentPlans),
      };
      console.log('propertyData.images:', propertyData.images);
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

      // Define a local function for parsing JSON
      const parseJsonField = (field) => {
        if (!field) return undefined;
        if (typeof field === 'string') {
          try {
            return JSON.parse(field);
          } catch (error) {
            return field;
          }
        }
        return field;
      };

      // Process form data similar to create
      const propertyData = {
        ...req.body,
        // Convert numeric fields
        bedrooms: req.body.bedrooms ? parseInt(req.body.bedrooms, 10) : undefined,
        bathrooms: req.body.bathrooms ? parseInt(req.body.bathrooms, 10) : undefined,
        area: req.body.area ? parseFloat(req.body.area) : undefined,
        price: req.body.price ? parseFloat(req.body.price) : undefined,
        promotionalPrice: req.body.promotionalPrice ? parseFloat(req.body.promotionalPrice) : undefined,
        rentalPrice: req.body.rentalPrice ? parseFloat(req.body.rentalPrice) : undefined,
        shortTerm3Months: req.body.shortTerm3Months ? parseFloat(req.body.shortTerm3Months) : undefined,
        shortTerm6Months: req.body.shortTerm6Months ? parseFloat(req.body.shortTerm6Months) : undefined,
        shortTerm1Year: req.body.shortTerm1Year ? parseFloat(req.body.shortTerm1Year) : undefined,
        
        // Parse JSON strings for various fields using the helper method
        features: parseJsonField(req.body.features),
        highlights: parseJsonField(req.body.highlights),
        nearby: parseJsonField(req.body.nearby),
        views: parseJsonField(req.body.views),
        facilities: parseJsonField(req.body.facilities),
        amenities: parseJsonField(req.body.amenities),
        labels: parseJsonField(req.body.labels),
        unitPlans: parseJsonField(req.body.unitPlans),
        floorPlans: parseJsonField(req.body.floorPlans),
        contactInfo: parseJsonField(req.body.contactInfo),
        socialMedia: parseJsonField(req.body.socialMedia),
        
        // Parse translations
        translatedTitles: parseJsonField(req.body.translatedTitles),
        translatedDescriptions: parseJsonField(req.body.translatedDescriptions),
        translatedPaymentPlans: parseJsonField(req.body.translatedPaymentPlans),
      };

      const property = await propertyService.updateProperty(
        req.params.id,
        propertyData,
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

  /**
   * Get the next property code
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   */
  async getNextPropertyCode(req, res) {
    try {
      const nextCode = await propertyService.generateNextPropertyCode();
      res.status(200).json({ success: true, propertyCode: nextCode });
    } catch (error) {
      console.error('Error getting next property code:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to get next property code',
        error: error.message 
      });
    }
  }

  /**
   * Duplicate a property
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   * @returns {Promise<void>}
   */
  async duplicateProperty(req, res, next) {
    try {
      const duplicatedProperty = await propertyService.duplicateProperty(req.params.id, req.user.id);
      res.status(201).json({
        status: 'success',
        message: 'Property duplicated successfully',
        data: duplicatedProperty,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PropertyController();
