const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Define which level to log based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

// Define format for logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Define format for file logs (without colors)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level.toUpperCase()}: ${info.message}${info.stack ? '\n' + info.stack : ''}`,
  ),
);

// Define transports
const transports = [
  // Console transport
  new winston.transports.Console({
    format,
    level: level(),
  }),
  
  // Error log file
  new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
  
  // Combined log file
  new winston.transports.File({
    filename: path.join(logsDir, 'combined.log'),
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
  
  // HTTP requests log file
  new winston.transports.File({
    filename: path.join(logsDir, 'http.log'),
    level: 'http',
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 3,
  }),
];

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format: fileFormat,
  transports,
  exitOnError: false,
});

// Create a stream object for Morgan HTTP logging
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

// Add request logging middleware
logger.logRequest = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logMessage = `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms - ${req.ip}`;
    
    if (res.statusCode >= 400) {
      logger.warn(logMessage);
    } else {
      logger.http(logMessage);
    }
  });
  
  next();
};

// Add error logging middleware
logger.logError = (error, req, res, next) => {
  logger.error(`Error: ${error.message}`, {
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user ? req.user._id : null,
  });
  
  next(error);
};

// Add performance logging
logger.logPerformance = (operation, duration, metadata = {}) => {
  const level = duration > 1000 ? 'warn' : 'info';
  logger[level](`Performance: ${operation} took ${duration}ms`, metadata);
};

// Add database query logging
logger.logDatabaseQuery = (operation, collection, duration, query = {}) => {
  const level = duration > 100 ? 'warn' : 'debug';
  logger[level](`Database: ${operation} on ${collection} took ${duration}ms`, {
    query: JSON.stringify(query),
    collection,
    operation,
  });
};

// Add socket event logging
logger.logSocketEvent = (event, socketId, userId = null, data = {}) => {
  logger.info(`Socket: ${event} from ${socketId}`, {
    userId,
    event,
    socketId,
    data: JSON.stringify(data),
  });
};

// Add authentication logging
logger.logAuth = (action, userId, success, details = {}) => {
  const level = success ? 'info' : 'warn';
  logger[level](`Auth: ${action} ${success ? 'successful' : 'failed'} for user ${userId}`, {
    action,
    userId,
    success,
    details,
  });
};

// Add business logic logging
logger.logBusiness = (action, userId, details = {}) => {
  logger.info(`Business: ${action} by user ${userId}`, {
    action,
    userId,
    details,
  });
};

// Add security logging
logger.logSecurity = (event, userId = null, details = {}) => {
  logger.warn(`Security: ${event}`, {
    event,
    userId,
    details,
    timestamp: new Date().toISOString(),
  });
};

// Add rate limiting logging
logger.logRateLimit = (ip, endpoint, limit, remaining) => {
  logger.warn(`Rate Limit: ${ip} hit limit for ${endpoint}`, {
    ip,
    endpoint,
    limit,
    remaining,
  });
};

// Add file upload logging
logger.logFileUpload = (userId, fileName, fileSize, fileType) => {
  logger.info(`File Upload: ${fileName} by user ${userId}`, {
    userId,
    fileName,
    fileSize,
    fileType,
  });
};

// Add API usage logging
logger.logApiUsage = (endpoint, method, userId = null, duration = 0) => {
  logger.info(`API: ${method} ${endpoint}`, {
    endpoint,
    method,
    userId,
    duration,
  });
};

// Add system health logging
logger.logSystemHealth = (component, status, details = {}) => {
  const level = status === 'healthy' ? 'info' : 'error';
  logger[level](`System Health: ${component} is ${status}`, {
    component,
    status,
    details,
  });
};

// Add cleanup logging
logger.logCleanup = (operation, count, duration) => {
  logger.info(`Cleanup: ${operation} processed ${count} items in ${duration}ms`, {
    operation,
    count,
    duration,
  });
};

// Add notification logging
logger.logNotification = (type, userId, success, details = {}) => {
  const level = success ? 'info' : 'error';
  logger[level](`Notification: ${type} ${success ? 'sent' : 'failed'} to user ${userId}`, {
    type,
    userId,
    success,
    details,
  });
};

// Add monetization logging
logger.logMonetization = (action, userId, amount, currency = 'USD', details = {}) => {
  logger.info(`Monetization: ${action} for user ${userId}`, {
    action,
    userId,
    amount,
    currency,
    details,
  });
};

// Add geolocation logging
logger.logGeolocation = (action, userId, coordinates, success, details = {}) => {
  const level = success ? 'info' : 'warn';
  logger[level](`Geolocation: ${action} for user ${userId}`, {
    action,
    userId,
    coordinates,
    success,
    details,
  });
};

// Add WebRTC logging
logger.logWebRTC = (action, userId, callId, details = {}) => {
  logger.info(`WebRTC: ${action} for user ${userId}`, {
    action,
    userId,
    callId,
    details,
  });
};

// Add streak logging
logger.logStreak = (action, userId, streakCount, details = {}) => {
  logger.info(`Streak: ${action} for user ${userId}`, {
    action,
    userId,
    streakCount,
    details,
  });
};

// Add story logging
logger.logStory = (action, userId, storyId, details = {}) => {
  logger.info(`Story: ${action} by user ${userId}`, {
    action,
    userId,
    storyId,
    details,
  });
};

// Add message logging
logger.logMessage = (action, userId, messageId, details = {}) => {
  logger.info(`Message: ${action} by user ${userId}`, {
    action,
    userId,
    messageId,
    details,
  });
};

// Add friend logging
logger.logFriend = (action, userId, friendId, details = {}) => {
  logger.info(`Friend: ${action} between users ${userId} and ${friendId}`, {
    action,
    userId,
    friendId,
    details,
  });
};

// Export the logger
module.exports = logger;