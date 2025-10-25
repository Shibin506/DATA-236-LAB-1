const propertyService = require('../services/propertyService');

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
