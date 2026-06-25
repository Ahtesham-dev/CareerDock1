const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '..', '..', 'logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

const requestLogger = (req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  }
  next();
};

const errorLogger = (err, req, res, next) => {
  const logFile = path.join(logDir, 'error.log');
  const msg = `${new Date().toISOString()} ERROR: ${err.message}\nStack: ${err.stack}\n\n`;
  fs.appendFileSync(logFile, msg);
  console.error(err.message);
  res.status(500).json({ message: err.message || 'Server error' });
};

module.exports = { requestLogger, errorLogger };
