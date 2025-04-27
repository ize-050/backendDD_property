const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Zone Service - Handles business logic for zones
 */
class ZoneService {
  /**
   * Get all zones
   * @param {Object} filters - Query filters
   * @returns {Promise<Array>} - List of zones
   */
  async getAllZones(filters = {}) {
    try {
      const { city, province, search, sort = 'name', order = 'asc' } = filters;
      
      // Build filter conditions
      const where = {};
      
      if (city) {
        where.city = city;
      }
      
      if (province) {
        where.province = province;
      }
      
      if (search) {
        where.OR = [
          { name: { contains: search } },
          { nameEn: { contains: search } },
          { nameTh: { contains: search } },
          { description: { contains: search } }
        ];
      }
      
      // Get zones with filters
      const zones = await prisma.zone.findMany({
        where,
        orderBy: {
          [sort]: order.toLowerCase()
        }
      });
      
      return zones;
    } catch (error) {
      console.error('Error in getAllZones service:', error);
      throw error;
    }
  }
  
  /**
   * Get zone by ID
   * @param {number} id - Zone ID
   * @returns {Promise<Object>} - Zone object
   */
  async getZoneById(id) {
    try {
      const zone = await prisma.zone.findUnique({
        where: { id: Number(id) }
      });
      
      if (!zone) {
        throw new Error('Zone not found');
      }
      
      return zone;
    } catch (error) {
      console.error('Error in getZoneById service:', error);
      throw error;
    }
  }
  
  /**
   * Get properties by zone ID
   * @param {number} zoneId - Zone ID
   * @param {Object} filters - Query filters
   * @returns {Promise<Object>} - Properties in the zone
   */
  async getPropertiesByZone(zoneId, filters = {}) {
    try {
      const { 
        page = 1, 
        limit = 10,
        propertyType,
        minPrice,
        maxPrice,
        bedrooms,
        bathrooms
      } = filters;
      
      const skip = (page - 1) * Number(limit);
      
      // Build filter conditions
      const where = {
        zoneId: Number(zoneId)
      };
      
      if (propertyType) {
        where.propertyType = propertyType;
      }
      
      if (minPrice || maxPrice) {
        where.propertyListings = {
          some: {
            price: {
              ...(minPrice && { gte: Number(minPrice) }),
              ...(maxPrice && { lte: Number(maxPrice) })
            }
          }
        };
      }
      
      if (bedrooms) {
        where.bedrooms = Number(bedrooms);
      }
      
      if (bathrooms) {
        where.bathrooms = Number(bathrooms);
      }
      
      // Get total count
      const total = await prisma.property.count({ where });
      
      // Get properties
      const properties = await prisma.property.findMany({
        where,
        include: {
          propertyImages: {
            orderBy: [
              { isFeatured: 'desc' },
              { sortOrder: 'asc' }
            ]
          },
          propertyListings: {
            take: 1,
            orderBy: {
              createdAt: 'desc'
            }
          },
          zone: true
        },
        skip,
        take: Number(limit),
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      return {
        data: properties,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit))
        }
      };
    } catch (error) {
      console.error('Error in getPropertiesByZone service:', error);
      throw error;
    }
  }
  
  /**
   * Get cities with zones
   * @returns {Promise<Array>} - List of cities with their zones
   */
  async getCitiesWithZones() {
    try {
      // Get all zones grouped by city
      const zones = await prisma.zone.findMany({
        orderBy: [
          { city: 'asc' },
          { name: 'asc' }
        ]
      });
      
      // Group zones by city
      const citiesWithZones = zones.reduce((acc, zone) => {
        if (!acc[zone.city]) {
          acc[zone.city] = {
            city: zone.city,
            province: zone.province,
            zones: []
          };
        }
        
        acc[zone.city].zones.push(zone);
        return acc;
      }, {});
      
      return Object.values(citiesWithZones);
    } catch (error) {
      console.error('Error in getCitiesWithZones service:', error);
      throw error;
    }
  }
}

module.exports = new ZoneService();
