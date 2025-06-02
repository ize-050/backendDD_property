const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const authMiddleware = require('../middlewares/authMiddleware');

// Create message (public route - ไม่ต้องการการยืนยันตัวตน)
router.post('/', messageController.createMessage);

// Admin routes (ต้องการการยืนยันตัวตน)
router.get('/property/:propertyId', authMiddleware.authenticate, messageController.getMessagesByPropertyId);
router.get('/',  authMiddleware.authenticate, messageController.getAllMessages);
router.get('/user',  authMiddleware.authenticate, messageController.getMessagesByUser);
router.patch('/:id/status',  authMiddleware.authenticate, messageController.updateMessageStatus);

module.exports = router;
