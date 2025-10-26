const favoriteService = require('../services/favoriteService');

class FavoriteController {
  // Add to favorites
  async addToFavorites(req, res) {
    try {
      const { property_id } = req.body;
      
      if (!property_id) {
        return res.status(400).json({
          success: false,
          message: 'Property ID is required'
        });
      }
      
      const favorite = await favoriteService.addToFavorites(property_id, req.userId);
      
      res.status(201).json({
        success: true,
        message: 'Property added to favorites successfully',
        data: { favorite }
      });
      
    } catch (error) {
      console.error('Add to favorites error:', error);
      const msg = String(error?.message || '')
      const status = msg.toLowerCase().includes('already in your favorites') ? 409 : 400
      res.status(status).json({
        success: false,
        message: error.message
      });
    }
  }
  
  // Get user favorites
  async getUserFavorites(req, res) {
    try {
      const result = await favoriteService.getUserFavorites(req.userId, req.query);
      
      res.json({
        success: true,
        data: result
      });
      
    } catch (error) {
      console.error('Get favorites error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get favorites'
      });
    }
  }
  
  // Remove from favorites
  async removeFromFavorites(req, res) {
    try {
      const { id } = req.params;
      await favoriteService.removeFromFavorites(id, req.userId);
      
      res.json({
        success: true,
        message: 'Property removed from favorites successfully'
      });
      
    } catch (error) {
      console.error('Remove from favorites error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
  
  // Check favorite status
  async checkFavoriteStatus(req, res) {
    try {
      const { property_id } = req.params;
      const result = await favoriteService.checkFavoriteStatus(property_id, req.userId);
      
      res.json({
        success: true,
        data: result
      });
      
    } catch (error) {
      console.error('Check favorite error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check favorite status'
      });
    }
  }
  
  // Get favorite count for property
  async getPropertyFavoriteCount(req, res) {
    try {
      const { property_id } = req.params;
      const count = await favoriteService.getPropertyFavoriteCount(property_id);
      
      res.json({
        success: true,
        data: { count }
      });
      
    } catch (error) {
      console.error('Get property favorite count error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get favorite count'
      });
    }
  }
  
  // Get user's favorite count
  async getUserFavoriteCount(req, res) {
    try {
      const count = await favoriteService.getUserFavoriteCount(req.userId);
      
      res.json({
        success: true,
        data: { count }
      });
      
    } catch (error) {
      console.error('Get user favorite count error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get favorite count'
      });
    }
  }
}

module.exports = new FavoriteController();
