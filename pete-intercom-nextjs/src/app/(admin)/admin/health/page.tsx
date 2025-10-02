'use client';

import { useState, useEffect, useTransition } from 'react';
import { getCacheStatusAction, refreshCacheAction } from '@/actions/intercom';

interface EndpointStatus {
  endpoint: string;
  status: 'healthy' | 'unhealthy' | 'checking';
  responseTime?: number;
  lastChecked?: string;
  error?: string;
}

interface CacheStatus {
  lastRefreshed: string | null;
  counts: {
    contacts: number;
    companies: number;
    admins: number;
    conversations: number;
  };
}

export default function HealthPage() {
  const [endpoints, setEndpoints] = useState<EndpointStatus[]>([]);
  const [cacheStatus, setCacheStatus] = useState<CacheStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    Promise.all([
      checkEndpoints(),
      checkCacheStatus()
    ]).finally(() => setLoading(false));
    
    const interval = setInterval(() => {
      checkEndpoints();
      checkCacheStatus();
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const checkEndpoints = async () => {
    try {
      const response = await fetch('/api/endpoints');
      const data = await response.json();
      setEndpoints(data.endpoints || []);
    } catch (error) {
      console.error('Failed to check endpoints:', error);
    }
  };

  const checkCacheStatus = async () => {
    try {
      const result = await getCacheStatusAction();
      if (result.success && result.data) {
        setCacheStatus(result.data);
      } else {
        console.error('Failed to get cache status:', result.error);
      }
    } catch (error) {
      console.error('Failed to check cache status:', error);
    }
  };

  const refreshCache = async () => {
    startTransition(async () => {
      try {
        const result = await refreshCacheAction();
        if (result.success && result.data) {
          setCacheStatus({
            lastRefreshed: result.data.lastRefreshed,
            counts: result.data.counts
          });
        } else {
          console.error('Failed to refresh cache:', result.error);
        }
      } catch (error) {
        console.error('Failed to refresh cache:', error);
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'green';
      case 'unhealthy': return 'red';
      case 'checking': return 'orange';
      default: return 'gray';
    }
  };

  if (loading) {
    return (
      <div className="main-content">
        <div className="content-wrapper">
          <h1>System Health</h1>
          <p>Checking system status...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <h1>System Health</h1>
      
      {/* Intercom Cache Status */}
      <div className="cache-section">
        <div className="section-header">
          <h2>Intercom Cache</h2>
          <button 
            onClick={refreshCache} 
            disabled={isPending}
            className="refresh-btn"
          >
            {isPending ? 'Refreshing...' : 'Refresh Cache'}
          </button>
        </div>
        
        {cacheStatus && (
          <div className="cache-status">
            <div className="cache-info">
              <p><strong>Last Refreshed:</strong> {cacheStatus.lastRefreshed ? new Date(cacheStatus.lastRefreshed).toLocaleString() : 'Never'}</p>
              <div className="cache-counts">
                <span>Contacts: {cacheStatus.counts.contacts}</span>
                <span>Companies: {cacheStatus.counts.companies}</span>
                <span>Admins: {cacheStatus.counts.admins}</span>
                <span>Conversations: {cacheStatus.counts.conversations}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* API Endpoints */}
      <div className="endpoints-section">
        <h2>API Endpoints</h2>
        <div className="health-grid">
          {endpoints.map((endpoint, index) => (
            <div key={index} className="health-card">
              <div className="health-status">
                <div 
                  className="status-indicator" 
                  style={{ backgroundColor: getStatusColor(endpoint.status) }}
                />
                <h3>{endpoint.endpoint}</h3>
              </div>
              
              <div className="health-details">
                <p><strong>Status:</strong> {endpoint.status}</p>
                {endpoint.responseTime && (
                  <p><strong>Response Time:</strong> {endpoint.responseTime}ms</p>
                )}
                {endpoint.lastChecked && (
                  <p><strong>Last Checked:</strong> {new Date(endpoint.lastChecked).toLocaleString()}</p>
                )}
                {endpoint.error && (
                  <p className="error"><strong>Error:</strong> {endpoint.error}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .cache-section {
          margin-bottom: 2rem;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .refresh-btn {
          background: #007bff;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
        }

        .refresh-btn:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }

        .refresh-btn:hover:not(:disabled) {
          background: #0056b3;
        }

        .cache-info p {
          margin: 0.5rem 0;
        }

        .cache-counts {
          display: flex;
          gap: 1rem;
          margin-top: 0.5rem;
          flex-wrap: wrap;
        }

        .cache-counts span {
          background: white;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          border: 1px solid #dee2e6;
          font-size: 0.85rem;
        }

        .endpoints-section {
          margin-top: 1rem;
        }

        .endpoints-section h2 {
          margin-bottom: 1rem;
        }

        .health-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1rem;
        }

        .health-card {
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 1rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .health-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .status-indicator {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }

        .health-details p {
          margin: 0.25rem 0;
          font-size: 0.9rem;
        }

        .error {
          color: red;
        }
      `}</style>
    </>
  );
}
