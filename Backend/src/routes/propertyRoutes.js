const express = require('express');
const propertyController = require('../controllers/propertyController');
const { requireAuth, requireOwner, optionalAuth } = require('../middleware/requireAuth');
const router = express.Router();

// Get all properties
router.get('/', optionalAuth, propertyController.getAllProperties.bind(propertyController));

// Search properties
router.get('/search', propertyController.searchProperties.bind(propertyController));

// Get property by ID
router.get('/:id', optionalAuth, propertyController.getPropertyById.bind(propertyController));

// Create property (Owner only)
router.post('/', requireAuth, requireOwner, propertyController.createProperty.bind(propertyController));

// Update property (Owner only)
router.put('/:id', requireAuth, requireOwner, propertyController.updateProperty.bind(propertyController));

// Delete property (Owner only)
router.delete('/:id', requireAuth, requireOwner, propertyController.deleteProperty.bind(propertyController));

// Get properties by owner
router.get('/owner/my-properties', requireAuth, requireOwner, propertyController.getPropertiesByOwner.bind(propertyController));

module.exports = router;
