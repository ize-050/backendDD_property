const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middlewares/auth');

const router = express.Router();

// Main route to get all users
router.get('/', userController.getAllUsers);


router.get('/me', userController.getCurrentUser);



// Change password (will return auth error)
router.put('/me/password', userController.changePassword);

// Get user by ID
router.get('/:id', userController.getUserById);

// Create user
router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Must be a valid email'),
    body('password')
      .notEmpty()
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['USER', 'ADMIN']).withMessage('Invalid role'),
    body('phone').optional(),
  ],
  userController.createUser
);

// Update user
router.put(
  '/:id',
  [
    body('name').optional().isString().withMessage('Name must be a string'),
    body('email').optional().isEmail().withMessage('Must be a valid email'),
    body('password')
      .optional()
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['USER', 'ADMIN']).withMessage('Invalid role'),
  ],
  userController.updateUser
);

// Delete user
router.delete('/:id', userController.deleteUser);

module.exports = router;
