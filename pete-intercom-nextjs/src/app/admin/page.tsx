import Link from 'next/link';

const adminTools = [
  { title: '🏥 Health Check', desc: 'Monitor application health and endpoint status', href: '/admin/health' },
  { title: '📊 Logs', desc: 'View application logs and debugging information', href: '/admin/logs' },
  { title: '🤖 PeteAI', desc: 'AI assistant and training management', href: '/admin/peteai' },
  { title: '🎓 Training', desc: 'Manage user training topics and materials', href: '/admin/training' },
  { title: '⚙️ Settings', desc: 'Configure Intercom data fields and app settings', href: '/admin/settings' },
  { title: '🛠️ Support', desc: 'Support tools and user assistance', href: '/admin/support' },
  { title: '🧪 Test API', desc: 'Test Intercom API endpoints and Canvas Kit', href: '/admin/testapi' },
];

export default function AdminPage() {
  return (
    <>
      <h1>Admin Dashboard</h1>
      <p>Administrative tools and monitoring for the Pete Intercom application.</p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
        marginTop: '20px'
      }}>
        {adminTools.map((tool) => (
          <div key={tool.href} style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '20px',
            backgroundColor: '#fff',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#2d72d2' }}>{tool.title}</h3>
            <p style={{ margin: '0 0 15px 0', fontSize: '0.9em', color: '#666' }}>{tool.desc}</p>
            <Link href={tool.href} className="btn-pete" style={{ textDecoration: 'none' }}>
              Access Tool
            </Link>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
        <h3>Quick Stats</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '20px',
          textAlign: 'center',
          marginTop: '15px'
        }}>
          <div>
            <div style={{ fontSize: '2em' }}>✅</div>
            <div>Server Actions</div>
          </div>
          <div>
            <div style={{ fontSize: '2em' }}>🔗</div>
            <div>Canvas Kit APIs</div>
          </div>
          <div>
            <div style={{ fontSize: '2em' }}>📝</div>
            <div>Onboarding Forms</div>
          </div>
          <div>
            <div style={{ fontSize: '2em' }}>⚙️</div>
            <div>Admin Tools</div>
          </div>
        </div>
      </div>
    </>
  );
}
