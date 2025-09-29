import fs from 'fs';
import path from 'path';

const LOG_DIR = path.join(process.cwd(), 'logs');

// Ensure logs directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function formatMsg(level: string, msg: string): string {
  return `[${new Date().toISOString()}] [${level}] ${msg}\n`;
}

export function logInfo(msg: string, file: string = 'app.log'): void {
  const formatted = formatMsg('INFO', msg);
  try {
    fs.appendFileSync(path.join(LOG_DIR, file), formatted);
  } catch (error) {
    console.error('Failed to write to log file:', error);
  }
  if (process.env.NODE_ENV !== 'test') {
    console.log(formatted.trim());
  }
}

export function logError(msg: string, file: string = 'app.log'): void {
  const formatted = formatMsg('ERROR', msg);
  try {
    fs.appendFileSync(path.join(LOG_DIR, file), formatted);
  } catch (error) {
    console.error('Failed to write to log file:', error);
  }
  if (process.env.NODE_ENV !== 'test') {
    console.error(formatted.trim());
  }
}

export function logDebug(msg: string, file: string = 'app.log'): void {
  if (process.env.NODE_ENV === 'development') {
    const formatted = formatMsg('DEBUG', msg);
    try {
      fs.appendFileSync(path.join(LOG_DIR, file), formatted);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
    console.debug(formatted.trim());
  }
}

const logger = { logInfo, logError, logDebug };
export default logger;