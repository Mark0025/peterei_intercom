import fs from 'fs';
import path from 'path';

const LOG_DIR = path.join(path.dirname(new URL(import.meta.url).pathname), '../logs');
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR);
}

function formatMsg(level, msg) {
  return `[${new Date().toISOString()}] [${level}] ${msg}\n`;
}

function logInfo(msg, file = 'app.log') {
  const formatted = formatMsg('INFO', msg);
  fs.appendFileSync(path.join(LOG_DIR, file), formatted);
  if (process.env.NODE_ENV !== 'test') console.log(formatted.trim());
}

function logError(msg, file = 'app.log') {
  const formatted = formatMsg('ERROR', msg);
  fs.appendFileSync(path.join(LOG_DIR, file), formatted);
  if (process.env.NODE_ENV !== 'test') console.error(formatted.trim());
}

function logDebug(msg, file = 'app.log') {
  if (process.env.NODE_ENV === 'development') {
  const formatted = formatMsg('DEBUG', msg);
    fs.appendFileSync(path.join(LOG_DIR, file), formatted);
    console.debug(formatted.trim());
  }
}

export default { logInfo, logError, logDebug }; 