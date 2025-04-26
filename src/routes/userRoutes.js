const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middlewares/auth');

const router = express.Router();

// Protected routes - require authentication
router.use(authenticate);

// Get current user profile
router.get('/me', userController.getCurrentUser);

// Update current user profile
router.put(
  '/me',
  [
    body('name').optional().isString().withMessage('Name must be a string'),
    body('email').optional().isEmail().withMessage('Must be a valid email'),
  ],
  userController.updateCurrentUser
);

// Change password
router.put(
  '/me/password',
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .notEmpty()
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters'),
  ],
  userController.changePassword
);

// Admin routes - require admin role
router.use(authorize('ADMIN'));

// Get all users
router.get('/', userController.getAllUsers);

// Get user by ID
router.get('/:id', userController.getUserById);

// Create user (admin only)
router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Must be a valid email'),
    body('password')
      .notEmpty()
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['ADMIN', 'USER', 'AGENT']).withMessage('Invalid role'),
  ],
  userController.createUser
);

// Update user (admin only)
router.put(
  '/:id',
  [
    body('name').optional().isString().withMessage('Name must be a string'),
    body('email').optional().isEmail().withMessage('Must be a valid email'),
    body('role').optional().isIn(['ADMIN', 'USER', 'AGENT']).withMessage('Invalid role'),
  ],
  userController.updateUser
);

// Delete user (admin only)
router.delete('/:id', userController.deleteUser);

module.exports = router;
