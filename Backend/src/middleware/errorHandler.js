const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let error = {
    success: false,
    message: err.message || 'Internal Server Error',
    statusCode: err.statusCode || 500
  };

  // MySQL errors
  if (err.code === 'ER_DUP_ENTRY') {
    error.message = 'Duplicate entry. This record already exists.';
    error.statusCode = 400;
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    error.message = 'Referenced record does not exist.';
    error.statusCode = 400;
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    error.message = 'Validation failed';
    error.statusCode = 400;
    error.errors = err.errors;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token';
    error.statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Token expired';
    error.statusCode = 401;
  }

  // Send error response
  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    ...(error.errors && { errors: error.errors }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
