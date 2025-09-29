import { initializeCanvasKit } from "@/actions/canvas-kit";
import { getOnboardingData } from "@/services/onboarding-data";
import Link from 'next/link';

export default async function Home() {
  // Test server actions and data loading
  const canvasKit = await initializeCanvasKit();
  const onboardingData = getOnboardingData();
  
  return (
    <>
      <h1>Pete Intercom App Status</h1>
      <p>✅ <b>Status:</b> Pete Intercom Next.js App is running!</p>
      <p><b>Development URL:</b> <span className="endpoint">http://localhost:3000</span></p>
      
      <h2>System Status</h2>
      <ul>
        <li>
          🔧 Canvas Kit: {canvasKit.success ? 
            <span style={{color: 'green'}}>Working</span> : 
            <span style={{color: 'red'}}>Error</span>
          }
          {canvasKit.data && (
            <span className="note"> - {canvasKit.data.canvas.content.components.length} components loaded</span>
          )}
        </li>
        <li>
          📋 Onboarding Data: <span style={{color: 'green'}}>Loaded</span>
          <span className="note"> - {onboardingData.sections.length} sections, {onboardingData.sections.reduce((acc, section) => acc + section.questions.length, 0)} questions</span>
        </li>
        <li>🚀 Server Actions: <span style={{color: 'green'}}>Active</span></li>
        <li>🎨 UI Components: <span style={{color: 'green'}}>shadcn/ui + Original Styling</span></li>
        <li>🔍 TypeScript: <span style={{color: 'green'}}>Strict Mode Enabled</span></li>
      </ul>

      <h2>Intercom Webhook Endpoints</h2>
      <ul>
        <li><span className="endpoint">/api/initialize</span> <span className="note">(POST only, for Intercom Canvas Kit)</span></li>
        <li><span className="endpoint">/api/submit</span> <span className="note">(POST only, for Intercom Canvas Kit)</span></li>
      </ul>

      <h2>Available Features</h2>
      <div style={{ marginTop: '20px' }}>
        <Link href="/popout" className="btn-pete" style={{ marginRight: '10px' }}>
          📋 Open Full Onboarding Form
        </Link>
        <Link href="/whatsworking" className="btn-pete" style={{ marginRight: '10px' }}>
          🔍 What's Working
        </Link>
        <Link href="/admin" className="btn-pete">
          ⚙️ Admin Dashboard
        </Link>
      </div>
      
      <p className="note">The popout form is for browser testing and full onboarding submissions.</p>
      
      <hr style={{ margin: '40px 0', border: 'none', borderTop: '1px solid #ddd' }} />
      <p style={{ fontSize: '0.9em', color: '#888' }}>
        &copy; Pete Intercom App &mdash; Next.js 15 + React 19 + TypeScript Migration
      </p>
    </>
  );
}
