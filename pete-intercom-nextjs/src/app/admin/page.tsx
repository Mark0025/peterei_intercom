'use client';

import Link from 'next/link';
import { useTypography } from '@/contexts/UIConfigContext';

const adminTools = [
  {
    title: '💡 Onboarding Discovery',
    desc: 'Deep dive into onboarding with insights & 7-levels questionnaire',
    href: '/admin/onboarding-insights',
    links: [
      { label: '📊 Conversation Insights', href: '/admin/onboarding-insights' },
      { label: '📝 7-Levels Questionnaire', href: '/admin/onboarding-questionnaire' },
      { label: '💾 View Responses', href: '/admin/onboarding-responses' }
    ]
  },
  { title: '🏥 Health Check', desc: 'Monitor application health and endpoint status', href: '/admin/health' },
  { title: '📊 Logs', desc: 'View application logs and debugging information', href: '/admin/logs' },
  { title: '🤖 PeteAI', desc: 'AI assistant and training management', href: '/admin/peteai' },
  { title: '🎓 Training', desc: 'Manage user training topics and materials', href: '/admin/training' },
  {
    title: '⚙️ Settings',
    desc: 'Configure Intercom data fields and app settings',
    href: '/admin/settings',
    links: [
      { label: '📊 Intercom Fields', href: '/admin/settings' },
      { label: '🎨 UI Configuration', href: '/admin/settings/ui' }
    ]
  },
  { title: '🛠️ Support', desc: 'Support tools and user assistance', href: '/admin/support' },
  { title: '🧪 Test API', desc: 'Test Intercom API endpoints and Canvas Kit', href: '/admin/testapi' },
];

export default function AdminPage() {
  const typography = useTypography();

  return (
    <>
      <h1 className={typography.h1}>Admin Dashboard</h1>
      <p className={typography.paragraph}>Administrative tools and monitoring for the Pete Intercom application.</p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
        marginTop: '20px'
      }}>
        {adminTools.map((tool) => (
          <Link
            key={tool.href}
            href={tool.links ? tool.links[0].href : tool.href}
            style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '20px',
              backgroundColor: '#fff',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              textDecoration: 'none',
              display: 'block',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(45,114,210,0.2)';
              e.currentTarget.style.borderColor = '#2d72d2';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
              e.currentTarget.style.borderColor = '#ddd';
            }}
          >
            <h3 className={typography.h3} style={{ margin: '0 0 10px 0', color: '#2d72d2' }}>{tool.title}</h3>
            <p className={typography.paragraph} style={{ margin: '0 0 15px 0', color: '#666' }}>{tool.desc}</p>

            {tool.links && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                {tool.links.map((link, idx) => (
                  <Link
                    key={idx}
                    href={link.href}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      fontSize: '0.85em',
                      color: '#2d72d2',
                      textDecoration: 'none',
                      padding: '4px 0',
                      borderBottom: '1px solid #e0e0e0'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.color = '#1a4d8f';
                      e.currentTarget.style.textDecoration = 'underline';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.color = '#2d72d2';
                      e.currentTarget.style.textDecoration = 'none';
                    }}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </Link>
        ))}
      </div>

      <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
        <h3 className={typography.h3}>Quick Stats</h3>
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
