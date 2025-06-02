const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { ApiError } = require('../middlewares/errorHandler');
const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');

/**
 * User Controller - Handles HTTP requests for user operations
 */
class UserController {
  /**
   * Get current authenticated user
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async getCurrentUser(req, res, next) {
    try {
      // Since authentication is removed, we can't access req.user
      // You may want to implement a different way to identify the current user
      // For now, return an error or redirect
      
      return res.status(401).json({
        status: 'error',
        message: 'Authentication is required for this endpoint'
      });
    } catch (error) {
      next(error);
    }
  }
  

  
  /**
   * Change user password
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async changePassword(req, res, next) {
    try {
      // Since authentication is removed, we can't access req.user
      // Return an error response
      return res.status(401).json({
        status: 'error',
        message: 'Authentication is required for this endpoint'
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Get all users (admin only)
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async getAllUsers(req, res, next) {
    try {
      const { page = 1, limit = 10, search, role } = req.query;
      
      // Calculate pagination values
      const skip = (page - 1) * limit;
      
      // Build filter conditions
      let where = {};
      
      if (search) {
        where.OR = [
          { name: { contains: search } },
          { email: { contains: search } }
        ];
      }
      
      if (role) {
        where.role = role;
      }
      
      // Get users with pagination
      const users = await prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          facebook: true,
          lineId: true,
          wechatId: true,
          whatsapp: true,
          role: true,
          createdAt: true,
          updatedAt: true
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      });
      
      // Format the response to include socialMedia
      const formattedUsers = users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        socialMedia: {
          facebook: user.facebook || '',
          line: user.lineId || '',
          wechat: user.wechatId || '',
          whatsapp: user.whatsapp || ''
        },
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }));
      
      // Get total count for pagination
      const total = await prisma.user.count({ where });
      
      res.status(200).json({
        status: 'success',
        data: formattedUsers,
        meta: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Get user by ID (admin only)
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async getUserById(req, res, next) {
    try {
      const userId = parseInt(req.params.id);
      
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          facebook: true,
          lineId: true,
          wechatId: true,
          whatsapp: true,
          role: true,
          createdAt: true,
          updatedAt: true
        }
      });
      
      if (!user) {
        throw new ApiError(404, 'User not found');
      }
      
      // Format response to include socialMedia
      const formattedUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        socialMedia: {
          facebook: user.facebook || '',
          line: user.lineId || '',
          wechat: user.wechatId || '',
          whatsapp: user.whatsapp || ''
        },
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
      
      res.status(200).json({
        status: 'success',
        data: formattedUser
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Create new user (admin only)
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async createUser(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, 'Validation error', true, null, errors.array());
      }
      
      const { name, email, password, role, phone, socialMedia } = req.body;
      
      // Check if email is already taken
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });
      
      if (existingUser) {
        throw new ApiError(400, 'Email is already in use');
      }
      
      // Parse social media if it's a string
      let socialMediaData = {};
      if (socialMedia) {
        socialMediaData = typeof socialMedia === 'string' 
          ? JSON.parse(socialMedia) 
          : socialMedia;
      }
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // Create new user
      const newUser = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: role || 'USER',
          phone,
          // Map social media fields
          facebook: socialMediaData.facebook || null,
          lineId: socialMediaData.line || null,
          wechatId: socialMediaData.wechat || null,
          whatsapp: socialMediaData.whatsapp || null
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          facebook: true,
          lineId: true,
          wechatId: true,
          whatsapp: true,
          role: true,
          createdAt: true,
          updatedAt: true
        }
      });
      
      // Format response to include socialMedia
      const formattedUser = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        socialMedia: {
          facebook: newUser.facebook || '',
          line: newUser.lineId || '',
          wechat: newUser.wechatId || '',
          whatsapp: newUser.whatsapp || ''
        },
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt
      };
      
      res.status(201).json({
        status: 'success',
        data: formattedUser
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Update user (admin only)
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async updateUser(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, 'Validation error', true, null, errors.array());
      }
      
      const userId = parseInt(req.params.id);
      const { name, email, password, role, phone, socialMedia } = req.body;
      
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id: userId }
      });
      
      if (!existingUser) {
        throw new ApiError(404, 'User not found');
      }
      
      // Check if email is already taken by another user
      if (email && email !== existingUser.email) {
        const userWithEmail = await prisma.user.findUnique({
          where: { email }
        });
        
        if (userWithEmail) {
          throw new ApiError(400, 'Email is already in use');
        }
      }
      
      // Parse social media if it's a string
      let socialMediaData = {};
      if (socialMedia) {
        socialMediaData = typeof socialMedia === 'string' 
          ? JSON.parse(socialMedia) 
          : socialMedia;
      }
      
      // Prepare update data - only include defined values
      const updateData = {};
      
      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email;
      if (role !== undefined) updateData.role = role;
      if (phone !== undefined) updateData.phone = phone;
      
      // Map social media fields - only if they exist in socialMediaData
      if (socialMediaData.facebook !== undefined) updateData.facebook = socialMediaData.facebook || null;
      if (socialMediaData.line !== undefined) updateData.lineId = socialMediaData.line || null;
      if (socialMediaData.wechat !== undefined) updateData.wechatId = socialMediaData.wechat || null;
      if (socialMediaData.whatsapp !== undefined) updateData.whatsapp = socialMediaData.whatsapp || null;
      
      // Only update password if provided
      if (password) {
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(password, salt);
      }
      
      // Only proceed with update if there's data to update
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'No valid fields provided for update'
        });
      }
      
      // Update user
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          facebook: true,
          lineId: true,
          wechatId: true,
          whatsapp: true,
          role: true,
          createdAt: true,
          updatedAt: true
        }
      });
      
      // Format response to include socialMedia
      const formattedUser = {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        socialMedia: {
          facebook: updatedUser.facebook || '',
          line: updatedUser.lineId || '',
          wechat: updatedUser.wechatId || '',
          whatsapp: updatedUser.whatsapp || ''
        },
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      };
      
      res.status(200).json({
        status: 'success',
        data: formattedUser
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Delete user (admin only)
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async deleteUser(req, res, next) {
    try {
      const userId = parseInt(req.params.id);
      
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id: userId }
      });
      
      if (!existingUser) {
        throw new ApiError(404, 'User not found');
      }
      
      // Remove the self-deletion check since we're not using authentication anymore
      // if (userId === req.user.id) {
      //   throw new ApiError(400, 'Cannot delete your own account');
      // }
      
      // Delete user
      await prisma.user.delete({
        where: { id: userId }
      });
      
      res.status(200).json({
        status: 'success',
        message: 'User deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
