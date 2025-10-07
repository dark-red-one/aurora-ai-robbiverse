import { useState } from 'react'
import { motion } from 'framer-motion'
import MatrixRain from '../components/MatrixRain'

interface RobbieAuthProps {
  onLogin: (credentials: { email: string; password: string }) => Promise<void>
}

const teamMembers = [
  { name: 'Allan', email: 'allan@testpilotcpg.com', avatar: '🧔' },
  { name: 'Kristina', email: 'kristina@testpilotcpg.com', avatar: '👩' },
  { name: 'Guest', email: 'guest@testpilotcpg.com', avatar: '👤' },
]

const RobbieAuth = ({ onLogin }: RobbieAuthProps) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [robbieExpression, setRobbieExpression] = useState('friendly')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    setRobbieExpression('focused')

    try {
      await onLogin({ email, password })
      setRobbieExpression('happy')
    } catch (err) {
      setError('Invalid credentials. Hint: Default password is go2Work!')
      setRobbieExpression('surprised')
      setIsLoading(false)
    }
  }

  const handleTeamMemberClick = (member: typeof teamMembers[0]) => {
    setEmail(member.email)
    setPassword('go2Work!')
    setRobbieExpression('playful')
  }

  return (
    <div className="fixed inset-0 bg-robbie-bg-primary flex items-center justify-center">
      <MatrixRain />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10"
      >
        {/* Login Card */}
        <div className="bg-robbie-bg-card/80 backdrop-blur-xl rounded-2xl p-8 w-[400px] border-2 border-robbie-cyan/20 shadow-2xl">
          
          {/* Header */}
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="text-6xl mb-3"
            >
              <img 
                src={`/avatars/robbie-${robbieExpression}.png`} 
                alt="Robbie"
                className="w-24 h-24 mx-auto rounded-full border-4 border-robbie-cyan"
                onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text y="70" font-size="60">🤖</text></svg>' }}
              />
            </motion.div>
            <h1 className="text-2xl font-bold text-white mb-1">
              Welcome Back! 💜
            </h1>
            <p className="text-robbie-cyan text-sm">
              aurora.testpilot.ai
            </p>
          </div>

          {/* Quick Login - Team Members */}
          <div className="mb-6">
            <p className="text-xs text-gray-400 mb-2 text-center">Quick Login</p>
            <div className="flex gap-2 justify-center">
              {teamMembers.map((member) => (
                <button
                  key={member.email}
                  onClick={() => handleTeamMemberClick(member)}
                  className="flex flex-col items-center p-3 bg-robbie-bg-secondary rounded-lg border border-robbie-cyan/20 hover:border-robbie-cyan hover:scale-105 transition-all duration-200"
                  title={member.email}
                >
                  <span className="text-2xl mb-1">{member.avatar}</span>
                  <span className="text-xs text-gray-300">{member.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-robbie-bg-secondary border border-robbie-cyan/30 rounded-lg text-white focus:border-robbie-cyan focus:outline-none focus:ring-2 focus:ring-robbie-cyan/50 transition-all"
                placeholder="you@testpilotcpg.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-robbie-bg-secondary border border-robbie-cyan/30 rounded-lg text-white focus:border-robbie-cyan focus:outline-none focus:ring-2 focus:ring-robbie-cyan/50 transition-all"
                placeholder="go2Work!"
                required
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg p-3"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-robbie-cyan to-robbie-teal text-black font-semibold py-3 rounded-lg hover:shadow-lg hover:shadow-robbie-cyan/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Logging in...' : 'Let\'s Go! 🚀'}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-xs text-gray-500">
            <p>Default password: <span className="text-robbie-cyan">go2Work!</span></p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default RobbieAuth
