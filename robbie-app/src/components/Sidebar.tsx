import { motion } from 'framer-motion'
import { useRobbieStore } from '../stores/robbieStore'

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

const Sidebar = ({ activeTab, onTabChange, robbieExpression, onExpressionChange, user }: SidebarProps) => {
  const { currentExpression, cycleExpression: storeyCycleExpression, updateContext, flirtMode } = useRobbieStore()
  
  // Use store expression instead of prop
  const displayExpression = currentExpression || robbieExpression

  const cycleExpression = () => {
    storeCycleExpression()
    onExpressionChange(currentExpression)
  }
  
  const handleTabChange = (tabId: string) => {
    onTabChange(tabId)
    updateContext({ tab: tabId })
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
            {Array(20).fill('01').map((c, j) => (
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
              src={`/avatars/robbie-${displayExpression}.png`}
              alt="Robbie"
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text y="70" font-size="60">🤖</text></svg>' }}
            />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-white">Robbie</div>
            <div className="text-xs text-robbie-cyan">
              {flirtMode >= 7 ? 'Always here for you 💜😘' : 'Always here for you 💜'}
            </div>
          </div>
          <div className="w-3 h-3 bg-robbie-green rounded-full animate-pulse" title="Online" />
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

      {/* Footer - User Info */}
      <div className="p-4 border-t border-robbie-cyan/20 relative z-10">
        <div className="text-xs text-gray-400">
          <div className="font-medium text-white mb-1">{user.email}</div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-robbie-green rounded-full" />
            <span>Online</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
