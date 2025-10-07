import { motion } from 'framer-motion'

interface SetupPanelProps {
  user: any
  onLogout: () => void
}

const SetupPanel = ({ user, onLogout }: SetupPanelProps) => {
  return (
    <div className="h-full flex flex-col bg-robbie-bg-primary p-6 overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Setup & Settings ⚙️</h2>
        <p className="text-gray-400">Configure your Robbie experience</p>
      </div>

      {/* Profile Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-robbie-bg-card border border-robbie-cyan/20 rounded-lg p-6 mb-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Profile</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full bg-robbie-bg-secondary border border-robbie-cyan/20 rounded px-3 py-2 text-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Display Name</label>
            <input
              type="text"
              defaultValue="Allan"
              className="w-full bg-robbie-bg-secondary border border-robbie-cyan/30 rounded px-3 py-2 text-white focus:border-robbie-cyan focus:outline-none"
            />
          </div>
        </div>
      </motion.div>

      {/* Robbie Personality */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-robbie-bg-card border border-robbie-cyan/20 rounded-lg p-6 mb-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Robbie's Personality 💜</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm text-gray-400">Flirt Mode</label>
              <span className="text-robbie-pink font-semibold">7 😘</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              defaultValue="7"
              className="w-full accent-robbie-pink"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Professional</span>
              <span>Very Flirty</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm text-gray-400">Gandhi-Genghis</label>
              <span className="text-robbie-orange font-semibold">5</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              defaultValue="5"
              className="w-full accent-robbie-orange"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Gentle</span>
              <span>Aggressive</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Integrations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-robbie-bg-card border border-robbie-cyan/20 rounded-lg p-6 mb-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Integrations</h3>
        <div className="space-y-3">
          {[
            { name: 'Gmail', status: 'connected', icon: '✉️' },
            { name: 'HubSpot', status: 'connected', icon: '📊' },
            { name: 'Slack', status: 'not connected', icon: '💬' },
            { name: 'Calendly', status: 'connected', icon: '📅' },
          ].map((integration) => (
            <div
              key={integration.name}
              className="flex items-center justify-between p-3 bg-robbie-bg-secondary rounded border border-robbie-cyan/10"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{integration.icon}</span>
                <span className="text-white">{integration.name}</span>
              </div>
              <span className={`text-xs px-2 py-1 rounded ${
                integration.status === 'connected'
                  ? 'bg-robbie-green/20 text-robbie-green'
                  : 'bg-gray-600/20 text-gray-400'
              }`}>
                {integration.status}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Logout */}
      <button
        onClick={onLogout}
        className="w-full bg-red-500/20 border border-red-500/30 text-red-400 font-semibold py-3 rounded-lg hover:bg-red-500/30 transition-all"
      >
        Logout
      </button>
    </div>
  )
}

export default SetupPanel
