const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();



/**
 * Property Repository - Handles database operations for properties
 */
class PropertyRepository {

  constructor() {
    this.prisma = new PrismaClient();
  }

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
      zoneId,
      search,
      userId,
      // status = 'ACTIVE',
    } = options;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build filter conditions
    const where = {
      listings: {
      },
    }

    // Add search by title or description
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Filter by user ID if provided
    if (userId) {
      where.userId = Number(userId);
    }

    if (propertyType) where.propertyType = propertyType;
    if (listingType) where.listingType = listingType;
    if (city) where.city = city;
    if (bedrooms) where.bedrooms = Number(bedrooms);
    if (bathrooms) where.bathrooms = Number(bathrooms);

    // Price range
    if (minPrice || maxPrice) {
      where.listings = {
        some: {}
      };
      if (minPrice) where.listings.some.price = { ...where.listings.some.price, gte: Number(minPrice) };
      if (maxPrice) where.listings.some.price = { ...where.listings.some.price, lte: Number(maxPrice) };
    }

    if (zoneId) where.zoneId = Number(zoneId);
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
          listings: {
            where: {
              status: 'ACTIVE',
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
        listings: true,
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
    // Process features array if it exists
    const featuresData = data.features ? 
      Array.isArray(data.features) ? 
        data.features.map(feature => {
          // จำกัดความยาวของค่า value ไม่เกิน 255 ตัวอักษร
          const truncatedValue = typeof feature === 'string' ? feature.substring(0, 255) : String(feature).substring(0, 255);
          return {
            name: truncatedValue,
            value: truncatedValue
          };
        }) : [] 
      : [];
    
    // Process amenities array if it exists
    const amenitiesData = data.amenities ? 
      Array.isArray(data.amenities) ? 
        data.amenities.map(amenity => ({
          amenityType: amenity
        })) : [] 
      : [];
    
    // Process facilities object if it exists
    let facilitiesData = [];
    
    if (data.facilities) {
      // ตรวจสอบว่าเป็น JSON string หรือไม่
      let facilitiesObj;
      try {
        facilitiesObj = typeof data.facilities === 'string' ? 
          JSON.parse(data.facilities) : data.facilities;
      } catch (e) {
        console.error('Error parsing facilities:', e);
        facilitiesObj = {};
      }
      
      // ถ้าเป็น array ให้ใช้ตามที่ส่งมา
      if (Array.isArray(facilitiesObj)) {
        facilitiesData = facilitiesObj
          .filter(facility => facility && (facility.type || facility.facilityType) && (facility.category || facility.facilityCategory))
          .map(facility => {
            // ตรวจสอบว่า facilityType และ facilityCategory เป็น enum ที่ถูกต้อง
            return {
              facilityType: facility.type || facility.facilityType,
              facilityCategory: facility.category || facility.facilityCategory
            };
          });
      } 
      // ถ้าเป็น object ที่มีการจัดกลุ่มตามหมวดหมู่ (รูปแบบที่ส่งมาจาก frontend)
      else if (typeof facilitiesObj === 'object' && facilitiesObj !== null) {
        // แปลงชื่อหมวดหมู่จาก camelCase เป็น UPPERCASE_WITH_UNDERSCORE
        const categoryMap = {
          'fitnessAndSports': 'FITNESS_SPORTS',
          'commonAreas': 'COMMON_AREAS',
          'poolsAndRelaxation': 'POOLS_SPA_RELAXATION',
          'diningAndEntertainment': 'DINING_ENTERTAINMENT_LEISURE',
          'other': 'OTHER'
        };
        
        // แปลงชื่อ facility จาก camelCase เป็น UPPERCASE_WITH_UNDERSCORE
        const facilityMap = {
          // Fitness & Sports
          'basketballCourt': 'BASKETBALL_COURT',
          'fitness': 'FITNESS',
          'golfSimulator': 'GOLF_SIMULATOR',
          'joggingTrack': 'JOGGING_TRACK',
          'squashCourt': 'SQUASH_COURT',
          'tennisCourt': 'TENNIS_COURT',
          'yogaRoom': 'YOGA_ROOM',
          
          // Common Areas
          'greenArea': 'GREEN_AREA',
          'library': 'LIBRARY',
          'lobby': 'LOBBY',
          'meetingRoom': 'MEETING_ROOM',
          'skyGarden': 'SKY_GARDEN',
          'workingSpace': 'WORKING_SPACE',
          
          // Pools, Spa & Relaxation
          'kidsPool': 'KIDS_POOL',
          'onsen': 'ONSEN',
          'sauna': 'SAUNA',
          'skyPool': 'SKY_POOL',
          'spa': 'SPA',
          'salon': 'SALON',
          'swimmingPool': 'SWIMMING_POOL',
          
          // Dining, Entertainment & Leisure
          'bar': 'BAR',
          'clubhouse': 'CLUBHOUSE',
          'gameroom': 'GAMEROOM',
          'karaokeRoom': 'KARAOKE_ROOM',
          'miniTheater': 'MINI_THEATER',
          'poolTable': 'POOL_TABLE',
          'restaurant': 'RESTAURANT',
          'skyBar': 'SKY_BAR',
          
          // Other
          'security24hr': 'SECURITY_24HR',
          'cctv': 'CCTV',
          'conciergeServices': 'CONCIERGE_SERVICES',
          'evCharger': 'EV_CHARGER',
          'highSpeedLift': 'HIGH_SPEED_LIFT',
          'kidsClub': 'KIDS_CLUB'
        };
        
        // วนลูปแต่ละหมวดหมู่
        Object.entries(facilitiesObj).forEach(([category, facilities]) => {
          // แปลงชื่อหมวดหมู่เป็น enum ที่ถูกต้อง
          const mappedCategory = categoryMap[category] || category.toUpperCase();
          
          // วนลูปแต่ละ facility ในหมวดหมู่
          Object.entries(facilities).forEach(([facilityName, isEnabled]) => {
            // เพิ่มเฉพาะ facility ที่ถูกเลือก (true)
            if (isEnabled) {
              // แปลงชื่อ facility เป็น enum ที่ถูกต้อง
              const mappedFacilityType = facilityMap[facilityName] || facilityName.toUpperCase();
              
              facilitiesData.push({
                facilityType: mappedFacilityType,
                facilityCategory: mappedCategory
              });
            }
          });
        });
      }
    }

    console.log(facilitiesData);
    
    // Process views array if it exists
    let viewsData = [];
    
    if (data.views) {
      console.log('Original views data:', data.views);
      
      // ตรวจสอบว่าเป็น JSON string หรือไม่
      let viewsObj;
      try {
        viewsObj = typeof data.views === 'string' ? 
          JSON.parse(data.views) : data.views;
        console.log("Parsed viewsObj:", viewsObj);
      } catch (e) {
        console.error('Error parsing views:', e);
        viewsObj = {};
      }
      
      // แปลงชื่อ view จาก camelCase เป็น UPPERCASE_WITH_UNDERSCORE
      const viewMap = {
        'seaView': 'SEA_VIEW',
        'cityView': 'CITY_VIEW',
        'gardenView': 'GARDEN_VIEW',
        'lakeView': 'LAKE_VIEW',
        'mountainView': 'MOUNTAIN_VIEW',
        'poolView': 'POOL_VIEW'
      };
      
      // ถ้าเป็น array ให้ใช้ตามที่ส่งมา
      if (Array.isArray(viewsObj)) {
        viewsData = viewsObj
          .filter(view => view) // กรองค่า null และ undefined ออกไป
          .map(view => {
            // แปลงชื่อ view เป็น enum ที่ถูกต้อง
            const viewType = viewMap[view] || (typeof view === 'string' ? view.toUpperCase() : view);
            return { viewType };
          });
      }
      // ถ้าเป็น object ที่มีค่าเป็น boolean (รูปแบบที่ส่งมาจาก frontend)
      else if (typeof viewsObj === 'object' && viewsObj !== null) {
        // ทำเป็น array ของ objects ที่มี viewType ที่ถูกต้อง
        Object.entries(viewsObj).forEach(([viewName, isEnabled]) => {
          // เพิ่มเฉพาะ view ที่ถูกเลือก (true)
          if (isEnabled) {
            // แปลงชื่อ view เป็น enum ที่ถูกต้อง
            let viewType = viewMap[viewName] || viewName.toUpperCase();
            
            // ตรวจสอบว่า viewType เป็นค่าที่ถูกต้องตาม enum ใน schema.prisma
            const validViewTypes = ['SEA_VIEW', 'CITY_VIEW', 'GARDEN_VIEW', 'LAKE_VIEW', 'MOUNTAIN_VIEW', 'POOL_VIEW'];
            
            if (!validViewTypes.includes(viewType)) {
              console.warn(`Invalid viewType: ${viewType}, trying to fix...`);
              // พยายามแก้ไข viewType ให้ถูกต้อง
              if (viewName.includes('sea') || viewName.includes('Sea')) {
                viewType = 'SEA_VIEW';
              } else if (viewName.includes('city') || viewName.includes('City')) {
                viewType = 'CITY_VIEW';
              } else if (viewName.includes('garden') || viewName.includes('Garden')) {
                viewType = 'GARDEN_VIEW';
              } else if (viewName.includes('lake') || viewName.includes('Lake')) {
                viewType = 'LAKE_VIEW';
              } else if (viewName.includes('mountain') || viewName.includes('Mountain')) {
                viewType = 'MOUNTAIN_VIEW';
              } else if (viewName.includes('pool') || viewName.includes('Pool')) {
                viewType = 'POOL_VIEW';
              } else {
                console.warn(`Could not fix viewType: ${viewType}, skipping...`);
                return; // ข้ามไป
              }
              console.log(`Fixed viewType to: ${viewType}`);
            }
            
            viewsData.push({ viewType });
          }
        });
      }
    }
    
    console.log('Final viewsData:', viewsData);
    
    // Process highlights array if it exists
    let highlightsData = [];
    
    if (data.highlights) {
      // ตรวจสอบว่าเป็น JSON string หรือไม่
      let highlightsObj;
      try {
        highlightsObj = typeof data.highlights === 'string' ? 
          JSON.parse(data.highlights) : data.highlights;
      } catch (e) {
        console.error('Error parsing highlights:', e);
        highlightsObj = [];
      }
      
      // แปลงชื่อ highlight จาก camelCase เป็น UPPERCASE_WITH_UNDERSCORE
      const highlightMap = {
        // Room Types
        'duplex': 'DUPLEX',
        'penthouse': 'PENTHOUSE',
        'oneBedPlus': 'ONE_BED_PLUS',
        'duplexPenthouse': 'DUPLEX_PENTHOUSE',
        
        // Highlights
        'brandNewProperty': 'BRAND_NEW_PROPERTY',
        'petsAllowed': 'PETS_ALLOWED',
        'companyRegistration': 'COMPANY_REGISTRATION',
        'rentToOwn': 'RENT_TO_OWN',
        'npaAssets': 'NPA_ASSETS',
        'foreignerQuota': 'FOREIGNER_QUOTA',
        'saleDown': 'SALE_DOWN'
      };
      
      // ถ้าเป็น array ให้ใช้ตามที่ส่งมา
      if (Array.isArray(highlightsObj)) {
        highlightsData = highlightsObj
          .filter(highlight => highlight) // กรองค่า null และ undefined ออกไป
          .map(highlight => {
            // แปลงชื่อ highlight เป็น enum ที่ถูกต้อง
            const highlightType = highlightMap[highlight] || (typeof highlight === 'string' ? highlight.toUpperCase() : highlight);
            return { highlightType };
          });
      }
      // ถ้าเป็น object ที่มีค่าเป็น boolean (รูปแบบที่อาจส่งมาจาก frontend)
      else if (typeof highlightsObj === 'object' && highlightsObj !== null) {
        Object.entries(highlightsObj).forEach(([highlightName, isEnabled]) => {
          // เพิ่มเฉพาะ highlight ที่ถูกเลือก (true)
          if (isEnabled) {
            // แปลงชื่อ highlight เป็น enum ที่ถูกต้อง
            const highlightType = highlightMap[highlightName] || highlightName.toUpperCase();
            highlightsData.push({ highlightType });
          }
        });
      }
    }
    
    console.log('highlightsData:', highlightsData);
    
    // Process labels array if it exists
    const labelsData = data.labels ? 
      Array.isArray(data.labels) ? 
        data.labels.map(label => ({
          labelType: label
        })) : [] 
      : [];
    
    // Process nearby array if it exists
    const nearbyData = data.nearby ? 
      Array.isArray(data.nearby) ? 
        data.nearby.map(nearby => ({
          nearbyType: nearby.type,
          distance: nearby.distance
        })) : [] 
      : [];
    
    // Process images array if it exists
    const imagesData = data.images ? 
      Array.isArray(data.images) ? 
        data.images.map((image, index) => ({
          url: image.url,
          isFeatured: image.isFeatured || index === 0,
          sortOrder: image.sortOrder || index
        })) : [] 
      : [];
    
    // Process floor plans array if it exists
    const floorPlansData = data.floorPlans ? 
      Array.isArray(data.floorPlans) ? 
        data.floorPlans.map((plan, index) => ({
          url: plan.url,
          title: plan.title,
          description: plan.description,
          sortOrder: plan.sortOrder || index
        })) : [] 
      : [];
    
    // Process unit plans array if it exists
    const unitPlansData = data.unitPlans ? 
      Array.isArray(data.unitPlans) ? 
        data.unitPlans.map(plan => ({
          url: plan.url,
          title: plan.title,
          unitType: plan.unitType,
          area: plan.area,
          bedrooms: plan.bedrooms,
          bathrooms: plan.bathrooms
        })) : [] 
      : [];

    return prisma.property.create({
      data: {
        // Basic property info
        title: data.title,
        projectName: data.projectName,
        propertyCode: data.propertyCode,
        referenceId: data.referenceId,
        propertyType: data.propertyType,
        
        // Address info
        address: data.address,
        searchAddress: data.searchAddress,
        district: data.district,
        subdistrict: data.subdistrict,
        province: data.province,
        city: data.city,
        country: data.country || 'Thailand',
        zipCode: data.zipCode,
        latitude: data.latitude ? parseFloat(data.latitude) : null,
        longitude: data.longitude ? parseFloat(data.longitude) : null,
        
        // Zone relation
        zone: data.zoneId ? {
          connect: { id: parseInt(data.zoneId) }
        } : undefined,
        
        // Area info
        area: data.area ? parseFloat(data.area) : null,
        usableArea: data.usableArea ? parseFloat(data.usableArea) : null,
        
        // Land info
        landSizeRai: data.landSizeRai ? parseFloat(data.landSizeRai) : null,
        landSizeNgan: data.landSizeNgan ? parseFloat(data.landSizeNgan) : null,
        landSizeSqWah: data.landSizeSqWah ? parseFloat(data.landSizeSqWah) : null,
        landWidth: data.landWidth ? parseFloat(data.landWidth) : null,
        landLength: data.landLength ? parseFloat(data.landLength) : null,
        landShape: data.landShape,
        landGrade: data.landGrade,
        landAccess: data.landAccess,
        ownershipType: data.ownershipType,
        ownershipQuota: data.ownershipQuota,
        
        // Building info
        bedrooms: data.bedrooms ? parseInt(data.bedrooms) : null,
        bathrooms: data.bathrooms ? parseInt(data.bathrooms) : null,
        floors: data.floors ? parseInt(data.floors) : null,
        furnishing: data.furnishing,
        constructionYear: data.constructionYear ? parseInt(data.constructionYear) : null,
        communityFee: data.communityFee ? parseFloat(data.communityFee) : null,
        buildingUnit: data.buildingUnit,
        floor: data.floor ? parseInt(data.floor) : null,
        
        // Multilingual content
        description: data.description,
        translatedTitles: data.translatedTitles,
        translatedDescriptions: data.translatedDescriptions,
        paymentPlan: data.paymentPlan,
        translatedPaymentPlans: data.translatedPaymentPlans,
        
        // Contact and social media
        socialMedia: data.socialMedia,
        contactInfo: data.contactInfo,
        
        // Status and metadata
        status: data.status || 'ACTIVE',
        
        // User relation
        user: {
          connect: { id: 1 },
        },
        
        // Related entities
        images: imagesData.length > 0 ? {
          create: imagesData,
        } : undefined,
        
        features: featuresData.length > 0 ? {
          create: featuresData,
        } : undefined,
        
        amenities: amenitiesData.length > 0 ? {
          create: amenitiesData,
        } : undefined,
        
        facilities: facilitiesData.length > 0 ? {
          create: facilitiesData,
        } : undefined,
        
        // views: viewsData.length > 0 ? {
        //   create: viewsData,
        // } : undefined,
        
        // highlights: highlightsData.length > 0 ? {
        //   create: highlightsData,
        // } : undefined,
        
        labels: labelsData.length > 0 ? {
          create: labelsData,
        } : undefined,
        
        // nearbyPlaces: nearbyData.length > 0 ? {
        //   create: nearbyData,
        // } : undefined,
        
        // unitPlans: unitPlansData.length > 0 ? {
        //   create: unitPlansData,
        // } : undefined,
      },
      include: {
        images: true,
        features: true,
        amenities: true,
        facilities: true,
        views: true,
        highlights: true,
        labels: true,
        nearbyPlaces: true,
        unitPlans: true,
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
        take: Number(count),
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



  async findByUserId(userId, options = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build filter conditions
    const where = {
      userId: Number(userId),
    };

    // Add search filter if provided
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Execute query
    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: {
          images: true,
          listings: true,
          // Include view and inquiry counts
          _count: {
            select: {
              views: true,
              
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

    // Process properties to include view and inquiry counts
    const processedProperties = properties.map(property => ({
      ...property,
      viewCount: property._count?.views || 0,
      inquiryCount: property._count?.inquiries || 0,
      // Format the date
      formattedDate: property.createdAt ? new Date(property.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }) : 'N/A',
      // Get the featured image
      featuredImage: property.images && property.images.length > 0
        ? property.images.find(img => img.isFeatured) || property.images[0]
        : null,
    }));

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      properties: processedProperties,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages,
      hasNext,
      hasPrev,
    };
  };



}

module.exports = new PropertyRepository();
