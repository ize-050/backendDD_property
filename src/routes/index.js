const express = require('express');
const propertyRoutes = require('./propertyRoutes');
const userRoutes = require('./userRoutes');
const authRoutes = require('./authRoutes');

const router = express.Router();

// API routes
router.use('/properties', propertyRoutes);
router.use('/users', userRoutes);
router.use('/auth', authRoutes);

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
