const propertyService = require('../services/propertyService');
const path = require('path');
const fs = require('fs');

class PropertyController {
  // Get all properties
  async getAllProperties(req, res) {
    try {
      const properties = await propertyService.getAllProperties(req.query);
      
      res.json({
        success: true,
        data: { properties }
      });
      
    } catch (error) {
      console.error('Get properties error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get properties'
      });
    }
  }

  // Upload images for a property
  async uploadImages(req, res) {
    try {
      const { id } = req.params
      const files = req.files || []
      if (!files.length) {
        return res.status(400).json({ success: false, message: 'No images uploaded' })
      }
      const images = files.map(f => ({ image_url: `/uploads/properties/${path.basename(f.path)}`, image_type: 'gallery' }))
      await propertyService.addPropertyImages(id, images)
      res.json({ success: true, message: 'Images uploaded', data: { images } })
    } catch (error) {
      console.error('Upload images error:', error)
      res.status(400).json({ success: false, message: 'Failed to upload images' })
    }
  }

  async deleteImage(req, res) {
    try {
      const { id, imageId } = req.params
      // Find image to remove physical file
      const img = await propertyService.getPropertyImageById(imageId)
      await propertyService.deletePropertyImage(id, imageId)
      if (img && img.image_url) {
        const filePath = path.join(__dirname, '..', img.image_url)
        fs.unlink(filePath, () => {})
      }
      res.json({ success: true, message: 'Image deleted' })
    } catch (error) {
      console.error('Delete image error:', error)
      res.status(400).json({ success: false, message: 'Failed to delete image' })
    }
  }
  
  // Search properties
  async searchProperties(req, res) {
    try {
      const result = await propertyService.searchProperties(req.query);
      
      res.json({
        success: true,
        data: result
      });
      
    } catch (error) {
      console.error('Property search error:', error);
      res.status(500).json({
        success: false,
        message: 'Property search failed'
      });
    }
  }
  
  // Get property by ID
  async getPropertyById(req, res) {
    try {
      const { id } = req.params;
      const property = await propertyService.getPropertyById(id);
      
      res.json({
        success: true,
        data: { property }
      });
      
    } catch (error) {
      console.error('Get property error:', error);
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }
  
  // Create property
  async createProperty(req, res) {
    try {
      const property = await propertyService.createProperty(req.body, req.userId);
      
      res.status(201).json({
        success: true,
        message: 'Property created successfully',
        data: { property }
      });
      
    } catch (error) {
      console.error('Create property error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
  
  // Update property
  async updateProperty(req, res) {
    try {
      const { id } = req.params;
      await propertyService.updateProperty(id, req.body, req.userId);
      
      res.json({
        success: true,
        message: 'Property updated successfully'
      });
      
    } catch (error) {
      console.error('Update property error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
  
  // Delete property
  async deleteProperty(req, res) {
    try {
      const { id } = req.params;
      await propertyService.deleteProperty(id, req.userId);
      
      res.json({
        success: true,
        message: 'Property deleted successfully'
      });
      
    } catch (error) {
      console.error('Delete property error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
  
  // Get properties by owner
  async getPropertiesByOwner(req, res) {
    try {
      const properties = await propertyService.getPropertiesByOwner(req.userId, req.query);
      
      res.json({
        success: true,
        data: { properties }
      });
      
    } catch (error) {
      console.error('Get owner properties error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get properties'
      });
    }
  }
}

module.exports = new PropertyController();
