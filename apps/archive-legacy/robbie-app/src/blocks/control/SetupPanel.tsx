import { motion } from 'framer-motion'
import { useRobbieStore } from '../../stores/robbieStore'
import { AdvancedControls } from '../personality/AdvancedControls'

interface SetupPanelProps {
  user: any
  onLogout: () => void
}

const SetupPanel = ({ user, onLogout }: SetupPanelProps) => {
  const { attraction, gandhiGenghis, setAttraction, setGandhiGenghis } = useRobbieStore()
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
              <label className="text-sm text-gray-400">Attraction</label>
              <span className="text-robbie-pink font-semibold">{attraction}/11 {attraction >= 11 ? '💋🔥' : attraction >= 9 ? '😘💜' : attraction >= 7 ? '😘' : attraction >= 5 ? '💜' : '🙂'}</span>
            </div>
            <input
              type="range"
              min="1"
              max="11"
              value={attraction}
              onChange={(e) => setAttraction(Number(e.target.value), user.email === 'allan@testpilotcpg.com')}
              className="w-full accent-robbie-pink"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Professional</span>
              <span>Flirty AF</span>
            </div>
            <div className="mt-2 text-xs text-gray-400 italic">
              {attraction >= 11 && "💋🔥 FLIRTY AS FUCK! Maximum attraction, playful teasing"}
              {attraction >= 9 && attraction < 11 && "😘💜 Very flirty! Heavy flirting, lots of emojis"}
              {attraction >= 7 && attraction < 9 && "😘 Friendly flirty - warm, supportive, occasional flirt"}
              {attraction >= 5 && attraction < 7 && "💪 Enthusiastic & positive"}
              {attraction < 5 && "🤝 Professional with warmth"}
            </div>
            {user.email !== 'allan@testpilotcpg.com' && attraction > 7 && (
              <div className="mt-2 text-xs text-yellow-400">
                ⚠️ Only Allan can set attraction above 7
              </div>
            )}
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm text-gray-400">Gandhi-Genghis</label>
              <span className="text-robbie-orange font-semibold">{gandhiGenghis} {gandhiGenghis >= 7 ? '⚔️' : gandhiGenghis >= 5 ? '🎯' : '☮️'}</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={gandhiGenghis}
              onChange={(e) => setGandhiGenghis(Number(e.target.value))}
              className="w-full accent-robbie-orange"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Gentle</span>
              <span>Aggressive</span>
            </div>
            <div className="mt-2 text-xs text-gray-400 italic">
              {gandhiGenghis >= 8 && "⚔️ Full Genghis! Push hard, close NOW"}
              {gandhiGenghis >= 5 && gandhiGenghis < 8 && "🎯 Assertive - direct & confident"}
              {gandhiGenghis < 5 && "☮️ Diplomatic - patient & relationship-focused"}
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

      {/* Robbie V3 Advanced Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-6"
      >
        <AdvancedControls />
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
