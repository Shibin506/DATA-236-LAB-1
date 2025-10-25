const Joi = require('joi');
const { validationResult } = require('express-validator');

/**
 * Generic validation middleware using Joi
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errorDetails
      });
    }
    
    next();
  };
};

/**
 * Check for express-validator results
 */
const checkValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path || error.param,
        message: error.msg,
        value: error.value
      }))
    });
  }
  
  next();
};

// Validation schemas
const schemas = {
  // User registration validation
  userRegistration: Joi.object({
    name: Joi.string().trim().min(2).max(100).required()
      .messages({
        'string.empty': 'Name is required',
        'string.min': 'Name must be at least 2 characters long',
        'string.max': 'Name cannot exceed 100 characters'
      }),
    email: Joi.string().email().lowercase().trim().required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'string.empty': 'Email is required'
      }),
    password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required()
      .messages({
        'string.empty': 'Password is required',
        'string.min': 'Password must be at least 8 characters long',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      }),
    user_type: Joi.string().valid('traveler', 'owner').default('traveler')
      .messages({
        'any.only': 'User type must be either traveler or owner'
      }),
    phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).optional()
      .messages({
        'string.pattern.base': 'Please provide a valid phone number'
      })
  }),

  // User login validation
  userLogin: Joi.object({
    email: Joi.string().email().lowercase().trim().required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'string.empty': 'Email is required'
      }),
    password: Joi.string().required()
      .messages({
        'string.empty': 'Password is required'
      })
  }),

  // Profile update validation
  profileUpdate: Joi.object({
    name: Joi.string().trim().min(2).max(100).optional(),
    phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).optional()
      .messages({
        'string.pattern.base': 'Please provide a valid phone number'
      }),
    about_me: Joi.string().max(1000).optional(),
    city: Joi.string().trim().max(100).optional(),
    state: Joi.string().trim().max(50).optional(),
    country: Joi.string().trim().max(100).optional(),
    languages: Joi.string().trim().max(255).optional(),
    gender: Joi.string().valid('male', 'female', 'other', 'prefer_not_to_say').optional()
  }),

  // Property creation validation
  propertyCreate: Joi.object({
    name: Joi.string().trim().min(5).max(255).required()
      .messages({
        'string.empty': 'Property name is required',
        'string.min': 'Property name must be at least 5 characters long',
        'string.max': 'Property name cannot exceed 255 characters'
      }),
    description: Joi.string().trim().max(2000).required()
      .messages({
        'string.empty': 'Property description is required',
        'string.max': 'Description cannot exceed 2000 characters'
      }),
    property_type: Joi.string().valid('apartment', 'house', 'condo', 'villa', 'studio', 'loft').required()
      .messages({
        'any.only': 'Property type must be one of: apartment, house, condo, villa, studio, loft'
      }),
    address: Joi.string().trim().min(10).max(500).required()
      .messages({
        'string.empty': 'Property address is required',
        'string.min': 'Address must be at least 10 characters long',
        'string.max': 'Address cannot exceed 500 characters'
      }),
    city: Joi.string().trim().min(2).max(100).required()
      .messages({
        'string.empty': 'City is required',
        'string.min': 'City must be at least 2 characters long'
      }),
    state: Joi.string().trim().min(2).max(50).required()
      .messages({
        'string.empty': 'State is required'
      }),
    country: Joi.string().trim().min(2).max(100).required()
      .messages({
        'string.empty': 'Country is required'
      }),
    price_per_night: Joi.number().positive().precision(2).max(10000).required()
      .messages({
        'number.positive': 'Price must be a positive number',
        'number.max': 'Price cannot exceed $10,000 per night'
      }),
    bedrooms: Joi.number().integer().min(0).max(20).required()
      .messages({
        'number.integer': 'Number of bedrooms must be a whole number',
        'number.min': 'Number of bedrooms cannot be negative'
      }),
    bathrooms: Joi.number().min(0).max(20).required()
      .messages({
        'number.min': 'Number of bathrooms cannot be negative'
      }),
    max_guests: Joi.number().integer().min(1).max(50).required()
      .messages({
        'number.integer': 'Max guests must be a whole number',
        'number.min': 'Maximum guests must be at least 1',
        'number.max': 'Maximum guests cannot exceed 50'
      }),
    amenities: Joi.string().optional(),
    house_rules: Joi.string().max(1000).optional(),
    availability_start: Joi.date().optional(),
    availability_end: Joi.date().min(Joi.ref('availability_start')).optional()
  }),

  // Property update validation
  propertyUpdate: Joi.object({
    name: Joi.string().trim().min(5).max(255).optional(),
    description: Joi.string().trim().max(2000).optional(),
    property_type: Joi.string().valid('apartment', 'house', 'condo', 'villa', 'studio', 'loft').optional(),
    address: Joi.string().trim().min(10).max(500).optional(),
    city: Joi.string().trim().min(2).max(100).optional(),
    state: Joi.string().trim().min(2).max(50).optional(),
    country: Joi.string().trim().min(2).max(100).optional(),
    price_per_night: Joi.number().positive().precision(2).max(10000).optional(),
    bedrooms: Joi.number().integer().min(0).max(20).optional(),
    bathrooms: Joi.number().min(0).max(20).optional(),
    max_guests: Joi.number().integer().min(1).max(50).optional(),
    amenities: Joi.string().optional(),
    house_rules: Joi.string().max(1000).optional(),
    availability_start: Joi.date().optional(),
    availability_end: Joi.date().min(Joi.ref('availability_start')).optional(),
    is_active: Joi.boolean().optional()
  }),

  // Booking validation
  bookingCreate: Joi.object({
    property_id: Joi.number().integer().positive().required()
      .messages({
        'number.positive': 'Property ID must be a positive number'
      }),
    check_in_date: Joi.date().min('now').required()
      .messages({
        'date.min': 'Check-in date must be in the future'
      }),
    check_out_date: Joi.date().min(Joi.ref('check_in_date')).required()
      .messages({
        'date.min': 'Check-out date must be after check-in date'
      }),
    number_of_guests: Joi.number().integer().min(1).max(50).required()
      .messages({
        'number.integer': 'Number of guests must be a whole number',
        'number.min': 'Number of guests must be at least 1',
        'number.max': 'Number of guests cannot exceed 50'
      }),
    special_requests: Joi.string().max(500).optional()
  }),

  // Property search validation
  propertySearch: Joi.object({
    location: Joi.string().trim().min(2).optional(),
    city: Joi.string().trim().optional(),
    state: Joi.string().trim().optional(),
    country: Joi.string().trim().optional(),
    check_in_date: Joi.date().min('now').optional(),
    check_out_date: Joi.date().min(Joi.ref('check_in_date')).optional(),
    guests: Joi.number().integer().min(1).max(50).optional(),
    min_price: Joi.number().min(0).optional(),
    max_price: Joi.number().min(0).optional(),
    property_type: Joi.string().valid('apartment', 'house', 'condo', 'villa', 'studio', 'loft').optional(),
    min_bedrooms: Joi.number().integer().min(0).optional(),
    amenities: Joi.string().optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sort_by: Joi.string().valid('price_low', 'price_high', 'newest', 'oldest', 'rating').default('newest')
  })
};

module.exports = {
  validate,
  checkValidationErrors,
  schemas
};
