const bcrypt = require('bcryptjs');

/**
 * Middleware to check if user is authenticated
 */
const requireAuth = (req, res, next) => {
  if (req.session && req.session.userId) {
    req.userId = req.session.userId;
    req.userType = req.session.userType;
    next();
  } else {
    res.status(401).json({
      success: false,
      message: 'Authentication required. Please login first.'
    });
  }
};

/**
 * Middleware to check if user is owner
 */
const requireOwner = (req, res, next) => {
  if (req.session && req.session.userId && req.session.userType === 'owner') {
    req.userId = req.session.userId;
    req.userType = req.session.userType;
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Owner access required. Only property owners can access this resource.'
    });
  }
};

/**
 * Middleware to check if user is traveler
 */
const requireTraveler = (req, res, next) => {
  if (req.session && req.session.userId && req.session.userType === 'traveler') {
    req.userId = req.session.userId;
    req.userType = req.session.userType;
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Traveler access required. Only travelers can access this resource.'
    });
  }
};

/**
 * Optional authentication - doesn't block if not authenticated
 */
const optionalAuth = (req, res, next) => {
  if (req.session && req.session.userId) {
    req.userId = req.session.userId;
    req.userType = req.session.userType;
  }
  next();
};

/**
 * Hash password using bcrypt
 */
const hashPassword = async (password) => {
  try {
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  } catch (error) {
    throw new Error('Password hashing failed');
  }
};

/**
 * Compare password with hash
 */
const comparePassword = async (password, hashedPassword) => {
  try {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    return isMatch;
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

/**
 * Check if user owns the resource
 */
const checkResourceOwnership = (resourceOwnerId, userId) => {
  return resourceOwnerId === userId;
};

/**
 * Middleware to check if user can access/modify a specific resource
 */
const checkOwnership = (resourceOwnerIdField = 'owner_id') => {
  return async (req, res, next) => {
    try {
      // This will be implemented in specific routes where we fetch the resource
      // and check if the current user owns it
      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Ownership check failed'
      });
    }
  };
};

module.exports = {
  requireAuth,
  requireOwner,
  requireTraveler,
  optionalAuth,
  hashPassword,
  comparePassword,
  checkResourceOwnership,
  checkOwnership
};
