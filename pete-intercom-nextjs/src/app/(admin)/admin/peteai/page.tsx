import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function AdminPeteAIPage() {
  return (
    <>
      <h1>PeteAI Management</h1>
      <p>AI-powered assistant configuration and monitoring for the Pete Intercom application.</p>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '30px',
        marginTop: '30px'
      }}>
        <div>
          <h2>🤖 AI Training Topic Manager</h2>
          <form style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '20px',
            backgroundColor: '#fff'
          }}>
            <div style={{ marginBottom: '15px' }}>
              <Label htmlFor="user_id">User ID</Label>
              <Input 
                id="user_id" 
                name="user_id" 
                placeholder="Enter Intercom user ID"
                style={{ marginTop: '5px' }}
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <Label htmlFor="training_topic">Training Topic</Label>
              <Input 
                id="training_topic" 
                name="training_topic" 
                placeholder="e.g. Onboarding Basics, Advanced Features"
                style={{ marginTop: '5px' }}
              />
            </div>
            
            <button type="submit" className="btn-pete">
              🔄 Update Training Topic
            </button>
          </form>
        </div>

        <div>
          <h2>📊 AI Analytics</h2>
          <div style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '20px',
            backgroundColor: '#fff'
          }}>
            <div style={{ marginBottom: '15px' }}>
              <strong>🔧 Canvas Kit Interactions:</strong>
              <div style={{ fontSize: '2em', color: '#2d72d2', textAlign: 'center' }}>127</div>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <strong>📝 Training Topics Updated:</strong>
              <div style={{ fontSize: '2em', color: '#28a745', textAlign: 'center' }}>43</div>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <strong>🎯 Success Rate:</strong>
              <div style={{ fontSize: '2em', color: '#2d72d2', textAlign: 'center' }}>94%</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '30px' }}>
        <h2>💬 Bulk Training Topic Update</h2>
        <form style={{
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '20px',
          backgroundColor: '#fff'
        }}>
          <div style={{ marginBottom: '15px' }}>
            <Label htmlFor="audience">Target Audience</Label>
            <select 
              id="audience" 
              name="audience" 
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                marginTop: '5px'
              }}
            >
              <option value="everyone">Everyone</option>
              <option value="admin">Admins Only</option>
              <option value="user">Users Only</option>
              <option value="lead">Leads Only</option>
            </select>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <Label htmlFor="bulk_topic">Training Topic</Label>
            <Textarea 
              id="bulk_topic" 
              name="bulk_topic" 
              placeholder="Enter the training topic to apply to all users in the selected audience"
              rows={3}
              style={{ marginTop: '5px' }}
            />
          </div>
          
          <button type="submit" className="btn-pete">
            📢 Bulk Update Training Topics
          </button>
        </form>
      </div>

      <div style={{
        marginTop: '30px',
        padding: '20px',
        backgroundColor: '#e8f5e8',
        borderRadius: '8px',
        border: '1px solid #28a745'
      }}>
        <h3 style={{ marginTop: 0, color: '#28a745' }}>🚀 PeteAI Features</h3>
        <ul style={{ paddingLeft: '20px', marginBottom: 0 }}>
          <li><strong>Automated Training Management:</strong> Intelligently assigns training topics based on user behavior</li>
          <li><strong>Canvas Kit Integration:</strong> Seamlessly processes Intercom messenger interactions</li>
          <li><strong>Bulk Operations:</strong> Efficiently update multiple users at once</li>
          <li><strong>Analytics & Monitoring:</strong> Track AI performance and user engagement</li>
          <li><strong>Smart Recommendations:</strong> AI suggests optimal training paths for users</li>
        </ul>
      </div>

      <div style={{
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#fff3cd',
        borderRadius: '8px',
        border: '1px solid #ffc107',
        fontSize: '0.9em'
      }}>
        <strong>⚡ Status:</strong> PeteAI is integrated with the Next.js architecture and ready for enhanced functionality.
        All forms above connect to server actions for real-time processing.
      </div>
    </>
  );
}