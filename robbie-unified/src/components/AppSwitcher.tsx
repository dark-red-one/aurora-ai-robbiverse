import { motion } from 'framer-motion'

const AppSwitcher = () => {
  const apps = [
    { name: 'Work', path: '/work/', icon: '💼', color: 'robbie-orange' },
    { name: 'Code', path: '/code/', icon: '💻', color: 'robbie-cyan' },
    { name: 'Play', path: '/play/', icon: '🎰', color: 'robbie-pink' }
  ]

  const currentPath = window.location.pathname
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
    >
      <div className="flex gap-2 bg-robbie-bg-card/90 backdrop-blur-sm border border-robbie-cyan/30 rounded-lg p-2">
        {apps.map((app) => {
          const isActive = currentPath.includes(app.path)
          return (
            <a
              key={app.name}
              href={`https://aurora.testpilot.ai${app.path}`}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                isActive
                  ? `bg-${app.color} text-white`
                  : `text-gray-400 hover:text-white hover:bg-robbie-bg-secondary`
              }`}
            >
              {app.icon} Robbie@{app.name}
            </a>
          )
        })}
      </div>
    </motion.div>
  )
}

export default AppSwitcher











