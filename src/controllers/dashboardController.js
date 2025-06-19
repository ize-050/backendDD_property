const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { handleError } = require('../utils/errorHandler');

class DashboardController {
  async getDashboardStats(req, res) {
    try {
      // Get user ID if authenticated
      const userId = req.user?.userId;
      
      // Metrics to collect
      let totalProperties = 0;
      let totalMessages = 0;
      let newMessages = 0;
      let propertiesByType = [];
      let messagesByType = [];
      let messagesByStatus = [];
      let recentMessages = [];

      // If user is authenticated, get their properties count and messages
      if (userId) {
        // For user-specific dashboard
        const [userPropertiesCount, userPropertiesByType, userMessages, userMessagesByStatus, userMessagesByType, userRecentMessages] = await Promise.all([
          // Total properties by this user
          prisma.property.count({
            where: { userId: parseInt(userId) }
          }),
          
          // Properties by type
          prisma.property.groupBy({
            by: ['propertyTypeId'],
            where: { userId: parseInt(userId) },
            _count: {
              propertyTypeId:true
            }
          }),
          
          // Messages for user's properties
          prisma.$transaction(async (tx) => {
            // First get all properties that belong to this user
            const userProperties = await tx.property.findMany({
              where: { userId: parseInt(userId) },
              select: { id: true },
            });
            
            // Extract property IDs
            const propertyIds = userProperties.map(prop => prop.id);
            
            // Count total messages for these properties
            return tx.message.count({
              where: {
                propertyId: { in: propertyIds }
              }
            });
          }),
          
          // Messages by status
          prisma.$transaction(async (tx) => {
            // First get all properties that belong to this user
            const userProperties = await tx.property.findMany({
              where: { userId: parseInt(userId) },
              select: { id: true }
            });
            
            // Extract property IDs
            const propertyIds = userProperties.map(prop => prop.id);

            if (propertyIds.length === 0) {
              // Return empty result if no properties
              return [];
            }

            // Use the simpler form of Prisma query for status counts
            const statusCounts = await tx.message.groupBy({
              by: ['status'],
              where: {
                propertyId: { in: propertyIds }
              },
              _count: {
                status: true
              }
            });
            
            // Transform to match expected format
            return statusCounts.map(item => ({
              status: item.status,
              count: item._count.status
            }));
          }),
          
          // Messages by property type
          prisma.$transaction(async (tx) => {
            // First get all properties that belong to this user
            const properties = await tx.property.findMany({
              where: { userId: parseInt(userId) },
              select: { id: true, propertyType: true }
            });
            
            if (properties.length === 0) {
              return [];
            }
            
            // Group properties by type
            const propertyTypeMap = properties.reduce((acc, prop) => {
              if (!acc[prop.propertyType]) {
                acc[prop.propertyType] = [];
              }
              acc[prop.propertyType].push(prop.id);
              return acc;
            }, {});
            
            // For each property type, count messages
            const messagesByType = [];
            for (const [type, ids] of Object.entries(propertyTypeMap)) {
              const count = await tx.message.count({
                where: {
                  propertyId: { in: ids }
                }
              });
              
              messagesByType.push({
                propertyType: type,
                count
              });
            }
            
            return messagesByType;
          }),
          
          // Recent messages
          prisma.$transaction(async (tx) => {
            // First get all properties that belong to this user
            const userProperties = await tx.property.findMany({
              where: { userId: parseInt(userId) },
              select: { id: true }
            });
            
            // Extract property IDs
            const propertyIds = userProperties.map(prop => prop.id);
            
            // Get recent messages
            return tx.message.findMany({
              where: {
                propertyId: { in: propertyIds }
              },
              orderBy: {
                createdAt: 'desc'
              },
              take: 5,
              include: {
                property: {
                  select: {
                    projectName: true
                  }
                }
              }
            });
          })
        ]);
        
        totalProperties = userPropertiesCount;
        propertiesByType = userPropertiesByType.map(item => ({
          propertyType: item.propertyTypeId,
          count: item._count.propertyTypeId
        }));
        totalMessages = userMessages;
        messagesByStatus = userMessagesByStatus || [];
        messagesByType = userMessagesByType || [];
        recentMessages = userRecentMessages;
        
        // Count new messages
        newMessages = messagesByStatus.find(item => item.status === 'NEW')?.count || 0;
      }

      return res.status(200).json({
        success: true,
        data: {
          totalProperties,
          totalMessages,
          newMessages,
          propertiesByType,
          messagesByType,
          messagesByStatus,
          recentMessages
        }
      });
    } catch (error) {
      return handleError(error, res);
    }
  }
}

module.exports = new DashboardController();
