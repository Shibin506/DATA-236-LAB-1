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

const optionalAuth = (req, res, next) => {
  if (req.session && req.session.userId) {
    req.userId = req.session.userId;
    req.userType = req.session.userType;
  }
  next();
};

module.exports = {
  requireAuth,
  requireOwner,
  requireTraveler,
  optionalAuth
};
