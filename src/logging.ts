import winston from 'winston';

// Get log file path and log level from environment variables
const logFilePath = process.env.LOG_FILE || 'app.log';
const logLevel = process.env.LOG_LEVEL || '0';


const customLevels = {
  levels: {
    error: 0,
    info: 1,
    debug: 2
  },
  colors: {
    error: 'red',
    info: 'green',
    debug: 'blue'
  }
};

// Create a logger instance
const logger = winston.createLogger({
  levels: customLevels.levels,
  level: getLogLevel(logLevel),
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: logFilePath })
  ],
  silent: logLevel === '0'
});

// Helper function to map numeric log levels to Winston log levels
function getLogLevel(level: string): string {
  switch (level) {
    case '0':
      return 'error';
    case '1':
      return 'info';
    case '2':
      return 'debug';
    default:
      return 'error';
  }
}

// Add console transport if not in production and log level is not 0
if (process.env.NODE_ENV !== 'production' && logLevel !== '0') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize({ colors: customLevels.colors }),
      winston.format.simple()
    )
  }));
}

export default logger;