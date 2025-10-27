const express = require('express');
const propertyController = require('../controllers/propertyController');
const config = require('../config/env')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { requireAuth, requireOwner, optionalAuth } = require('../middleware/requireAuth');
const router = express.Router();

// Multer storage for property images
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		const dir = path.join(__dirname, '..', 'uploads', 'properties')
		fs.mkdirSync(dir, { recursive: true })
		cb(null, dir)
	},
	filename: (req, file, cb) => {
		const id = req.params.id || 'prop'
		const ext = path.extname(file.originalname) || '.jpg'
		cb(null, `property-${id}-${Date.now()}${ext}`)
	}
})
const upload = multer({
	storage,
	limits: { fileSize: config.upload.maxFileSize },
	fileFilter: (req, file, cb) => {
		if (config.upload.allowedTypes.includes(file.mimetype)) return cb(null, true)
		cb(new Error('Unsupported file type'))
	}
})

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

// Upload property images (Owner only) — supports field names 'images' or 'image'
router.post('/:id/images', requireAuth, requireOwner, upload.any(), propertyController.uploadImages.bind(propertyController));

// Delete a property image (Owner only)
router.delete('/:id/images/:imageId', requireAuth, requireOwner, propertyController.deleteImage.bind(propertyController));

module.exports = router;
