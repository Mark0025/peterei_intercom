import { getOnboardingData } from '@/services/onboarding-data';

export default function AdminTrainingPage() {
  const onboardingData = getOnboardingData();
  
  return (
    <>
      <h1>Training Management</h1>
      <p>Manage user training topics, materials, and onboarding content.</p>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '30px',
        marginTop: '30px'
      }}>
        <div>
          <h2>📋 Onboarding Content Editor</h2>
          <div style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '20px',
            backgroundColor: '#fff'
          }}>
            <p>Current onboarding questionnaire structure:</p>
            {onboardingData.sections.map((section, index) => (
              <div key={index} style={{
                marginBottom: '20px',
                padding: '15px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e9ecef'
              }}>
                <h4 style={{ marginTop: 0, color: '#2d72d2' }}>
                  {section.title} ({section.questions.length} questions)
                </h4>
                <ul style={{ paddingLeft: '20px', marginBottom: 0 }}>
                  {section.questions.slice(0, 3).map((q, qIndex) => (
                    <li key={qIndex} style={{ marginBottom: '5px' }}>
                      <strong>{q.shorthand}:</strong> {q.detailed.substring(0, 80)}...
                    </li>
                  ))}
                  {section.questions.length > 3 && (
                    <li style={{ color: '#666', fontStyle: 'italic' }}>
                      ... and {section.questions.length - 3} more questions
                    </li>
                  )}
                </ul>
              </div>
            ))}
            
            <button className="btn-pete" style={{ marginTop: '15px' }}>
              ✏️ Edit Onboarding Questions
            </button>
          </div>
        </div>

        <div>
          <h2>📊 Training Stats</h2>
          <div style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '20px',
            backgroundColor: '#fff'
          }}>
            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5em', color: '#2d72d2' }}>
                {onboardingData.sections.reduce((acc, s) => acc + s.questions.length, 0)}
              </div>
              <div>Total Questions</div>
            </div>
            
            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5em', color: '#28a745' }}>
                {onboardingData.sections.length}
              </div>
              <div>Sections</div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5em', color: '#6f42c1' }}>
                156
              </div>
              <div>Completions</div>
            </div>
          </div>

          <div style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '20px',
            backgroundColor: '#fff',
            marginTop: '20px'
          }}>
            <h3 style={{ marginTop: 0 }}>🎯 Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button className="btn-pete" style={{ margin: 0 }}>
                📥 Export Responses
              </button>
              <button className="btn-pete" style={{ margin: 0 }}>
                🔄 Reset Analytics
              </button>
              <button className="btn-pete" style={{ margin: 0 }}>
                📧 Email Report
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{
        marginTop: '30px',
        padding: '20px',
        backgroundColor: '#d1ecf1',
        borderRadius: '8px',
        border: '1px solid #bee5eb'
      }}>
        <h3 style={{ marginTop: 0, color: '#0c5460' }}>💡 Training Management Features</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          <div>
            <strong>Dynamic Content:</strong> Edit onboarding questions without code changes
          </div>
          <div>
            <strong>Progress Tracking:</strong> Monitor user completion rates
          </div>
          <div>
            <strong>Analytics:</strong> Detailed insights into training effectiveness
          </div>
          <div>
            <strong>Export Tools:</strong> Generate reports and data exports
          </div>
        </div>
      </div>
    </>
  );
}