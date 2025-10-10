import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Target, Users, MessageCircle } from 'lucide-react'

export default function Navbar() {
  const location = useLocation()

  const links = [
    { path: '/', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { path: '/pipeline', label: 'Pipeline', icon: <Target className="w-4 h-4" /> },
    { path: '/contacts', label: 'Contacts', icon: <Users className="w-4 h-4" /> },
    { path: '/chat', label: 'Chat', icon: <MessageCircle className="w-4 h-4" /> },
  ]

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-testpilot-orange rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <span className="text-xl font-bold text-testpilot-dark">TestPilot CPG</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-1">
            {links.map((link) => {
              const isActive = location.pathname === link.path
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-testpilot-orange text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {link.icon}
                  <span className="font-medium">{link.label}</span>
                </Link>
              )
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-testpilot-dark">Allan Peretz</p>
              <p className="text-xs text-gray-500">CEO, TestPilot CPG</p>
            </div>
            <div className="w-10 h-10 bg-testpilot-blue rounded-full flex items-center justify-center">
              <span className="text-white font-bold">AP</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

