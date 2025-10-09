import { useState, useEffect } from 'react'
import PromptEditor from './pages/PromptEditor'
import './App.css'

function App() {
  return (
    <div className="app">
      <header className="presidential-header">
        <div className="header-content">
          <h1>🏛️ ROBBIE CONTROL CENTER</h1>
          <p className="subtitle">Presidential Command & Configuration</p>
          <div className="user-badge">👨‍💼 President Allan</div>
        </div>
      </header>
      
      <main className="control-main">
        <PromptEditor />
      </main>
      
      <footer className="control-footer">
        <span>Robbie Empire Control Center</span>
        <span>•</span>
        <span>Classified Access Only</span>
        <span>•</span>
        <span>v1.0.0</span>
      </footer>
    </div>
  )
}

export default App




