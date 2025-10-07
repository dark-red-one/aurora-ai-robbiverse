import { useState, useEffect } from 'react'
import MatrixWelcome from './blocks/MatrixWelcome'
import RobbieAuth from './blocks/RobbieAuth'
import MainApp from './blocks/MainApp'

type AppState = 'welcome' | 'login' | 'app'

function App() {
  const [appState, setAppState] = useState<AppState>('welcome')
  const [user, setUser] = useState<any>(null)

  // Skip welcome if returning user
  useEffect(() => {
    const token = localStorage.getItem('robbie_token')
    if (token) {
      setAppState('app')
      setUser({ email: localStorage.getItem('robbie_email') })
    }
  }, [])

  const handleWelcomeComplete = () => {
    setAppState('login')
  }

  const handleLogin = async (credentials: { email: string; password: string }) => {
    // TODO: Call actual auth API
    // For now, simple validation
    if (credentials.password === 'go2Work!') {
      localStorage.setItem('robbie_token', 'temp_token')
      localStorage.setItem('robbie_email', credentials.email)
      setUser({ email: credentials.email })
      setAppState('app')
    } else {
      throw new Error('Invalid credentials')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('robbie_token')
    localStorage.removeItem('robbie_email')
    setUser(null)
    setAppState('login')
  }

  return (
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
  )
}

export default App
