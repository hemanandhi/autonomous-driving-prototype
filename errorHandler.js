/**
 * Centralized Error Handling Middleware
 */

const errorHandler = (err, req, res, next) => {
  console.error(`[API Error] ${req.method} ${req.url}:`, err.message || err);

  const statusCode = err.statusCode || (err.name === 'ValidationError' ? 400 : 500);

  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error',
    statusCode,
    timestamp: new Date().toISOString()
  });
};

module.exports = errorHandler;
