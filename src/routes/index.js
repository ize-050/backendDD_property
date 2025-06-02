const express = require('express');
const propertyRoutes = require('./propertyRoutes');
const zoneRoutes = require('./zoneRoutes');
const searchRoutes = require('./searchRoutes');
// const userRoutes = require('./userRoutes');
const authRoutes = require('./authRoutes');
const blogRoutes = require('./blogRoutes');
const currencyRoutes = require('./currencyRoutes');
const userRoutes = require('./userRoutes'); // Assuming userRoutes is defined in userRoutes.js
const messageRoutes = require('./messageRoutes'); // เปลี่ยนจาก contactRoutes เป็น messageRoutes
const dashboardRoutes = require('./dashboardRoutes'); // เพิ่ม dashboardRoutes

const router = express.Router();

// API routes
router.use('/properties', propertyRoutes);
router.use('/zones', zoneRoutes);
router.use('/search', searchRoutes);
// router.use('/users', userRoutes);
router.use('/auth', authRoutes);
router.use('/blogs', blogRoutes);
router.use('/users', userRoutes); // Assuming userRoutes is defined in userRoutes.js
router.use('/currencies', currencyRoutes);
router.use('/messages', messageRoutes); // เปลี่ยนจาก '/contacts' เป็น '/messages'
router.use('/dashboard', dashboardRoutes); // เพิ่ม dashboard routes

// API documentation route
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to DD Property API',
    version: '1.0.0',
    documentation: '/api/docs',
  });
});

module.exports = router;
