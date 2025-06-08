const propertyRepository = require('../repositories/propertyRepository');
const { ApiError } = require('../middlewares/errorHandler');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
      const properties = await propertyRepository.getRandomProperties(count);

      const propertiesWithFullImageUrls = properties.map(property => {
        const propertyWithFullUrls = { ...property };
        const propertyId = property.id;

        if (property.images && Array.isArray(property.images) && property.images.length > 0) {
          const sortedImages = [...property.images].sort((a, b) => a.sortOrder - b.sortOrder);
          
          propertyWithFullUrls.images = sortedImages.map((image, index) => {
            const imageWithFullUrl = { ...image };
            
            if (image.url && image.url.startsWith('/')) {
              imageWithFullUrl.url = `${process.env.NEXT_PUBLIC_IMAGE_URL}${image.url}`;
            } else {
              const filename = `property-img-0${index + 1}.png`;
              const newUrl = `/images/properties/${propertyId}/${filename}`;
              imageWithFullUrl.url = `${process.env.NEXT_PUBLIC_IMAGE_URL}${newUrl}`;
            }

            return imageWithFullUrl;
          });
          
          const featuredImage = propertyWithFullUrls.images.find(img => img.isFeatured) || propertyWithFullUrls.images[0];
          propertyWithFullUrls.featuredImage = featuredImage;
          
        } else {
          const defaultImages = [
            {
              id: 0,
              url: `${process.env.NEXT_PUBLIC_IMAGE_URL}/images/properties/${propertyId}/property-img-01.png`,
              isFeatured: true,
              sortOrder: 0
            },
            {
              id: 1,
              url: `${process.env.NEXT_PUBLIC_IMAGE_URL}/images/properties/property-img-0${propertyId}.png`,
              isFeatured: false,
              sortOrder: 1
            }
          ];
          
          propertyWithFullUrls.images = defaultImages;
          propertyWithFullUrls.featuredImage = defaultImages[0];
        }

        return propertyWithFullUrls;
      });

      return propertiesWithFullImageUrls;
    } catch (error) {
      throw new ApiError(500, 'Error fetching random properties', false, error.stack);
    }
  }


  /**
   * Get property by ID
   */
  async getPropertyById(id) {
    try {
      const properties = await propertyRepository.findById(id);

      if (!properties) {
        throw new ApiError(404, `Property with ID ${id} not found`);
      }
      return properties;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Error fetching property', false, error.stack);
    }
  }

  /**
   * Create new property
   */
  async createProperty(propertyData) {
    try {
      // Generate property code if needed
      if (!propertyData.propertyCode) {
        propertyData.propertyCode = await this.generateNextPropertyCode();
      }

      // Create property
      const newProperty = await propertyRepository.create(propertyData);
      


      return newProperty;
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
      if (property.userId !== userId) {
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
      if (property.userId !== userId) {
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
      if (image.property.userId !== userId) {
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
      if (property.userId !== userId) {
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
      if (feature.property.userId !== userId) {
        throw new ApiError(403, 'Not authorized to delete this feature');
      }

      return await propertyRepository.deleteFeature(featureId);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Error deleting property feature', false, error.stack);
    }
  }

  /**
   * Get property types with price statistics and counts
   * @returns {Promise<Array>} - Property types with counts and images
   */
  async getPropertyPriceTypes() {
    try {
      // กำหนดลำดับการแสดงผลตามที่ต้องการ
      const customOrder = [
        'CONDO', // Condominium
        'VILLA', // Pool villa
        'HOTEL', // Hotel
        'HOUSE', // House
        'TOWNHOUSE',
        'LAND',
        'APARTMENT',
        'COMMERCIAL',
        'OFFICE',
        'RETAIL',
        'WAREHOUSE',
        'FACTORY',
        'RESORT'
      ];
      
      // ดึงข้อมูลจำนวนอสังหาริมทรัพย์ในแต่ละประเภท
      const propertyCounts = await prisma.property.groupBy({
        by: ['propertyType'],
        _count: {
          id: true
        }
      });
      
      // สร้าง map ของจำนวนอสังหาริมทรัพย์แต่ละประเภท
      const countMap = {};
      propertyCounts.forEach(item => {
        countMap[item.propertyType] = item._count.id;
      });
      
      // สร้างข้อมูลประเภทอสังหาริมทรัพย์ตามลำดับที่กำหนด
      const propertyTypes = customOrder.map((type, index) => ({
        id: index + 1,
        name: type,
        nameTh: this.getPropertyTypeNameTh(type),
        description: this.getPropertyTypeDescription(type),
        count: countMap[type] || 0,
        image: this.getPropertyTypeImage(type)
      }));
      
      return propertyTypes;
    } catch (error) {
      throw new ApiError(500, 'Error fetching property price types', false, error.stack);
    }
  }

  /**
   * Get image URL for property type
   * @param {string} type - Property type
   * @returns {string} - Image URL for property type
   */
  getPropertyTypeImage(type) {
    const baseUrl = `${process.env.NEXT_PUBLIC_IMAGE_URL}/images/property-types/`;
    const imageMapping = {
      CONDO: `${baseUrl}condo.jpg`,
      HOUSE: `${baseUrl}house.jpg`,
      TOWNHOUSE: `${baseUrl}townhouse.jpg`,
      VILLA: `${baseUrl}villa.jpg`,
      LAND: `${baseUrl}land.jpg`,
      APARTMENT: `${baseUrl}apartment.jpg`,
      COMMERCIAL: `${baseUrl}commercial.jpg`,
      OFFICE: `${baseUrl}office.jpg`,
      RETAIL: `${baseUrl}retail.jpg`,
      WAREHOUSE: `${baseUrl}warehouse.jpg`,
      FACTORY: `${baseUrl}factory.jpg`,
      HOTEL: `${baseUrl}hotel.jpg`,
      RESORT: `${baseUrl}resort.jpg`
    };
    
    return imageMapping[type] || `${baseUrl}default.jpg`;
  }

  /**
   * Get all property types
   * @returns {Promise<Array>} - All property types
   */
  async getPropertyTypes() {
    try {
      // ดึงค่า enum PropertyType จาก Prisma
      const propertyTypes = Object.keys(prisma.$Enums.PropertyType);
      
      // สร้าง array ของ objects ที่มี id และ name
      const formattedPropertyTypes = propertyTypes.map((type, index) => ({
        id: index + 1,
        name: type,
        // เพิ่มชื่อภาษาไทยสำหรับแต่ละประเภท
        nameTh: this.getPropertyTypeNameTh(type),
        // เพิ่มคำอธิบายสำหรับแต่ละประเภท
        description: this.getPropertyTypeDescription(type)
      }));
      
      return formattedPropertyTypes;
    } catch (error) {
      throw new ApiError(500, 'Error fetching property types', false, error.stack);
    }
  }
  
  /**
   * Get Thai name for property type
   * @param {string} type - Property type in English
   * @returns {string} - Thai name for property type
   */
  getPropertyTypeNameTh(type) {
    const nameMapping = {
      CONDO: 'คอนโดมิเนียม',
      HOUSE: 'บ้านเดี่ยว',
      TOWNHOUSE: 'ทาวน์เฮาส์',
      VILLA: 'วิลล่า',
      LAND: 'ที่ดิน',
      APARTMENT: 'อพาร์ทเมนท์',
      COMMERCIAL: 'อาคารพาณิชย์',
      OFFICE: 'สำนักงาน',
      RETAIL: 'ร้านค้า',
      WAREHOUSE: 'คลังสินค้า',
      FACTORY: 'โรงงาน',
      HOTEL: 'โรงแรม',
      RESORT: 'รีสอร์ท'
    };
    
    return nameMapping[type] || type;
  }
  
  /**
   * Get description for property type
   * @param {string} type - Property type
   * @returns {string} - Description for property type
   */
  getPropertyTypeDescription(type) {
    const descriptionMapping = {
      CONDO: 'ห้องชุดในอาคารที่พักอาศัยรวม มีพื้นที่ส่วนกลางและสิ่งอำนวยความสะดวกร่วมกัน',
      HOUSE: 'บ้านเดี่ยวที่ตั้งอยู่บนที่ดินแยกเป็นสัดส่วน มีรั้วรอบขอบชิด',
      TOWNHOUSE: 'บ้านที่มีผนังติดกับบ้านข้างเคียง ตั้งอยู่บนพื้นที่แคบยาว',
      VILLA: 'บ้านพักตากอากาศหรือบ้านหรูที่มีการออกแบบพิเศษ',
      LAND: 'ที่ดินเปล่าสำหรับการพัฒนาหรือลงทุน',
      APARTMENT: 'อาคารที่พักอาศัยให้เช่า มักมีเจ้าของเป็นบุคคลเดียว',
      COMMERCIAL: 'อาคารสำหรับการพาณิชย์ มักมีพื้นที่ค้าขายด้านล่างและที่พักอาศัยด้านบน',
      OFFICE: 'พื้นที่สำหรับสำนักงานหรือการทำธุรกิจ',
      RETAIL: 'พื้นที่สำหรับร้านค้าปลีกหรือการบริการ',
      WAREHOUSE: 'อาคารสำหรับเก็บสินค้าหรือวัตถุดิบ',
      FACTORY: 'โรงงานสำหรับการผลิตสินค้า',
      HOTEL: 'สถานที่พักแรมสำหรับนักท่องเที่ยวหรือผู้มาเยือน',
      RESORT: 'ที่พักตากอากาศที่มีสิ่งอำนวยความสะดวกครบครัน'
    };
    
    return descriptionMapping[type] || '';
  }
  /**
   * Get properties for a specific user with pagination, search, and sorting
   * @param {number} userId - User ID
   * @param {Object} queryParams - Query parameters for pagination, search, and sorting
   * @returns {Promise<Object>} - Properties with pagination metadata
   */
  async getUserProperties(userId, queryParams) {
    try {
      if (!userId) {
        throw new ApiError(400, 'User ID is required');
      }
      
      const properties = await propertyRepository.findByUserId(userId, queryParams);
      console.log(properties);
      return properties;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Error fetching user properties', false, error.stack);
    }
  }

  /**
   * Generate the next property code
   * Format: DP000001, DP000002, etc.
   * @returns {Promise<string>} The next property code
   */
  async generateNextPropertyCode() {
    try {
      // Get the latest property sorted by propertyCode in descending order
      const latestProperty = await propertyRepository.findLatestPropertyCode();
      
      // If no properties exist, start from DP000001
      if (!latestProperty) {
        return 'DP00001';
      }
      
      // Extract the number part and increment
      const codePrefix = 'DP';
      const currentCode = latestProperty.propertyCode || '';
      let numericPart = 1;
      
      if (currentCode.startsWith(codePrefix)) {
        const numericString = currentCode.substring(codePrefix.length);
        numericPart = parseInt(numericString, 10) + 1;
      }
      
      // Format the new code with leading zeros (6 digits)
      const paddedNumber = numericPart.toString().padStart(5, '0');
      return `${codePrefix}${paddedNumber}`;
    } catch (error) {
      console.error('Error generating next property code:', error);
      throw error;
    }
  }
}

module.exports = new PropertyService();
