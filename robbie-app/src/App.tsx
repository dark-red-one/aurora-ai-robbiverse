import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MatrixWelcome from './blocks/layout/MatrixWelcome'
import RobbieAuth from './blocks/layout/RobbieAuth'
import MainApp from './blocks/layout/MainApp'
import RobbieBarTest from './pages/RobbieBarTest'
import RobbieBarPublic from './pages/RobbieBarPublic'

type AppState = 'welcome' | 'login' | 'app'

function App() {
  const [appState, setAppState] = useState<AppState>('welcome')
  const [user, setUser] = useState<any>(null)

  // Check for existing session on mount
  useEffect(() => {
    const token = localStorage.getItem('robbie_token')
    const userStr = localStorage.getItem('robbie_user')
    
    if (token && userStr) {
      try {
        const userData = JSON.parse(userStr)
        setUser(userData)
        setAppState('app')
      } catch (err) {
        // Invalid stored data, clear it
        localStorage.removeItem('robbie_token')
        localStorage.removeItem('robbie_user')
      }
    }
  }, [])

  const handleWelcomeComplete = () => {
    setAppState('login')
  }

  const handleLogin = async (credentials: { email: string; password: string }) => {
    try {
      // Call backend auth API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      })

      if (!response.ok) {
        throw new Error('Invalid credentials')
      }

      const data = await response.json()
      
      // Store token and user info
      localStorage.setItem('robbie_token', data.token)
      localStorage.setItem('robbie_user', JSON.stringify(data.user))
      
      setUser(data.user)
      setAppState('app')
    } catch (err) {
      // Fallback for development - simple password check
      if (credentials.password === 'go2Work!') {
        const mockUser = {
          email: credentials.email,
          first_name: credentials.email.split('@')[0],
          role: 'admin'
        }
        localStorage.setItem('robbie_token', 'dev_token')
        localStorage.setItem('robbie_user', JSON.stringify(mockUser))
        setUser(mockUser)
        setAppState('app')
      } else {
        throw err
      }
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('robbie_token')
    localStorage.removeItem('robbie_user')
    setUser(null)
    setAppState('welcome')
  }

  return (
    <BrowserRouter basename="/code">
      <Routes>
        {/* RobbieBar as Default */}
        <Route path="/" element={<RobbieBarTest />} />
        <Route path="/robbiebar-test" element={<RobbieBarTest />} />
        <Route path="/robbiebar" element={<RobbieBarPublic />} />
        
        {/* Main App Routes */}
        <Route path="/app/*" element={
          <>
            {appState === 'welcome' && (
              <MatrixWelcome onComplete={handleWelcomeComplete} />
            )}
            {appState === 'login' && (
              <RobbieAuth onLogin={handleLogin} />
            )}
            {appState === 'app' && user && (
              <MainApp user={user} onLogout={handleLogout} />
            )}
          </>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App