/**
 * RobbieBar Test Page
 * Test the RobbieBar component before deploying to Cursor
 */
import React from 'react'
import { RobbieBar } from '../blocks'

const RobbieBarTest: React.FC = () => {
  const handleOpenChat = () => {
    alert('Chat button clicked! In Cursor, this would open the full Robbie app.')
  }

  return (
    <div style={{ padding: '60px 20px 20px', background: '#0d1117', minHeight: '100vh' }}>
      {/* RobbieBar at top */}
      <RobbieBar onOpenChat={handleOpenChat} />
      
      {/* Test content below */}
      <div style={{ maxWidth: '800px', margin: '0 auto', color: 'white' }}>
        {/* TROUBLESHOOTING INFO */}
        <div style={{ 
          background: 'rgba(255, 165, 0, 0.1)', 
          border: '2px solid rgba(255, 165, 0, 0.5)',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '20px',
          fontFamily: 'monospace',
          fontSize: '12px'
        }}>
          <h3 style={{ color: '#ffa500', marginBottom: '10px' }}>
            🔧 TROUBLESHOOTING INFO:
          </h3>
          <div style={{ color: '#ffa500' }}>
            <div><strong>Last Updated:</strong> {new Date().toLocaleString()}</div>
            <div><strong>Build:</strong> 20251008-090745 (BrowserRouter basename fix)</div>
            <div><strong>API Endpoint:</strong> /api/system/stats (nginx proxy to 8002)</div>
            <div><strong>Memory API:</strong> http://localhost:8002/health</div>
            <div><strong>React Router:</strong> basename="/code" ✅</div>
            <div><strong>Status:</strong> ROBBIEBAR WORKING ✅</div>
          </div>
        </div>

        <h1 style={{ fontSize: '32px', marginBottom: '20px', color: '#00d9ff' }}>
          🎯 RobbieBar Test Page
        </h1>
        
        <div style={{ 
          background: 'rgba(0, 217, 255, 0.05)', 
          border: '1px solid rgba(0, 217, 255, 0.2)',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h2 style={{ fontSize: '20px', marginBottom: '12px', color: '#00d9ff' }}>
            ✅ What to Test:
          </h2>
          <ul style={{ lineHeight: '1.8' }}>
            <li>🤖 <strong>Avatar + Mood</strong> - Shows current mood from personality store</li>
            <li>💬 <strong>Chat Button</strong> - Click to test (shows alert)</li>
            <li>🔥 <strong>System Stats</strong> - CPU, Memory, GPU update every 2 seconds</li>
            <li>👥 <strong>Active Users</strong> - Shows who's online (WebSocket)</li>
            <li>🟢 <strong>Status Dot</strong> - Green when connected, orange when loading</li>
            <li>🌧️ <strong>Matrix Background</strong> - Subtle animated effect</li>
          </ul>
        </div>

        <div style={{ 
          background: 'rgba(255, 107, 157, 0.05)', 
          border: '1px solid rgba(255, 107, 157, 0.2)',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h2 style={{ fontSize: '20px', marginBottom: '12px', color: '#ff6b9d' }}>
            🔧 Backend Requirements:
          </h2>
          <ul style={{ lineHeight: '1.8' }}>
            <li>✅ <code>/api/system/stats</code> - Returns CPU, memory, GPU usage</li>
            <li>✅ <code>/ws/users</code> - WebSocket for active users</li>
            <li>✅ Backend running on port 8002, proxied through nginx</li>
          </ul>
        </div>

        <div style={{ 
          background: 'rgba(0, 255, 65, 0.05)', 
          border: '1px solid rgba(0, 255, 65, 0.2)',
          borderRadius: '8px',
          padding: '20px'
        }}>
          <h2 style={{ fontSize: '20px', marginBottom: '12px', color: '#00ff41' }}>
            🚀 Next Steps:
          </h2>
          <ol style={{ lineHeight: '1.8' }}>
            <li>Test all features on this page</li>
            <li>Verify system stats update in real-time</li>
            <li>Check WebSocket connection (should show "Online")</li>
            <li>Test mood changes (change in Setup panel)</li>
            <li>Once working, deploy to Cursor extension!</li>
          </ol>
        </div>

        <div style={{ marginTop: '40px', padding: '20px', background: 'rgba(0, 217, 255, 0.05)', borderRadius: '8px' }}>
          <h3 style={{ color: '#00d9ff', marginBottom: '12px' }}>📊 Current Personality State:</h3>
          <pre style={{ 
            background: '#161b22', 
            padding: '12px', 
            borderRadius: '6px',
            overflow: 'auto',
            fontSize: '12px',
            fontFamily: 'monospace'
          }}>
            {JSON.stringify({
              mood: 'Check RobbieBar above',
              flirtMode: 'Synced from personality store',
              expression: 'Updates dynamically'
            }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}

export default RobbieBarTest
