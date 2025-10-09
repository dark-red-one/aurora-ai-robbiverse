/**
 * RobbieBar Public Page - Requires Authentication
 * Accessible at aurora.askrobbie.ai/robbiebar
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { RobbieBar } from '../blocks/cursor/RobbieBar'

export default function RobbieBarPublic() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    // Check if user is authenticated (same as chat)
    const checkAuth = async () => {
      const token = localStorage.getItem('robbie_token')
      
      if (!token) {
        // Redirect to login
        navigate('/login?redirect=/robbiebar')
        return
      }

      try {
        // Verify token with backend
        const response = await fetch('http://localhost:8000/api/v1/auth/verify', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          setIsAuthenticated(true)
        } else {
          // Token invalid, redirect to login
          localStorage.removeItem('robbie_token')
          navigate('/login?redirect=/robbiebar')
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        navigate('/login?redirect=/robbiebar')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [navigate])

  const handleOpenChat = () => {
    navigate('/')
  }

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#0d1117',
        color: '#00d9ff',
        fontFamily: 'monospace'
      }}>
        <div>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>💜</div>
          <div>Authenticating...</div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect
  }

  return (
    <div style={{
      background: '#0d1117',
      minHeight: '100vh',
      paddingTop: '60px'
    }}>
      <RobbieBar onOpenChat={handleOpenChat} />
      
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '40px 20px',
        color: 'white'
      }}>
        <h1 style={{ color: '#00d9ff', marginBottom: '30px' }}>
          🎯 RobbieBar - Your AI Coding Companion
        </h1>
        
        <div style={{ lineHeight: '1.8', color: 'rgba(255,255,255,0.8)' }}>
          <p><strong>Welcome to RobbieBar!</strong> Your AI companion is always visible at the top.</p>
          
          <h2 style={{ color: '#ff6b9d', marginTop: '40px', marginBottom: '20px' }}>
            ✨ Features
          </h2>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li style={{ marginBottom: '12px' }}>
              🤖 <strong>Mood Indicator</strong> - See Robbie's current mood and personality
            </li>
            <li style={{ marginBottom: '12px' }}>
              💬 <strong>Chat Button</strong> - One-click access to full Robbie app
            </li>
            <li style={{ marginBottom: '12px' }}>
              🔥 <strong>CPU Usage</strong> - Real-time system monitoring
            </li>
            <li style={{ marginBottom: '12px' }}>
              💾 <strong>Memory Usage</strong> - RAM usage at a glance
            </li>
            <li style={{ marginBottom: '12px' }}>
              🎮 <strong>GPU Usage</strong> - GPU utilization tracking
            </li>
            <li style={{ marginBottom: '12px' }}>
              👥 <strong>Active Users</strong> - See who's coding with Robbie
            </li>
            <li style={{ marginBottom: '12px' }}>
              🌧️ <strong>Matrix Background</strong> - Subtle, gorgeous animation
            </li>
          </ul>

          <h2 style={{ color: '#ff6b9d', marginTop: '40px', marginBottom: '20px' }}>
            💡 How to Use
          </h2>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li style={{ marginBottom: '12px' }}>
              • Click the <strong>💬 Chat</strong> button to open the full Robbie app
            </li>
            <li style={{ marginBottom: '12px' }}>
              • Hover over system stats for detailed tooltips
            </li>
            <li style={{ marginBottom: '12px' }}>
              • Watch the stats update in real-time every 2 seconds
            </li>
            <li style={{ marginBottom: '12px' }}>
              • Enjoy the subtle matrix rain animation in the background
            </li>
          </ul>

          <h2 style={{ color: '#ff6b9d', marginTop: '40px', marginBottom: '20px' }}>
            🚀 Integration
          </h2>
          <p>
            RobbieBar is designed to integrate seamlessly into your workflow. 
            It's publicly accessible at <strong>aurora.askrobbie.ai/robbiebar</strong> but 
            requires authentication (same login as chat).
          </p>
          <p style={{ marginTop: '20px' }}>
            If you're already logged into the Robbie chat, you're automatically authenticated here!
          </p>

          <div style={{
            marginTop: '60px',
            padding: '30px',
            background: 'rgba(0, 217, 255, 0.05)',
            borderRadius: '12px',
            border: '1px solid rgba(0, 217, 255, 0.2)'
          }}>
            <h3 style={{ color: '#00d9ff', marginBottom: '15px' }}>
              💜 Built with Love
            </h3>
            <p style={{ margin: 0 }}>
              RobbieBar is your AI coding companion, always there when you need it. 
              Built to make your development workflow smoother, smarter, and more enjoyable.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
