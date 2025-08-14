const logger = require('../utils/logger');

class ErrorHandler {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  // Main error handler middleware
  handleError(err, req, res, next) {
    // Log the error
    this.logError(err, req);

    // Determine error type and create appropriate response
    const errorResponse = this.createErrorResponse(err);

    // Send error response
    res.status(errorResponse.status).json(errorResponse);
  }

  // Log error with context
  logError(err, req) {
    const errorContext = {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user ? req.user._id : null,
      body: req.body,
      query: req.query,
      params: req.params,
      headers: this.sanitizeHeaders(req.headers)
    };

    if (err.status >= 500) {
      logger.error('Server Error:', errorContext);
    } else if (err.status >= 400) {
      logger.warn('Client Error:', errorContext);
    } else {
      logger.info('Application Error:', errorContext);
    }
  }

  // Create standardized error response
  createErrorResponse(err) {
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';

    const response = {
      success: false,
      error: {
        message: this.isDevelopment ? message : this.getClientMessage(status),
        code: err.code || this.getErrorCode(status),
        status: status
      },
      timestamp: new Date().toISOString(),
      path: err.path || null
    };

    // Add additional details in development
    if (this.isDevelopment) {
      response.error.stack = err.stack;
      response.error.details = err.details || null;
    }

    // Add validation errors if present
    if (err.validationErrors) {
      response.error.validation = err.validationErrors;
    }

    return response;
  }

  // Get client-friendly error messages
  getClientMessage(status) {
    const messages = {
      400: 'Bad Request - Invalid data provided',
      401: 'Unauthorized - Authentication required',
      403: 'Forbidden - Access denied',
      404: 'Not Found - Resource not available',
      409: 'Conflict - Resource already exists',
      422: 'Unprocessable Entity - Validation failed',
      429: 'Too Many Requests - Rate limit exceeded',
      500: 'Internal Server Error - Something went wrong',
      502: 'Bad Gateway - Service temporarily unavailable',
      503: 'Service Unavailable - Server maintenance',
      504: 'Gateway Timeout - Request timeout'
    };

    return messages[status] || 'An unexpected error occurred';
  }

  // Get error codes
  getErrorCode(status) {
    const codes = {
      400: 'INVALID_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'VALIDATION_ERROR',
      429: 'RATE_LIMIT_EXCEEDED',
      500: 'INTERNAL_ERROR',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE',
      504: 'GATEWAY_TIMEOUT'
    };

    return codes[status] || 'UNKNOWN_ERROR';
  }

  // Sanitize headers for logging
  sanitizeHeaders(headers) {
    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
    
    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  // Custom error classes
  static createError(message, status = 500, code = null, details = null) {
    const error = new Error(message);
    error.status = status;
    error.code = code;
    error.details = details;
    return error;
  }

  // Validation error
  static validationError(errors, message = 'Validation failed') {
    const error = this.createError(message, 422, 'VALIDATION_ERROR');
    error.validationErrors = errors;
    return error;
  }

  // Authentication error
  static authenticationError(message = 'Authentication required') {
    return this.createError(message, 401, 'UNAUTHORIZED');
  }

  // Authorization error
  static authorizationError(message = 'Access denied') {
    return this.createError(message, 403, 'FORBIDDEN');
  }

  // Not found error
  static notFoundError(resource = 'Resource') {
    return this.createError(`${resource} not found`, 404, 'NOT_FOUND');
  }

  // Conflict error
  static conflictError(message = 'Resource already exists') {
    return this.createError(message, 409, 'CONFLICT');
  }

  // Rate limit error
  static rateLimitError(message = 'Rate limit exceeded') {
    return this.createError(message, 429, 'RATE_LIMIT_EXCEEDED');
  }

  // Database error
  static databaseError(message = 'Database operation failed') {
    return this.createError(message, 500, 'DATABASE_ERROR');
  }

  // File upload error
  static fileUploadError(message = 'File upload failed') {
    return this.createError(message, 400, 'FILE_UPLOAD_ERROR');
  }

  // External service error
  static externalServiceError(service, message = 'External service error') {
    return this.createError(`${service}: ${message}`, 502, 'EXTERNAL_SERVICE_ERROR');
  }

  // Socket error
  static socketError(message = 'Socket operation failed') {
    return this.createError(message, 500, 'SOCKET_ERROR');
  }

  // WebRTC error
  static webrtcError(message = 'WebRTC operation failed') {
    return this.createError(message, 500, 'WEBRTC_ERROR');
  }

  // Geolocation error
  static geolocationError(message = 'Geolocation service error') {
    return this.createError(message, 500, 'GEOLOCATION_ERROR');
  }

  // Payment error
  static paymentError(message = 'Payment processing failed') {
    return this.createError(message, 400, 'PAYMENT_ERROR');
  }

  // Notification error
  static notificationError(message = 'Notification delivery failed') {
    return this.createError(message, 500, 'NOTIFICATION_ERROR');
  }

  // Async error wrapper
  static asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  // Express error handler setup
  static setup(app) {
    const handler = new ErrorHandler();

    // Handle 404 errors
    app.use((req, res, next) => {
      const error = ErrorHandler.notFoundError('Route');
      error.path = req.originalUrl;
      next(error);
    });

    // Main error handler
    app.use(handler.handleError.bind(handler));

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    return handler;
  }
}

module.exports = ErrorHandler;