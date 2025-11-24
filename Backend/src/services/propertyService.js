const { Property, PropertyImage, User, Booking } = require('../models');

class PropertyService {
  // Get all properties
  async getAllProperties(filters = {}) {
    const query = { is_active: true };
    
    // Apply filters
    if (filters.location) {
      query.$or = [
        { city: { $regex: filters.location, $options: 'i' } },
        { state: { $regex: filters.location, $options: 'i' } },
        { country: { $regex: filters.location, $options: 'i' } },
        { address: { $regex: filters.location, $options: 'i' } }
      ];
    }
    
    if (filters.city) {
      query.city = { $regex: filters.city, $options: 'i' };
    }
    
    if (filters.state) {
      query.state = { $regex: filters.state, $options: 'i' };
    }
    
    if (filters.guests) {
      query.max_guests = { $gte: parseInt(filters.guests) };
    }
    
    if (filters.min_price || filters.max_price) {
      query.price_per_night = {};
      if (filters.min_price) {
        query.price_per_night.$gte = parseInt(filters.min_price);
      }
      if (filters.max_price) {
        query.price_per_night.$lte = parseInt(filters.max_price);
      }
    }
    
    if (filters.property_type) {
      query.property_type = filters.property_type;
    }
    
    const properties = await Property.find(query)
      .sort({ created_at: -1 })
      .lean();
    
    // Add images for each property
    for (const property of properties) {
      const images = await PropertyImage.find({ property_id: property._id })
        .sort({ display_order: 1 })
        .lean();
      property.images = images;
      property.id = property._id;
      // Set main_image and coverImage for frontend compatibility
      property.main_image = images[0]?.image_url || `/uploads/properties/property-${property._id}-1.jpg`;
      property.coverImage = property.main_image;
    }
    
    return properties;
  }
  
  // Search properties with pagination
  async searchProperties(searchParams) {
    const {
      location, city, state, guests, min_price, max_price, property_type,
      page = 1, limit = 10
    } = searchParams;
    const startDate = searchParams.startDate || searchParams.check_in_date;
    const endDate = searchParams.endDate || searchParams.check_out_date;
    
    const query = { is_active: true };
    
    if (location) {
      query.$or = [
        { city: { $regex: location, $options: 'i' } },
        { state: { $regex: location, $options: 'i' } },
        { country: { $regex: location, $options: 'i' } },
        { address: { $regex: location, $options: 'i' } }
      ];
    }
    
    if (city) {
      query.city = { $regex: city, $options: 'i' };
    }
    
    if (state) {
      query.state = { $regex: state, $options: 'i' };
    }
    
    if (guests) {
      query.max_guests = { $gte: parseInt(guests) };
    }
    
    if (min_price || max_price) {
      query.price_per_night = {};
      if (min_price) {
        query.price_per_night.$gte = parseInt(min_price);
      }
      if (max_price) {
        query.price_per_night.$lte = parseInt(max_price);
      }
    }
    
    if (property_type) {
      query.property_type = property_type;
    }
    
    // Availability window on property
    if (startDate && endDate) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { availability_start: null },
          { availability_start: { $lte: new Date(startDate) } }
        ]
      });
      query.$and.push({
        $or: [
          { availability_end: null },
          { availability_end: { $gte: new Date(endDate) } }
        ]
      });
    }
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;
    
    let properties = await Property.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();
    
    // Filter out properties with overlapping bookings if dates provided
    if (startDate && endDate) {
      const availablePropertyIds = [];
      for (const property of properties) {
        const overlappingBookings = await Booking.countDocuments({
          property_id: property._id,
          status: { $in: ['pending', 'accepted'] },
          $nor: [
            { check_out_date: { $lte: new Date(startDate) } },
            { check_in_date: { $gte: new Date(endDate) } }
          ]
        });
        if (overlappingBookings === 0) {
          availablePropertyIds.push(property._id);
        }
      }
      properties = properties.filter(p => availablePropertyIds.some(id => id.equals(p._id)));
    }
    
    // Add images for each property
    for (const property of properties) {
      const images = await PropertyImage.find({ property_id: property._id })
        .sort({ display_order: 1 })
        .lean();
      property.images = images;
      property.id = property._id;
      property.owner_name = property.owner_id?.name;
      // Set main_image and coverImage for frontend compatibility
      property.main_image = images[0]?.image_url || `/uploads/properties/property-${property._id}-1.jpg`;
      property.coverImage = property.main_image;
      delete property.owner_id;
    }
    
    return {
      properties,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: properties.length
      }
    };
  }
  
  // Get property by ID
  async getPropertyById(propertyId) {
    // Convert to number if it's a numeric string
    const id = isNaN(propertyId) ? propertyId : parseInt(propertyId);
    const property = await Property.findOne({ _id: id, is_active: true })
      .lean();
    
    if (!property) {
      throw new Error('Property not found');
    }
    
    // Add images for the property
    const images = await PropertyImage.find({ property_id: property._id })
      .sort({ display_order: 1 })
      .lean();
    
    property.images = images;
    property.id = property._id;
    property.owner_name = property.owner_id?.name;
    property.owner_avatar = property.owner_id?.profile_picture;
    // Set main_image and coverImage for frontend compatibility
    property.main_image = images[0]?.image_url || `/uploads/properties/property-${property._id}-1.jpg`;
    property.coverImage = property.main_image;
    delete property.owner_id;
    
    return property;
  }

  // Add property images (expects array of { image_url, image_type })
  async addPropertyImages(propertyId, images) {
    if (images.length === 0) return [];
    
    const imageDocuments = images.map(img => ({
      property_id: propertyId,
      image_url: img.image_url,
      image_type: img.image_type || 'gallery'
    }));
    
    const result = await PropertyImage.insertMany(imageDocuments);
    return result;
  }

  async getPropertyImageById(imageId) {
    const image = await PropertyImage.findById(imageId).lean();
    return image;
  }

  async deletePropertyImage(propertyId, imageId) {
    await PropertyImage.deleteOne({ _id: imageId, property_id: propertyId });
    return { success: true };
  }
  
  // Create property
  async createProperty(propertyData, ownerId) {
    const {
      name, description, property_type, address, city, state, country,
      price_per_night, bedrooms, bathrooms, max_guests, amenities, house_rules
    } = propertyData;
    
    const property = await Property.create({
      owner_id: ownerId,
      name,
      description,
      property_type,
      address,
      city,
      state,
      country,
      price_per_night,
      bedrooms,
      bathrooms,
      max_guests,
      amenities,
      house_rules
    });
    
    return {
      id: property._id,
      name: property.name,
      property_type: property.property_type,
      city: property.city,
      state: property.state
    };
  }
  
  // Update property
  async updateProperty(propertyId, updateData, ownerId) {
    // Check if property exists and belongs to user
    const property = await Property.findOne({ _id: propertyId, owner_id: ownerId });
    
    if (!property) {
      throw new Error('Property not found or you do not have permission to update it');
    }
    
    // Build update object
    const updates = {};
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        updates[key] = updateData[key];
      }
    });
    
    if (Object.keys(updates).length === 0) {
      throw new Error('No valid fields to update');
    }
    
    updates.updated_at = new Date();
    
    await Property.updateOne({ _id: propertyId }, { $set: updates });
    
    return { success: true };
  }
  
  // Delete property
  async deleteProperty(propertyId, ownerId, hardDelete = false) {
    // Check if property exists and belongs to user
    const property = await Property.findOne({ _id: propertyId, owner_id: ownerId });
    
    if (!property) {
      throw new Error('Property not found or you do not have permission to delete it');
    }
    
    if (hardDelete) {
      // Hard delete: remove dependents then the property
      await PropertyImage.deleteMany({ property_id: propertyId });
      const { Favorite, Review, Booking } = require('../models');
      await Favorite.deleteMany({ property_id: propertyId });
      await Review.deleteMany({ property_id: propertyId });
      await Booking.deleteMany({ property_id: propertyId });
      await Property.deleteOne({ _id: propertyId });
    } else {
      // Soft delete
      await Property.updateOne(
        { _id: propertyId },
        { $set: { is_active: false, updated_at: new Date() } }
      );
    }
    
    return { success: true };
  }
  
  // Get properties by owner
  async getPropertiesByOwner(ownerId, filters = {}) {
    const query = { owner_id: ownerId };
    
    if (filters.is_active !== undefined) {
      query.is_active = filters.is_active;
    }
    
    const properties = await Property.find(query)
      .sort({ created_at: -1 })
      .lean();
    
    for (const property of properties) {
      property.id = property._id;
      property.owner_name = property.owner_id?.name;
      delete property.owner_id;
    }
    
    return properties;
  }
}

module.exports = new PropertyService();
