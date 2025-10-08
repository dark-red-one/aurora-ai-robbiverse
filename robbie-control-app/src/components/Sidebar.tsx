import { motion } from 'framer-motion'
import { useRobbieStore } from '../stores/robbieStore'
import { useState, useEffect } from 'react'

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: any) => void
  robbieExpression: string
  onExpressionChange: (expression: string) => void
  user: any
}

const navItems = [
  { id: 'chat', icon: '💬', label: 'Chat', badge: 3 },
  { id: 'notes', icon: '📝', label: 'Notes' },
  { id: 'tasks', icon: '✅', label: 'Tasks', badge: 5 },
  { id: 'comms', icon: '📧', label: 'Comms', badge: 12 },
  { id: 'money', icon: '💰', label: 'Money' },
  { id: 'setup', icon: '⚙️', label: 'Setup' },
]

const Sidebar = ({ activeTab, onTabChange, robbieExpression: _robbieExpression, onExpressionChange, user: _user }: SidebarProps) => {
  const { currentMood, cycleMood } = useRobbieStore()
  
  // Use current mood from store
  const displayMood = currentMood
  
  const [isMuted, setIsMuted] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  const cycleExpression = () => {
    cycleMood()
    onExpressionChange(currentMood)
  }
  
  const handleTabChange = (tabId: string) => {
    onTabChange(tabId)
    // No auto mood switching - mood persists!
  }

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Format time in 24hr format
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="w-[260px] bg-robbie-bg-secondary border-r-2 border-robbie-cyan flex flex-col flex-shrink-0 relative overflow-hidden">
      
      {/* Sidebar Matrix Effect */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-robbie-teal font-mono text-xs"
            style={{ left: `${i * 10}%` }}
            animate={{
              y: ['0%', '100%'],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            {Array(20).fill('01').map((_, j) => (
              <div key={j}>{Math.random() > 0.5 ? '1' : '0'}</div>
            ))}
          </motion.div>
        ))}
      </div>

      {/* Header with Robbie Avatar */}
      <div className="p-4 border-b border-robbie-cyan/20 relative z-10">
        <motion.div
          className="flex items-center gap-3 cursor-pointer"
          whileHover={{ scale: 1.02 }}
          onClick={cycleExpression}
        >
          <div className="w-12 h-12 rounded-full border-2 border-robbie-cyan overflow-hidden">
            <img
              src={`/avatars/robbie-${displayMood}.png`}
              alt="Robbie"
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text y="70" font-size="60">🤖</text></svg>' }}
            />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-white">Robbie</div>
            <div className="text-xs text-robbie-pink capitalize">
              {displayMood} {displayMood === 'blushing' ? '💕😊' : displayMood === 'playful' ? '😘' : displayMood === 'bossy' ? '💪' : displayMood === 'surprised' ? '😲' : displayMood === 'focused' ? '🎯' : '😊'}
            </div>
          </div>
          <div className="w-3 h-3 bg-robbie-pink rounded-full animate-pulse" title="Blushing" />
        </motion.div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 relative z-10">
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-semibold">Main</div>
        {navItems.map((item) => (
          <motion.button
            key={item.id}
            onClick={() => handleTabChange(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              activeTab === item.id
                ? 'bg-robbie-cyan/20 border-l-4 border-robbie-cyan text-white'
                : 'hover:bg-robbie-cyan/10 text-gray-300'
            }`}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
            {item.badge && (
              <span className="ml-auto bg-robbie-pink text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
          </motion.button>
        ))}
      </nav>

      {/* CNN Livestream */}
      <div className="border-t border-robbie-cyan/20 relative z-10 bg-black">
        <div className="relative">
          <iframe
            src="https://www.youtube.com/embed/XOacA3RYrXk?autoplay=1&mute=1&cc_load_policy=1&cc_lang_pref=en"
            className="w-full h-[180px]"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="CNN Live"
          />
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="absolute bottom-2 right-2 bg-black/70 hover:bg-black/90 text-white px-3 py-1 rounded text-xs font-medium transition-all"
          >
            {isMuted ? '🔇 Unmute' : '🔊 Mute'}
          </button>
        </div>
        <div className="px-2 py-1 bg-robbie-cyan/10 text-center">
          <div className="text-[10px] text-gray-400">CNN Live • Subtitles On</div>
        </div>
      </div>

      {/* Footer - Time & Date */}
      <div className="p-4 border-t border-robbie-cyan/20 relative z-10 bg-robbie-bg-secondary">
        <div className="text-center space-y-1">
          <div className="text-2xl font-bold text-robbie-cyan font-mono">
            {formatTime(currentTime)}
          </div>
          <div className="text-xs text-gray-400">
            {formatDate(currentTime)}
          </div>
          <div className="text-[10px] text-gray-500 mt-2">
            Central Time (CT)
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
