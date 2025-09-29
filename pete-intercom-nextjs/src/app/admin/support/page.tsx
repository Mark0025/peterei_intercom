export default function AdminSupportPage() {
  return (
    <>
      <h1>Support Tools</h1>
      <p>Customer support utilities and troubleshooting tools for the Pete Intercom application.</p>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '20px',
        marginTop: '30px'
      }}>
        <div style={{
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '20px',
          backgroundColor: '#fff'
        }}>
          <h3 style={{ marginTop: 0, color: '#2d72d2' }}>🔍 User Lookup</h3>
          <form>
            <input 
              type="text" 
              placeholder="Enter user ID or email"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                marginBottom: '10px'
              }}
            />
            <button type="submit" className="btn-pete">
              Search User
            </button>
          </form>
          <div style={{ marginTop: '15px', fontSize: '0.9em', color: '#666' }}>
            Find user information, training status, and interaction history.
          </div>
        </div>

        <div style={{
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '20px',
          backgroundColor: '#fff'
        }}>
          <h3 style={{ marginTop: 0, color: '#2d72d2' }}>🛠️ Canvas Kit Debugger</h3>
          <div style={{ marginBottom: '15px' }}>
            <strong>Last Canvas Kit Error:</strong>
            <div style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '8px', 
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '0.8em',
              marginTop: '5px'
            }}>
              No recent errors
            </div>
          </div>
          <button className="btn-pete">
            📊 View Full Error Log
          </button>
        </div>

        <div style={{
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '20px',
          backgroundColor: '#fff'
        }}>
          <h3 style={{ marginTop: 0, color: '#2d72d2' }}>📞 Emergency Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button className="btn-pete" style={{ margin: 0 }}>
              🚨 Clear All Cache
            </button>
            <button className="btn-pete" style={{ margin: 0 }}>
              🔄 Restart Services
            </button>
            <button className="btn-pete" style={{ margin: 0 }}>
              📧 Alert Developers
            </button>
          </div>
        </div>

        <div style={{
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '20px',
          backgroundColor: '#fff'
        }}>
          <h3 style={{ marginTop: 0, color: '#2d72d2' }}>📈 Support Metrics</h3>
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: '15px' }}>
              <div style={{ fontSize: '2em', color: '#28a745' }}>23</div>
              <div>Support Tickets Today</div>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <div style={{ fontSize: '2em', color: '#2d72d2' }}>4.2</div>
              <div>Avg Response Time (min)</div>
            </div>
            <div>
              <div style={{ fontSize: '2em', color: '#6f42c1' }}>98%</div>
              <div>Resolution Rate</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '30px' }}>
        <h2>📋 Common Issues & Solutions</h2>
        <div style={{
          border: '1px solid #ddd',
          borderRadius: '8px',
          backgroundColor: '#fff'
        }}>
          {[
            {
              issue: "Canvas Kit not loading in Intercom",
              solution: "Check webhook endpoints and verify Intercom app configuration"
            },
            {
              issue: "Training topics not updating",
              solution: "Verify user ID exists in Intercom and API permissions are correct"
            },
            {
              issue: "Onboarding form submission errors",
              solution: "Check server logs and email configuration settings"
            },
            {
              issue: "PeteAI responses are slow",
              solution: "Monitor server performance and check API rate limits"
            }
          ].map((item, index) => (
            <div key={index} style={{
              padding: '15px 20px',
              borderBottom: index < 3 ? '1px solid #eee' : 'none'
            }}>
              <div style={{ fontWeight: 'bold', color: '#2d72d2', marginBottom: '5px' }}>
                ⚠️ {item.issue}
              </div>
              <div style={{ color: '#666', fontSize: '0.9em' }}>
                💡 {item.solution}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#e8f5e8',
        borderRadius: '8px',
        border: '1px solid #28a745'
      }}>
        <strong>✅ Support System Status:</strong> All support tools are operational. 
        Real-time monitoring and alerting systems are active.
      </div>
    </>
  );
}