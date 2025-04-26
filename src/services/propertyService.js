const propertyRepository = require('../repositories/propertyRepository');
const { ApiError } = require('../middlewares/errorHandler');

/**
 * Property Service - Business logic for properties
 */
class PropertyService {
  /**
   * Get all properties with pagination and filtering
   */
  async getAllProperties(queryParams) {
    try {
      return await propertyRepository.findAll(queryParams);
    } catch (error) {
      throw new ApiError(500, 'Error fetching properties', false, error.stack);
    }
  }

  /**
 * Get random properties
 * @param {number} count - Number of properties to return
 * @returns {Promise<Array>} - Random properties
 */
async getRandomProperties(count = 4) {
  try {
    return await propertyRepository.getRandomProperties(count);
  } catch (error) {
    throw new ApiError(500, 'Error fetching random properties', false, error.stack);
  }
}


  /**
   * Get property by ID
   */
  async getPropertyById(id) {
    try {
      const property = await propertyRepository.findById(id);
      
      if (!property) {
        throw new ApiError(404, `Property with ID ${id} not found`);
      }
      
      return property;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Error fetching property', false, error.stack);
    }
  }

  /**
   * Create new property
   */
  async createProperty(propertyData, userId) {
    try {
      // Add user ID to property data
      const data = { ...propertyData, userId };
      
      return await propertyRepository.create(data);
    } catch (error) {
      throw new ApiError(500, 'Error creating property', false, error.stack);
    }
  }

  /**
   * Update property
   */
  async updateProperty(id, propertyData, userId) {
    try {
      // Check if property exists and belongs to user
      const property = await propertyRepository.findById(id);
      
      if (!property) {
        throw new ApiError(404, `Property with ID ${id} not found`);
      }
      
      // Check if user is owner or admin
      if (property.userId !== userId && req.user.role !== 'ADMIN') {
        throw new ApiError(403, 'Not authorized to update this property');
      }
      
      return await propertyRepository.update(id, propertyData);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Error updating property', false, error.stack);
    }
  }

  /**
   * Delete property
   */
  async deleteProperty(id, userId) {
    try {
      // Check if property exists and belongs to user
      const property = await propertyRepository.findById(id);
      
      if (!property) {
        throw new ApiError(404, `Property with ID ${id} not found`);
      }
      
      // Check if user is owner or admin
      if (property.userId !== userId && req.user.role !== 'ADMIN') {
        throw new ApiError(403, 'Not authorized to delete this property');
      }
      
      return await propertyRepository.delete(id);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Error deleting property', false, error.stack);
    }
  }

  /**
   * Add property image
   */
  async addPropertyImage(propertyId, imageData, userId) {
    try {
      // Check if property exists and belongs to user
      const property = await propertyRepository.findById(propertyId);
      
      if (!property) {
        throw new ApiError(404, `Property with ID ${propertyId} not found`);
      }
      
      // Check if user is owner or admin
      if (property.userId !== userId && req.user.role !== 'ADMIN') {
        throw new ApiError(403, 'Not authorized to add images to this property');
      }
      
      return await propertyRepository.addImage(propertyId, imageData);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Error adding property image', false, error.stack);
    }
  }

  /**
   * Delete property image
   */
  async deletePropertyImage(imageId, userId) {
    try {
      // Find the image
      const image = await prisma.propertyImage.findUnique({
        where: { id: Number(imageId) },
        include: { property: true },
      });
      
      if (!image) {
        throw new ApiError(404, `Image with ID ${imageId} not found`);
      }
      
      // Check if user is owner or admin
      if (image.property.userId !== userId && req.user.role !== 'ADMIN') {
        throw new ApiError(403, 'Not authorized to delete this image');
      }
      
      return await propertyRepository.deleteImage(imageId);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Error deleting property image', false, error.stack);
    }
  }

  /**
   * Add property feature
   */
  async addPropertyFeature(propertyId, featureData, userId) {
    try {
      // Check if property exists and belongs to user
      const property = await propertyRepository.findById(propertyId);
      
      if (!property) {
        throw new ApiError(404, `Property with ID ${propertyId} not found`);
      }
      
      // Check if user is owner or admin
      if (property.userId !== userId && req.user.role !== 'ADMIN') {
        throw new ApiError(403, 'Not authorized to add features to this property');
      }
      
      return await propertyRepository.addFeature(propertyId, featureData);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Error adding property feature', false, error.stack);
    }
  }

  /**
   * Delete property feature
   */
  async deletePropertyFeature(featureId, userId) {
    try {
      // Find the feature
      const feature = await prisma.propertyFeature.findUnique({
        where: { id: Number(featureId) },
        include: { property: true },
      });
      
      if (!feature) {
        throw new ApiError(404, `Feature with ID ${featureId} not found`);
      }
      
      // Check if user is owner or admin
      if (feature.property.userId !== userId && req.user.role !== 'ADMIN') {
        throw new ApiError(403, 'Not authorized to delete this feature');
      }
      
      return await propertyRepository.deleteFeature(featureId);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Error deleting property feature', false, error.stack);
    }
  }
}

module.exports = new PropertyService();
