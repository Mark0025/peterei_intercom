import { readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

function getLogs() {
  const logsDir = join(process.cwd(), 'logs');
  const appLogPath = join(logsDir, 'app.log');
  const apiLogPath = join(logsDir, 'api.log');
  
  // Create logs directory if it doesn't exist
  if (!existsSync(logsDir)) {
    mkdirSync(logsDir, { recursive: true });
  }
  
  let appLogs = '';
  let apiLogs = '';
  
  try {
    appLogs = existsSync(appLogPath) ? readFileSync(appLogPath, 'utf8') : 'No application logs yet.';
  } catch (error) {
    appLogs = 'Error reading application logs.';
  }
  
  try {
    apiLogs = existsSync(apiLogPath) ? readFileSync(apiLogPath, 'utf8') : 'No API logs yet.';
  } catch (error) {
    apiLogs = 'Error reading API logs.';
  }
  
  return {
    appLogs: appLogs.split('\n').slice(-50).join('\n'), // Last 50 lines
    apiLogs: apiLogs.split('\n').slice(-50).join('\n'), // Last 50 lines
    timestamp: new Date().toISOString()
  };
}

export default function AdminLogsPage() {
  const logs = getLogs();
  
  return (
    <>
      <h1>Application Logs</h1>
      <p>Real-time view of Pete Intercom application logs</p>
      
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <form action="/admin/logs" method="GET" style={{ display: 'inline' }}>
          <button type="submit" className="btn-pete">
            🔄 Refresh Logs
          </button>
        </form>
      </div>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
        marginTop: '20px'
      }}>
        <div style={{
          border: '1px solid #ddd',
          borderRadius: '8px',
          backgroundColor: '#fff'
        }}>
          <div style={{
            padding: '15px',
            borderBottom: '1px solid #ddd',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px 8px 0 0'
          }}>
            <h3 style={{ margin: 0, color: '#2d72d2' }}>📝 Application Logs</h3>
          </div>
          <div style={{ padding: '15px' }}>
            <pre style={{
              backgroundColor: '#f8f9fa',
              padding: '10px',
              borderRadius: '4px',
              fontSize: '12px',
              overflow: 'auto',
              maxHeight: '400px',
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}>
              {logs.appLogs}
            </pre>
          </div>
        </div>

        <div style={{
          border: '1px solid #ddd',
          borderRadius: '8px',
          backgroundColor: '#fff'
        }}>
          <div style={{
            padding: '15px',
            borderBottom: '1px solid #ddd',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px 8px 0 0'
          }}>
            <h3 style={{ margin: 0, color: '#2d72d2' }}>🔗 API Logs</h3>
          </div>
          <div style={{ padding: '15px' }}>
            <pre style={{
              backgroundColor: '#f8f9fa',
              padding: '10px',
              borderRadius: '4px',
              fontSize: '12px',
              overflow: 'auto',
              maxHeight: '400px',
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}>
              {logs.apiLogs}
            </pre>
          </div>
        </div>
      </div>

      <div style={{
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#e3f2fd',
        borderRadius: '8px',
        border: '1px solid #2196f3'
      }}>
        <h4 style={{ marginTop: 0 }}>📊 Log Information</h4>
        <div style={{ fontSize: '0.9em' }}>
          <strong>Last Updated:</strong> {new Date(logs.timestamp).toLocaleString()}<br/>
          <strong>Showing:</strong> Last 50 lines from each log file<br/>
          <strong>Log Directory:</strong> <code>/logs</code><br/>
          <strong>Files:</strong> <code>app.log</code>, <code>api.log</code>
        </div>
      </div>

      <div style={{
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#fff3cd',
        borderRadius: '8px',
        border: '1px solid #ffc107',
        fontSize: '0.9em'
      }}>
        <strong>💡 Note:</strong> In production, logs would be streaming from the actual application. 
        Currently showing static files. To see live logs, check the browser console and server terminal output.
      </div>
    </>
  );
}