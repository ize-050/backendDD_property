const { PrismaClient } = require('@prisma/client');
const path = require("path");
const fs = require("fs");
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
          listings: true,
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
        features:true,
        listings: true,
        highlights:true,
        facilities:true,
        amenities:{
           where: {
            active: true
          }
        },
        views:true,
        nearbyPlaces:{
          where: {
            active: true
          }
        },
        unitPlans: true,
        floorPlans: true,
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
   * Create new property with transaction support
   * @param {Object} data - Property data from frontend
   * @returns {Promise} - Created property
   */
  async create(data) {
    try {

      // Return the transaction result
      return prisma.$transaction(async (prisma) => {
        // Process and prepare related entities data
        let featuresData = [];
        if (data.features) {
          // If features is a JSON string, parse it
          const features = typeof data.features === 'string' ? JSON.parse(data.features) : data.features;
          
          featuresData = Object.entries(features).map(([key, value]) => ({
            featureType: key,
            active: value === true || value === 'true' ? true : false
          }));
        }

        let amenitiesData = [];
        if (data.amenities) {
          // If amenities is a JSON string, parse it
          const amenities = typeof data.amenities === 'string' ? JSON.parse(data.amenities) : data.amenities;
          
          amenitiesData = Object.entries(amenities).map(([key, value]) => ({
            amenityType: key,
            active: value === true || value === 'true' ? true : false
          }));
        }

        let facilitiesData = [];
        if (data.facilities) {
          const facilities = typeof data.facilities === 'string' ? JSON.parse(data.facilities) : data.facilities;
          
          facilitiesData = Object.entries(facilities).map(([key, value]) => ({
            facilityType: key,
            active: value === true || value === 'true' ? true : false
          }));
        }

        let viewsData = [];
        if (data.views) {
          const views = typeof data.views === 'string' ? JSON.parse(data.views) : data.views;
          
          viewsData = Object.entries(views).map(([key, value]) => ({
            viewType: key,
            active: value === true || value === 'true' ? true : false
          }));
        }

        let highlightsData = [];
        if (data.highlights) {
          const highlights = typeof data.highlights === 'string' ? JSON.parse(data.highlights) : data.highlights;
          
          highlightsData = Object.entries(highlights).map(([key, value]) => ({
            highlightType: key,
            active: value === true || value === 'true' ? true : false
          }));
        }

        let labelsData = [];
        if (data.labels) {
          const labels = typeof data.labels === 'string' ? JSON.parse(data.labels) : data.labels;
          
          labelsData = Object.entries(labels).map(([key, value]) => ({
            labelType: key,
            active: value === true || value === 'true' ? true : false
          }));
        }

        let nearbyPlacesData = [];
        if (data.nearby) {
          const nearby = typeof data.nearby === 'string' ? JSON.parse(data.nearby) : data.nearby;
          
          nearbyPlacesData = Object.entries(nearby).map(([key, value]) => ({
            nearbyType: key,
            active: value === true || value === 'true' ? true : false
          }));
        }

        // Prepare property base data
        const propertyData = {
          // Basic property info
          title: data.propertyTitle || data.title,
          projectName: data.projectName,
          propertyCode: data.propertyCode || data.propertyId,
          referenceId: data.referenceId,
          propertyType: Array.isArray(data.propertyType) ? data.propertyType[0] : data.propertyType,

          // Address info
          address: data.address,
          searchAddress: data.searchAddress,
          district: data.district,
          subdistrict: data.subdistrict,
          province: data.province,
          city: data.city,
          country: data.country || 'Thailand',
          zipCode: data.postalCode || data.zipCode,
          latitude: data.latitude ? parseFloat(data.latitude) : null,
          longitude: data.longitude ? parseFloat(data.longitude) : null,

          // Zone relation
          zoneId: data.zone_id ? parseInt(data.zone_id) : undefined,
          
          // Area info
          area: 10,
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
          communityFee: data.communityFees ? parseFloat(data.communityFees) : (data.communityFee ? parseFloat(data.communityFee) : null),
          buildingUnit: data.buildingUnit,
          floor: data.floor ? parseInt(data.floor) : null,
          
          // Multilingual content
          description: data.description,
          translatedTitles: data.translatedTitles || {},
          translatedDescriptions: data.translatedDescriptions || {},
          paymentPlan: data.paymentPlan,
          translatedPaymentPlans: data.translatedPaymentPlans || {},
          
          // Contact and social media
          socialMedia: data.socialMedia || {},
          contactInfo: data.contactInfo || {},
          
          // Status and metadata
          status: data.status || 'ACTIVE',

          // User relation
          userId:  data.userId ? parseInt(data.userId) : 1,
        };



        // Create property with all relations
        const property = await prisma.property.create({
          data: {
            ...propertyData,
            listings:{
                create: data.listings.map(listing => ({
                    ...listing,
                  price : listing.price ? parseFloat(listing.price) : 0,
                  userId:  data.userId ? parseInt(data.userId) : 1,
                  promotionalPrice:null,
                  status: 'ACTIVE',
                  shortTerm3Months : listing.shortTerm3Months ? parseFloat(listing.shortTerm3Months) : null,
                  shortTerm6Months : listing.shortTerm6Months ? parseFloat(listing.shortTerm6Months) : null,
                  shortTerm1Year : listing.shortTerm1Year ? parseFloat(listing.shortTerm1Year) : null,

                }))
            },
            features: featuresData.length > 0 ? {
              create: featuresData,
            } : undefined,
            amenities: amenitiesData.length > 0 ? {
              create: amenitiesData,
            } : undefined,
            facilities: facilitiesData.length > 0 ? {
              create: facilitiesData,
            } : undefined,
            views: viewsData.length > 0 ? {
              create: viewsData,
            } : undefined,
            highlights: highlightsData.length > 0 ? {
              create: highlightsData,
            } : undefined,
            labels: labelsData.length > 0 ? {
              create: labelsData,
            } : undefined,
            nearbyPlaces: nearbyPlacesData.length > 0 ? {
              create: nearbyPlacesData,
            } : undefined,

          },
          include: {
            features: true,
            amenities: true,
            facilities: true,
            views: true,
            highlights: true,
            labels: true,
            nearbyPlaces: true,
          },
        });

        // Move images to the property folder with the correct property ID
        if (data.images && data.images.length > 0) {
          console.log(" data.images", data.images)
          await this.moveImagesFromTemp(property.id, data.images);
          
          // Now create image records with updated URLs
          const imagesData = data.images.map((image, index) => {
            // Update image URL to point to the correct property folder
            const updatedUrl = image.url.replace('/properties/temp/', `/properties/${property.id}/`);
            
            return {
              url: updatedUrl,
              isFeatured: image.isFeatured || index === 0,
              sortOrder: image.sortOrder || index,
              propertyId: property.id
            };
          });
          
          // Create all image records
          if (imagesData.length > 0) {
            await prisma.propertyImage.createMany({
              data: imagesData
            });
          }
        }

        // Move floor plan images to the property folder with the correct property ID
        if (data.floorPlans && data.floorPlans.length > 0) {
          await this.moveFloorPlanImagesFromTemp(property.id, data.floorPlans);
          
          // Now create floor plan records with updated URLs
          const floorPlansData = data.floorPlans.map((plan, index) => {
            // Update plan URL to point to the correct property folder
            const updatedUrl = plan.url.replace('/properties/temp/', `/properties/${property.id}/`);
            
            return {
              url: updatedUrl,
              title: plan.title,
              description: plan.description,
              sortOrder: plan.sortOrder || index,
              propertyId: property.id
            };
          });
          
          // Create all floor plan records
          if (floorPlansData.length > 0) {
            await prisma.floorPlan.createMany({
              data: floorPlansData
            });
          }
        }

        // Move unit plan images to the property folder with the correct property ID
        if (data.unitPlans && data.unitPlans.length > 0) {
          await this.moveUnitPlanImagesFromTemp(property.id, data.unitPlans);
          
          // Now create unit plan records with updated URLs
          const unitPlansData = data.unitPlans.map((plan, index) => {
            // Update plan URL to point to the correct property folder
            const updatedUrl = plan.url.replace('/properties/temp/', `/properties/${property.id}/`);
            
            return {
              url: updatedUrl,
              propertyId: property.id
            };
          });
          
          // Create all unit plan records
          if (unitPlansData.length > 0) {
            await prisma.unitPlan.createMany({
              data: unitPlansData
            });
          }
        }

        const completeProperty = await prisma.property.findUnique({
          where: { id: property.id },
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
          }
        });
        return completeProperty;
      });
    } catch (error) {
      console.error('Error creating property:', error);
      throw error;
    }
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



  async findLatestPropertyCode() {
    return prisma.property.findFirst({
      orderBy: {
        propertyCode: 'desc',
      },
      select: {
        propertyCode: true,
      },
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
          images: true,
          listings: true,
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
            images: true,
            listings: true,
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

  async moveImagesFromTemp(propertyId, images) {
    const fs = require('fs');
    const path = require('path');

    try {
      console.log(`Starting to move ${images.length} images for property ${propertyId}`);
      console.log('Images before moving:', JSON.stringify(images, null, 2));
      
      // Create property directory if it doesn't exist
      const propertyDir = path.join(__dirname, '../../public/images/properties', propertyId.toString());
      if (!fs.existsSync(propertyDir)) {
        fs.mkdirSync(propertyDir, { recursive: true });
      }

      // Create subdirectories
      const floorPlansDir = path.join(propertyDir, 'floor-plans');
      if (!fs.existsSync(floorPlansDir)) {
        fs.mkdirSync(floorPlansDir, { recursive: true });
      }

      const unitPlansDir = path.join(propertyDir, 'unit-plans');
      if (!fs.existsSync(unitPlansDir)) {
        fs.mkdirSync(unitPlansDir, { recursive: true });
      }

      // Process each image
      for (const image of images) {
        if (!image.url) continue;

        // Get image path relative to /public
        const relativePath = image.url.startsWith('/') ? image.url.substring(1) : image.url;
        const oldPath = path.join(__dirname, '../../public', relativePath);

        // Replace 'temp' with actual propertyId in URL and path
        const newRelativePath = relativePath.replace('/properties/temp/', `/properties/${propertyId}/`);
        const newPath = path.join(__dirname, '../../public', newRelativePath);

        console.log(`Moving image from ${oldPath} to ${newPath}`);

        // Move file if it exists
        if (fs.existsSync(oldPath)) {
          // Make sure directory exists
          const newDir = path.dirname(newPath);
          if (!fs.existsSync(newDir)) {
            fs.mkdirSync(newDir, { recursive: true });
          }

          // Move the file
          fs.renameSync(oldPath, newPath);
          
          // Update the URL in the image object
          image.url = '/' + newRelativePath;
          console.log(`Updated image URL to: ${image.url}`);
        } else {
          console.log(`Source file does not exist: ${oldPath}`);
        }
      }

      console.log('Images after moving:', JSON.stringify(images, null, 2));
      console.log(`Successfully moved images for property ${propertyId}`);
    } catch (error) {
      console.error('Error moving images:', error);
      // Continue processing - don't throw error as property is already created
    }
  }

  async moveFloorPlanImagesFromTemp(propertyId, floorPlans) {
    const fs = require('fs');
    const path = require('path');

    try {
      // Create property directory if it doesn't exist
      const propertyDir = path.join(__dirname, '../../public/images/properties', propertyId.toString(), 'floor-plans');
      if (!fs.existsSync(propertyDir)) {
        fs.mkdirSync(propertyDir, { recursive: true });
      }

      // Process each floor plan image
      for (const plan of floorPlans) {
        if (!plan.url) continue;

        // Get image path relative to /public
        const relativePath = plan.url.startsWith('/') ? plan.url.substring(1) : plan.url;
        const oldPath = path.join(__dirname, '../../public', relativePath);

        // Replace 'temp' with actual propertyId in URL and path
        const newRelativePath = relativePath.replace('/properties/temp/', `/properties/${propertyId}/`);
        const newPath = path.join(__dirname, '../../public', newRelativePath);

        // Move file if it exists
        if (fs.existsSync(oldPath)) {
          // Make sure directory exists
          const newDir = path.dirname(newPath);
          if (!fs.existsSync(newDir)) {
            fs.mkdirSync(newDir, { recursive: true });
          }

          // Move the file
          fs.renameSync(oldPath, newPath);
          
          // Update the URL in the plan object
          plan.url = '/' + newRelativePath;
        }
      }

      // Log success
      console.log(`Successfully moved floor plan images for property ${propertyId}`);
    } catch (error) {
      console.error('Error moving floor plan images:', error);
      // Continue processing - don't throw error as property is already created
    }
  }

  async moveUnitPlanImagesFromTemp(propertyId, unitPlans) {
    const fs = require('fs');
    const path = require('path');

    try {
      // Create property directory if it doesn't exist
      const propertyDir = path.join(__dirname, '../../public/images/properties', propertyId.toString(), 'unit-plans');
      if (!fs.existsSync(propertyDir)) {
        fs.mkdirSync(propertyDir, { recursive: true });
      }

      // Process each unit plan image
      for (const plan of unitPlans) {
        if (!plan.url) continue;

        // Get image path relative to /public
        const relativePath = plan.url.startsWith('/') ? plan.url.substring(1) : plan.url;
        const oldPath = path.join(__dirname, '../../public', relativePath);

        // Replace 'temp' with actual propertyId in URL and path
        const newRelativePath = relativePath.replace('/properties/temp/', `/properties/${propertyId}/`);
        const newPath = path.join(__dirname, '../../public', newRelativePath);

        // Move file if it exists
        if (fs.existsSync(oldPath)) {
          // Make sure directory exists
          const newDir = path.dirname(newPath);
          if (!fs.existsSync(newDir)) {
            fs.mkdirSync(newDir, { recursive: true });
          }

          // Move the file
          fs.renameSync(oldPath, newPath);
          
          // Update the URL in the plan object
          plan.url = '/' + newRelativePath;
        }
      }

      // Log success
      console.log(`Successfully moved unit plan images for property ${propertyId}`);
    } catch (error) {
      console.error('Error moving unit plan images:', error);
      // Continue processing - don't throw error as property is already created
    }
  }
}

module.exports = new PropertyRepository();
