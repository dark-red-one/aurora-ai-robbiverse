import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Pipeline from './pages/Pipeline'
import Contacts from './pages/Contacts'
import Chat from './pages/Chat'
import Navbar from './components/Navbar'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-testpilot-light">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/pipeline" element={<Pipeline />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/chat" element={<Chat />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App

