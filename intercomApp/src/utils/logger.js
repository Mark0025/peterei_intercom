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

function logInfo(msg, file = 'app.log') {
  const formatted = formatMsg('INFO', msg);
  logToFile(file, formatted);
  console.log(formatted); // Also print to terminal
}

function logError(msg, file = 'app.log') {
  const formatted = formatMsg('ERROR', msg);
  logToFile(file, formatted);
  console.error(formatted); // Also print to terminal
}

function logDebug(msg, file = 'app.log') {
  const formatted = formatMsg('DEBUG', msg);
  logToFile(file, formatted);
  console.debug(formatted); // Also print to terminal
}

module.exports = { logInfo, logError, logDebug }; 