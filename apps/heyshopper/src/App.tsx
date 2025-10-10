import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Results from './pages/Results'
import About from './pages/About'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/results" element={<Results />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

