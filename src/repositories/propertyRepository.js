const prisma = require('../utils/prisma');

/**
 * Property Repository - Handles database operations for properties
 */
class PropertyRepository {
  /**
   * Find all properties with pagination and filtering
   */
  async findAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      propertyType,
      listingType,
      minPrice,
      maxPrice,
      bedrooms,
      bathrooms,
      city,
      status = 'ACTIVE',
    } = options;

    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Build filter conditions
    const where = { status };
    
    if (propertyType) where.propertyType = propertyType;
    if (listingType) where.listingType = listingType;
    if (city) where.city = city;
    if (bedrooms) where.bedrooms = Number(bedrooms);
    if (bathrooms) where.bathrooms = Number(bathrooms);
    
    // Price range
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = Number(minPrice);
      if (maxPrice) where.price.lte = Number(maxPrice);
    }

    // Execute query
    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: {
          images: {
            where: { isFeatured: true },
            take: 1,
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: Number(limit),
      }),
      prisma.property.count({ where }),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      data: properties,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages,
        hasNext,
        hasPrev,
      },
    };
  }

  /**
   * Find property by ID
   */
  async findById(id) {
    return prisma.property.findUnique({
      where: { id: Number(id) },
      include: {
        images: true,
        features: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Create new property
   */
  async create(data) {
    return prisma.property.create({ด
      data: {
        title: data.title,
        description: data.description,
        price: data.price,
        address: data.address,
        city: data.city,
        country: data.country,
        zipCode: data.zipCode,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        area: data.area,
        propertyType: data.propertyType,
        listingType: data.listingType,
        status: data.status || 'ACTIVE',
        user: {
          connect: { id: data.userId },
        },
        images: data.images ? {
          create: data.images,
        } : undefined,
        features: data.features ? {
          create: data.features,
        } : undefined,
      },
      include: {
        images: true,
        features: true,
      },
    });
  }

  /**
   * Update property
   */
  async update(id, data) {
    return prisma.property.update({
      where: { id: Number(id) },
      data: {
        title: data.title,
        description: data.description,
        price: data.price,
        address: data.address,
        city: data.city,
        country: data.country,
        zipCode: data.zipCode,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        area: data.area,
        propertyType: data.propertyType,
        listingType: data.listingType,
        status: data.status,
      },
      include: {
        images: true,
        features: true,
      },
    });
  }

  /**
   * Delete property
   */
  async delete(id) {
    return prisma.property.delete({
      where: { id: Number(id) },
    });
  }

  /**
   * Add property image
   */
  async addImage(propertyId, imageData) {
    return prisma.propertyImage.create({
      data: {
        ...imageData,
        property: {
          connect: { id: Number(propertyId) },
        },
      },
    });
  }

  /**
   * Delete property image
   */
  async deleteImage(imageId) {
    return prisma.propertyImage.delete({
      where: { id: Number(imageId) },
    });
  }

  /**
   * Add property feature
   */
  async addFeature(propertyId, featureData) {
    return prisma.propertyFeature.create({
      data: {
        ...featureData,
        property: {
          connect: { id: Number(propertyId) },
        },
      },
    });
  }

  /**
   * Delete property feature
   */
  async deleteFeature(featureId) {
    return prisma.propertyFeature.delete({
      where: { id: Number(featureId) },
    });
  }
  
 
/**
 * Get random properties
 * @param {number} count - Number of properties to return
 * @returns {Promise<Array>} - Random properties
 */
async getRandomProperties(count = 4) {
  try {
    // Get properties with their images and listings
    const properties = await prisma.property.findMany({
      take: count,
      orderBy: {
        // Use random ordering
        id: 'asc',
      },
      include: {
        images: {
          where: {
            isFeatured: true,
          },
          take: 1,
        },
        listings: {
          where: {
            status: 'ACTIVE',
          },
          take: 1,
        },
        highlights: true,
        amenities: true,
        views: true,
      },
    });

    // If we don't have enough properties, try again without filtering
    if (properties.length < count) {
      return await prisma.property.findMany({
        take: count,
        orderBy: {
          id: 'asc',
        },
        include: {
          images: {
            take: 1,
          },
          listings: {
            take: 1,
          },
          highlights: true,
          amenities: true,
          views: true,
        },
      });
    }

    return properties;
  } catch (error) {
    console.error('Error in getRandomProperties:', error);
    throw error;
  }
}

}

module.exports = new PropertyRepository();
