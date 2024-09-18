import winston from 'winston';

// Get log file path and log level from environment variables
const logFilePath = process.env.LOG_FILE || 'app.log';
const logLevel = process.env.LOG_LEVEL || '0';

// Create a custom log levels configuration
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

export default logger;