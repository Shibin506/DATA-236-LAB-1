const { Property, Favorite, PropertyImage, User } = require('../models');

class FavoriteService {
  // Add property to favorites
  async addToFavorites(propertyId, userId) {
    // Convert to numeric IDs
    const numericPropertyId = parseInt(propertyId, 10);
    const numericUserId = parseInt(userId, 10);
    
    if (isNaN(numericPropertyId) || isNaN(numericUserId)) {
      throw new Error('Invalid property or user ID');
    }
    
    // Check if property exists and is active
    const property = await Property.findOne({ _id: numericPropertyId, is_active: true }).lean();
    
    if (!property) {
      throw new Error('Property not found or not available');
    }
    
    // Check if already in favorites
    const existingFavorite = await Favorite.findOne({ user_id: numericUserId, property_id: numericPropertyId });
    
    if (existingFavorite) {
      throw new Error('Property is already in your favorites');
    }
    
    // Generate next favorite ID
    const lastFavorite = await Favorite.findOne().sort({ _id: -1 }).limit(1);
    const nextId = lastFavorite && typeof lastFavorite._id === 'number' ? lastFavorite._id + 1 : 7;
    
    // Add to favorites
    const favorite = await Favorite.create({
      _id: nextId,
      user_id: numericUserId,
      property_id: numericPropertyId
    });
    
    return {
      id: favorite._id,
      property_id: numericPropertyId,
      user_id: numericUserId
    };
  }
  
  // Get user favorites
  async getUserFavorites(userId, filters = {}) {
    const { page = 1, limit = 10 } = filters;
    const pageNum = Math.max(1, Number.parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(50, Number.parseInt(limit) || 10));
    const skip = Math.max(0, (pageNum - 1) * limitNum);
    
    const numericUserId = parseInt(userId, 10);
    
    const favorites = await Favorite.find({ user_id: numericUserId })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();
    
    const validFavorites = [];
    
    // Get property details for each favorite
    for (const favorite of favorites) {
      const property = await Property.findOne({ 
        _id: favorite.property_id, 
        is_active: true 
      })
        .select('name description property_type address city state country price_per_night bedrooms bathrooms max_guests amenities owner_id')
        .lean();
      
      if (property) {
        // Get owner name
        const owner = await User.findById(property.owner_id)
          .select('first_name last_name')
          .lean();
        
        // Get main image or first image
        let image = await PropertyImage.findOne({ 
          property_id: property._id, 
          image_type: 'main' 
        }).select('image_url').lean();
        
        if (!image) {
          image = await PropertyImage.findOne({ 
            property_id: property._id 
          }).sort({ _id: 1 }).select('image_url').lean();
        }
        
        const imageUrl = image?.image_url || `/uploads/properties/property-${property._id}-1.jpg`;
        
        validFavorites.push({
          id: favorite._id,
          property_id: property._id,
          name: property.name,
          property_name: property.name,
          description: property.description,
          property_type: property.property_type,
          address: property.address,
          city: property.city,
          state: property.state,
          country: property.country,
          price_per_night: property.price_per_night,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          max_guests: property.max_guests,
          amenities: property.amenities,
          owner_name: owner ? `${owner.first_name} ${owner.last_name}`.trim() : 'Unknown',
          image_url: imageUrl,
          main_image: imageUrl,
          coverImage: imageUrl,
          created_at: favorite.created_at
        });
      }
    }
    
    const total = await Favorite.countDocuments({ user_id: numericUserId });
    
    return {
      favorites: validFavorites,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total
      }
    };
  }
  
  // Remove from favorites
  async removeFromFavorites(favoriteId, userId) {
    const numericUserId = parseInt(userId, 10);
    const numericFavoriteId = parseInt(favoriteId, 10);
    
    // First try: treat favoriteId as the favorites._id
    let favorite = await Favorite.findOne({ _id: numericFavoriteId, user_id: numericUserId });
    
    if (favorite) {
      await Favorite.deleteOne({ _id: numericFavoriteId });
      return { success: true };
    }
    
    // Second try: treat provided id as property_id (frontend variant)
    favorite = await Favorite.findOne({ user_id: numericUserId, property_id: numericFavoriteId });
    
    if (!favorite) {
      throw new Error('Favorite not found or you do not have permission to remove it');
    }
    
    await Favorite.deleteOne({ _id: favorite._id });
    
    return { success: true };
  }
  
  // Check if property is in favorites
  async checkFavoriteStatus(propertyId, userId) {
    const numericPropertyId = parseInt(propertyId, 10);
    const numericUserId = parseInt(userId, 10);
    
    const favorite = await Favorite.findOne({ 
      user_id: numericUserId, 
      property_id: numericPropertyId 
    }).lean();
    
    return {
      is_favorite: !!favorite,
      favorite_id: favorite ? favorite._id : null
    };
  }
  
  // Get favorite count for property
  async getPropertyFavoriteCount(propertyId) {
    const numericPropertyId = parseInt(propertyId, 10);
    const count = await Favorite.countDocuments({ property_id: numericPropertyId });
    return count;
  }
  
  // Get user's favorite count
  async getUserFavoriteCount(userId) {
    const numericUserId = parseInt(userId, 10);
    const count = await Favorite.countDocuments({ user_id: numericUserId });
    return count;
  }
}

module.exports = new FavoriteService();
