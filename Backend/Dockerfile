# Dockerfile for Airbnb Backend API

# Use official Node.js runtime as base image
FROM node:18-alpine

# Set working directory in container
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY src/ ./src/
COPY config/ ./config/
COPY routes/ ./routes/
COPY middleware/ ./middleware/
COPY server.js ./
COPY add-sample-data.js ./add-sample-data.js
COPY add-all-property-images.js ./add-all-property-images.js
COPY add-property-reviews.js ./add-property-reviews.js
COPY add-bookings-and-reviews.js ./add-bookings-and-reviews.js
COPY clean-and-populate-sf-data.js ./clean-and-populate-sf-data.js

# Create uploads directory
RUN mkdir -p uploads/profiles uploads/properties

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "server.js"]
