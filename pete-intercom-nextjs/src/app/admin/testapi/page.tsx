'use client';

import { useState } from 'react';

export default function AdminTestAPIPage() {
  const [testResults, setTestResults] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testEndpoint = async (endpoint: string, method: string = 'POST', body?: Record<string, unknown>) => {
    setIsLoading(true);
    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        ...(body && { body: JSON.stringify(body) })
      });
      
      const data = await response.json();
      setTestResults(JSON.stringify({ 
        status: response.status, 
        statusText: response.statusText,
        data 
      }, null, 2));
    } catch (error) {
      setTestResults(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <h1>API Testing Console</h1>
      <p>Test Intercom API endpoints and Canvas Kit integrations in real-time.</p>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '30px',
        marginTop: '30px'
      }}>
        <div>
          <h2>🔧 Canvas Kit Endpoints</h2>
          <div style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '20px',
            backgroundColor: '#fff'
          }}>
            <div style={{ marginBottom: '15px' }}>
              <button 
                className="btn-pete" 
                onClick={() => testEndpoint('/api/initialize')}
                disabled={isLoading}
                style={{ marginRight: '10px', marginBottom: '10px' }}
              >
                🚀 Test /api/initialize
              </button>
              
              <button 
                className="btn-pete"
                onClick={() => testEndpoint('/api/submit', 'POST', {
                  component_id: 'test_component',
                  input_values: { test: 'value' },
                  context: { user: { id: 'test_user' } }
                })}
                disabled={isLoading}
                style={{ marginBottom: '10px' }}
              >
                📝 Test /api/submit
              </button>
            </div>
            
            <h3>Test Data Generator</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const testData = {
                component_id: formData.get('component_id'),
                input_values: JSON.parse(formData.get('input_values') as string || '{}'),
                context: { user: { id: formData.get('user_id') } }
              };
              testEndpoint('/api/submit', 'POST', testData);
            }}>
              <input 
                name="component_id"
                placeholder="Component ID"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  marginBottom: '10px'
                }}
              />
              <input 
                name="user_id"
                placeholder="User ID"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  marginBottom: '10px'
                }}
              />
              <textarea 
                name="input_values"
                placeholder='Input Values (JSON): {"key": "value"}'
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  marginBottom: '10px',
                  resize: 'vertical'
                }}
              />
              <button type="submit" className="btn-pete" disabled={isLoading}>
                🧪 Test Custom Data
              </button>
            </form>
          </div>
        </div>

        <div>
          <h2>📊 Test Results</h2>
          <div style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            backgroundColor: '#fff',
            minHeight: '400px'
          }}>
            <div style={{
              padding: '15px',
              borderBottom: '1px solid #ddd',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px 8px 0 0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, color: '#2d72d2' }}>Response Data</h3>
              {isLoading && <div style={{ color: '#2d72d2' }}>⏳ Testing...</div>}
            </div>
            <div style={{ padding: '15px' }}>
              <pre style={{
                backgroundColor: '#f8f9fa',
                padding: '15px',
                borderRadius: '4px',
                fontSize: '12px',
                overflow: 'auto',
                maxHeight: '350px',
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {testResults || 'Click a test button to see results here...'}
              </pre>
            </div>
          </div>
        </div>
      </div>

      <div style={{
        marginTop: '30px',
        padding: '20px',
        backgroundColor: '#e3f2fd',
        borderRadius: '8px',
        border: '1px solid #2196f3'
      }}>
        <h3 style={{ marginTop: 0, color: '#1565c0' }}>🔍 API Testing Features</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          <div>
            <strong>Live Testing:</strong> Real-time API endpoint validation
          </div>
          <div>
            <strong>Canvas Kit Simulation:</strong> Test Intercom messenger flows
          </div>
          <div>
            <strong>Custom Payloads:</strong> Send your own test data
          </div>
          <div>
            <strong>Response Analysis:</strong> Detailed JSON response inspection
          </div>
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
        <strong>⚠️ Note:</strong> This testing console connects to live server actions. 
        Test data will be processed by the actual application logic.
      </div>
    </>
  );
}