const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Airbnb Backend API',
      version: '1.0.0',
      description: 'A comprehensive backend API for an Airbnb-like platform',
      contact: {
        name: 'Your Name',
        email: 'your.email@example.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001/api',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        sessionAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'airbnb.session'
        }
      },
      schemas: {
        User: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            id: { type: 'integer' },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            password: { type: 'string', minLength: 8 },
            user_type: { type: 'string', enum: ['traveler', 'owner'] },
            phone: { type: 'string' },
            about_me: { type: 'string' },
            city: { type: 'string' },
            state: { type: 'string' },
            country: { type: 'string' },
            languages: { type: 'string' },
            gender: { type: 'string', enum: ['male', 'female', 'other', 'prefer_not_to_say'] },
            profile_picture: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Property: {
          type: 'object',
          required: ['name', 'description', 'property_type', 'address', 'city', 'state', 'country', 'price_per_night', 'bedrooms', 'bathrooms', 'max_guests'],
          properties: {
            id: { type: 'integer' },
            name: { type: 'string', example: 'Beautiful Downtown Apartment' },
            description: { type: 'string' },
            property_type: { type: 'string', enum: ['apartment', 'house', 'condo', 'villa', 'studio', 'loft'] },
            address: { type: 'string' },
            city: { type: 'string' },
            state: { type: 'string' },
            country: { type: 'string' },
            price_per_night: { type: 'number', format: 'float' },
            bedrooms: { type: 'integer' },
            bathrooms: { type: 'number', format: 'float' },
            max_guests: { type: 'integer' },
            amenities: { type: 'string' },
            house_rules: { type: 'string' },
            is_active: { type: 'boolean' }
          }
        },
        Booking: {
          type: 'object',
          required: ['property_id', 'check_in_date', 'check_out_date', 'number_of_guests'],
          properties: {
            id: { type: 'integer' },
            property_id: { type: 'integer' },
            check_in_date: { type: 'string', format: 'date' },
            check_out_date: { type: 'string', format: 'date' },
            number_of_guests: { type: 'integer' },
            total_price: { type: 'number', format: 'float' },
            status: { type: 'string', enum: ['pending', 'accepted', 'cancelled', 'completed'] },
            special_requests: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' }
                }
              }
            }
          }
        }
      }
    },
    security: [
      {
        sessionAuth: []
      }
    ]
  },
  apis: ['./routes/*.js'] // Path to the API files
};

const specs = swaggerJSDoc(options);

module.exports = { swaggerUi, specs };