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

      const property = await propertyService.createProperty(req.body, req.user.id);
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
