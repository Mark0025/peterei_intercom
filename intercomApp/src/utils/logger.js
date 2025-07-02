const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '../logs');
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR);
}

function formatMsg(level, msg) {
  return `[${new Date().toISOString()}] [${level}] ${msg}\n`;
}

function logToFile(filename, msg) {
  const filePath = path.join(LOG_DIR, filename);
  fs.appendFileSync(filePath, msg, 'utf8');
}

function logInfo(msg) {
  const formatted = formatMsg('INFO', msg);
  logToFile('app.log', formatted);
}

function logError(msg) {
  const formatted = formatMsg('ERROR', msg);
  logToFile('app.log', formatted);
}

function logDebug(msg) {
  const formatted = formatMsg('DEBUG', msg);
  logToFile('app.log', formatted);
}

module.exports = { logInfo, logError, logDebug }; 