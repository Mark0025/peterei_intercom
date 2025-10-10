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
  {
    title: '👥 Contacts & Companies',
    desc: 'View and manage Intercom contacts and companies',
    href: '/admin/contacts',
    links: [
      { label: '👤 Contacts', href: '/admin/contacts' },
      { label: '🏢 Companies', href: '/admin/companies' },
      { label: '💬 Conversations', href: '/admin/conversations' }
    ]
  },
  {
    title: '📚 Documentation',
    desc: 'Browse DEV_MAN docs, architecture, and completed work',
    href: '/admin/docs',
    links: [
      { label: '📖 Browse All Docs', href: '/admin/docs' },
      { label: '✅ Completed Issues', href: '/admin/docs?path=completed' },
      { label: '🎯 What\'s Working', href: '/whatsworking' }
    ]
  },
  {
    title: '📊 Help Desk Assessment',
    desc: 'Analyze Intercom Help Center structure and compare to industry benchmarks',
    href: '/admin/help-desk-assessment',
    links: [
      { label: '📊 Run Assessment', href: '/admin/help-desk-assessment' },
      { label: '📖 Planning Docs', href: '/admin/docs/HelpDeskPlan' }
    ]
  },
  {
    title: '📞 Pete-Vapi',
    desc: 'Voice AI system with Next.js frontend & Python Docker backend',
    href: 'https://peterental-nextjs.vercel.app/',
    links: [
      { label: '🎨 Frontend (Next.js)', href: 'https://peterental-nextjs.vercel.app/' },
      { label: '🐍 Backend (Python/Docker)', href: 'https://peterentalvapi-latest.onrender.com' },
      { label: '🎙️ Vapi Dashboard', href: 'https://dashboard.vapi.ai/?_gl=1*150thrw*_gcl_au*NTIxMTk5NDc4LjE3NTg4MjIxNTM.' }
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

      {/* Quick Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px',
        marginTop: '20px',
        marginBottom: '30px'
      }}>
        <Link href="/whatsworking" style={{ textDecoration: 'none' }}>
          <div style={{
            padding: '20px',
            backgroundColor: '#f0f9ff',
            borderRadius: '8px',
            border: '1px solid #bfdbfe',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#dbeafe';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#f0f9ff';
          }}>
            <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#2563eb' }}>85%</div>
            <div style={{ fontSize: '0.9em', color: '#1e40af', marginTop: '5px' }}>Migration Complete</div>
          </div>
        </Link>

        <Link href="/admin/docs?path=completed" style={{ textDecoration: 'none' }}>
          <div style={{
            padding: '20px',
            backgroundColor: '#f0fdf4',
            borderRadius: '8px',
            border: '1px solid #bbf7d0',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#dcfce7';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#f0fdf4';
          }}>
            <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#16a34a' }}>13</div>
            <div style={{ fontSize: '0.9em', color: '#15803d', marginTop: '5px' }}>Issues Closed</div>
          </div>
        </Link>

        <Link href="/admin/health" style={{ textDecoration: 'none' }}>
          <div style={{
            padding: '20px',
            backgroundColor: '#faf5ff',
            borderRadius: '8px',
            border: '1px solid #e9d5ff',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#f3e8ff';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#faf5ff';
          }}>
            <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#9333ea' }}>✓</div>
            <div style={{ fontSize: '0.9em', color: '#7e22ce', marginTop: '5px' }}>System Healthy</div>
          </div>
        </Link>

        <Link href="/admin/docs" style={{ textDecoration: 'none' }}>
          <div style={{
            padding: '20px',
            backgroundColor: '#fff7ed',
            borderRadius: '8px',
            border: '1px solid #fed7aa',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#ffedd5';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#fff7ed';
          }}>
            <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#ea580c' }}>📚</div>
            <div style={{ fontSize: '0.9em', color: '#c2410c', marginTop: '5px' }}>Documentation</div>
          </div>
        </Link>
      </div>

      {/* Admin Tools Grid */}
      <h2 className={typography.h2} style={{ marginTop: '40px', marginBottom: '20px' }}>Admin Tools</h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
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
                      e.currentTarget.style.textDecoration = 'underline';
                    }}
                    onMouseOut={(e) => {
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
    </>
  );
}
