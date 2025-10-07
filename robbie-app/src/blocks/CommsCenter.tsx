import { motion } from 'framer-motion'

interface CommsCenterProps {
  user: any
}

const CommsCenter = ({ user }: CommsCenterProps) => {
  const emails = [
    { from: 'Jennifer @ Simply Good', subject: 'Re: Q4 Shopper Intelligence', preview: 'Thanks Allan! Ready to move forward with...', unread: true, timestamp: '2 hours ago' },
    { from: 'Michael @ Quest', subject: 'TestPilot Demo Follow-up', preview: 'Great meeting yesterday. Team wants to...', unread: true, timestamp: '5 hours ago' },
    { from: 'Sarah @ PepsiCo', subject: 'Innovation Partnership', preview: 'Interested in exploring how TestPilot could...', unread: false, timestamp: 'Yesterday' },
  ]

  return (
    <div className="h-full flex flex-col bg-robbie-bg-primary p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Comms Center 📧</h2>
        <p className="text-gray-400">All your communication, unified</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-robbie-bg-card border border-robbie-cyan/20 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-robbie-cyan">12</div>
          <div className="text-sm text-gray-400">Unread</div>
        </div>
        <div className="bg-robbie-bg-card border border-robbie-cyan/20 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-robbie-orange">5</div>
          <div className="text-sm text-gray-400">Urgent</div>
        </div>
        <div className="bg-robbie-bg-card border border-robbie-cyan/20 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-robbie-green">23</div>
          <div className="text-sm text-gray-400">Today</div>
        </div>
      </div>

      {/* Email List */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {emails.map((email, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-robbie-bg-card border rounded-lg p-4 cursor-pointer hover:border-robbie-cyan/50 transition-all ${
              email.unread ? 'border-robbie-cyan/30' : 'border-robbie-cyan/10'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                {email.unread && <div className="w-2 h-2 bg-robbie-cyan rounded-full" />}
                <div className="font-semibold text-white">{email.from}</div>
              </div>
              <div className="text-xs text-gray-500">{email.timestamp}</div>
            </div>
            <div className="font-medium text-gray-300 mb-1">{email.subject}</div>
            <div className="text-sm text-gray-400">{email.preview}</div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 flex gap-4">
        <button className="flex-1 bg-gradient-to-r from-robbie-cyan to-robbie-teal text-black font-semibold py-3 rounded-lg hover:shadow-lg hover:shadow-robbie-cyan/50 transition-all">
          Compose
        </button>
        <button className="px-6 bg-robbie-bg-card border border-robbie-cyan/30 text-white font-semibold rounded-lg hover:border-robbie-cyan transition-all">
          Refresh
        </button>
      </div>
    </div>
  )
}

export default CommsCenter
