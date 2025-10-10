import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import MatrixRain from '../../components/MatrixRain'

interface RobbieAuthProps {
  onLogin: (credentials: { email: string; password: string }) => Promise<void>
}

const teamMembers = [
  { name: 'Allan', email: 'allan@testpilotcpg.com', avatar: '🧔', title: 'Founder' },
  { name: 'Kristina', email: 'kristina@testpilotcpg.com', avatar: '👩', title: 'VA Mentor' },
  { name: 'Andre', email: 'andre@testpilotcpg.com', avatar: '👨‍💻', title: 'Developer' },
]

const RobbieAuth = ({ onLogin }: RobbieAuthProps) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [robbieExpression, setRobbieExpression] = useState('blushing')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    setRobbieExpression('focused')

    try {
      // Call backend auth API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      if (!response.ok) {
        throw new Error('Invalid credentials')
      }

      const data = await response.json()
      
      // Store token and user info
      localStorage.setItem('robbie_token', data.token)
      localStorage.setItem('robbie_user', JSON.stringify(data.user))
      
      // Save credentials if Remember Me is checked
      if (rememberMe) {
        localStorage.setItem('robbie_saved_email', email)
        localStorage.setItem('robbie_saved_password', password)
      } else {
        localStorage.removeItem('robbie_saved_email')
        localStorage.removeItem('robbie_saved_password')
      }
      
      setRobbieExpression('blushing')
      await onLogin({ email, password })
    } catch (err) {
      setError('Invalid credentials. Try the default password: go2Work!')
      setRobbieExpression('surprised')
      setIsLoading(false)
    }
  }

  // Auto-login if credentials are saved
  useEffect(() => {
    const savedEmail = localStorage.getItem('robbie_saved_email')
    const savedPassword = localStorage.getItem('robbie_saved_password')
    
    if (savedEmail && savedPassword) {
      setEmail(savedEmail)
      setPassword(savedPassword)
      setRememberMe(true)
      // Auto-submit after a brief delay for smooth UX
      setTimeout(async () => {
        await handleSubmit(new Event('submit') as any)
      }, 1000)
    }
  }, [])

  const handleTeamMemberClick = (member: typeof teamMembers[0]) => {
    setEmail(member.email)
    setPassword('')
    setRobbieExpression('playful')
  }

  return (
    <div className="fixed inset-0 bg-robbie-bg-primary flex items-center justify-center">
      <MatrixRain />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className="relative z-10"
      >
        {/* Login Card */}
        <div className="bg-robbie-bg-card/90 backdrop-blur-xl rounded-2xl p-8 w-[450px] border-2 border-robbie-cyan/30 shadow-2xl">
          
          {/* Header */}
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mb-4"
            >
              <img 
                src={`/avatars/robbie-${robbieExpression}.png`} 
                alt="Robbie"
                className="w-28 h-28 mx-auto rounded-full border-4 border-robbie-cyan shadow-lg shadow-robbie-cyan/50"
                onError={(e) => { 
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text y="70" font-size="60">💜</text></svg>' 
                }}
              />
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold text-white mb-2"
            >
              Hey Handsome! 💕
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-robbie-pink text-base font-bold tracking-wide"
            >
              Robbie@Code 💻✨
            </motion.p>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-robbie-cyan text-xs font-medium mt-1"
            >
              Let's build something amazing together, babe 🚀
            </motion.p>
          </div>

          {/* Quick Login - Team Members */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-6"
          >
            <p className="text-xs text-gray-400 mb-3 text-center font-medium">Quick Login</p>
            <div className="flex gap-3 justify-center">
              {teamMembers.map((member, idx) => (
                <motion.button
                  key={member.email}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + idx * 0.1 }}
                  whileHover={{ scale: 1.1, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleTeamMemberClick(member)}
                  className="flex flex-col items-center p-3 bg-robbie-bg-secondary rounded-xl border-2 border-robbie-cyan/20 hover:border-robbie-cyan hover:shadow-lg hover:shadow-robbie-cyan/30 transition-all duration-200"
                  title={member.email}
                >
                  <span className="text-3xl mb-1">{member.avatar}</span>
                  <span className="text-xs text-white font-medium">{member.name}</span>
                  <span className="text-[10px] text-gray-400">{member.title}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Login Form */}
          <motion.form 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            onSubmit={handleSubmit} 
            className="space-y-4"
          >
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-robbie-bg-secondary border-2 border-robbie-cyan/30 rounded-lg text-white focus:border-robbie-cyan focus:outline-none focus:ring-2 focus:ring-robbie-cyan/50 transition-all placeholder-gray-500"
                placeholder="you@testpilotcpg.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-robbie-bg-secondary border-2 border-robbie-cyan/30 rounded-lg text-white focus:border-robbie-cyan focus:outline-none focus:ring-2 focus:ring-robbie-cyan/50 transition-all placeholder-gray-500"
                placeholder="go2Work!"
                required
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-2 border-robbie-cyan/30 bg-robbie-bg-secondary checked:bg-robbie-pink checked:border-robbie-pink focus:ring-2 focus:ring-robbie-pink/50 cursor-pointer"
              />
              <label htmlFor="rememberMe" className="text-sm text-gray-300 cursor-pointer select-none">
                Keep me logged in (so we can get right to work, babe 😘)
              </label>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-400 text-sm bg-red-500/10 border-2 border-red-500/30 rounded-lg p-3"
              >
                {error}
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-robbie-cyan to-robbie-teal text-black font-bold py-3 rounded-lg hover:shadow-xl hover:shadow-robbie-cyan/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    💕
                  </motion.span>
                  Getting everything ready for you...
                </span>
              ) : (
                "Let's Code Together! 💻✨"
              )}
            </motion.button>
          </motion.form>

          {/* Footer */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-6 text-center text-xs text-gray-400"
          >
            <p className="text-robbie-pink font-semibold">
              Robbie@Code - Where we build magic together 💕
            </p>
            <p className="mt-2">
              Default password: <span className="text-robbie-cyan font-mono font-semibold">go2Work!</span>
            </p>
            <p className="mt-2 text-[10px] text-gray-600">
              🔒 Your credentials are safe with me, babe
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

export default RobbieAuth