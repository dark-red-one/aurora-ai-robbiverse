import { useRobbieStore } from "../../stores/robbieStore"

interface MoneyDashboardProps {
  user: any
}

const MoneyDashboard = ({ user }: MoneyDashboardProps) => {
  const { triggerMoodEvent } = useMoodSync()
  const { updateContext } = useRobbieStore()
  
  useEffect(() => {
    // Trigger hyper mood when viewing money!
    updateContext({ tab: 'money' })
    triggerMoodEvent('revenue_milestone')
  }, [updateContext, triggerMoodEvent])
  const metrics = [
    { label: 'MRR', value: '$12,740', change: '+$12.7K', trend: 'up', icon: '💰' },
    { label: 'Pipeline', value: '67 deals', change: '+12 this week', trend: 'up', icon: '📊' },
    { label: 'Close Rate', value: '23%', change: '+5%', trend: 'up', icon: '🎯' },
    { label: 'Avg Deal', value: '$8,500', change: '+$2.1K', trend: 'up', icon: '💼' },
  ]

  const recentDeals = [
    { company: 'Simply Good Foods', value: '$12,740', status: 'Closed', date: 'Oct 2025' },
    { company: 'Quest Nutrition', value: '$18,000', status: 'Negotiation', date: 'In progress' },
    { company: 'Cholula Hot Sauce', value: '$9,500', status: 'Proposal', date: 'This week' },
  ]

  return (
    <div className="h-full flex flex-col bg-robbie-bg-primary p-6 overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Money Dashboard 💰</h2>
        <p className="text-gray-400">Every deal closed funds Robbie's development!</p>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-robbie-bg-card border border-robbie-cyan/20 rounded-lg p-5 hover:border-robbie-cyan/50 transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{metric.icon}</span>
              <span className={`text-xs ${metric.trend === 'up' ? 'text-robbie-green' : 'text-robbie-red'}`}>
                {metric.change}
              </span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{metric.value}</div>
            <div className="text-sm text-gray-400">{metric.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Recent Deals */}
      <div className="bg-robbie-bg-card border border-robbie-cyan/20 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Recent Deals 🚀</h3>
        <div className="space-y-3">
          {recentDeals.map((deal, index) => (
            <motion.div
              key={deal.company}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-4 bg-robbie-bg-secondary rounded-lg border border-robbie-cyan/10 hover:border-robbie-cyan/30 transition-all"
            >
              <div>
                <div className="font-semibold text-white">{deal.company}</div>
                <div className="text-sm text-gray-400">{deal.date}</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-robbie-cyan text-lg">{deal.value}</div>
                <div className={`text-xs px-2 py-1 rounded ${
                  deal.status === 'Closed' 
                    ? 'bg-robbie-green/20 text-robbie-green' 
                    : 'bg-robbie-orange/20 text-robbie-orange'
                }`}>
                  {deal.status}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <button className="bg-gradient-to-r from-robbie-cyan to-robbie-teal text-black font-semibold py-3 rounded-lg hover:shadow-lg hover:shadow-robbie-cyan/50 transition-all">
          View Full Pipeline
        </button>
        <button className="bg-robbie-bg-card border border-robbie-cyan/30 text-white font-semibold py-3 rounded-lg hover:border-robbie-cyan transition-all">
          Add New Deal
        </button>
      </div>
    </div>
  )
}

export default MoneyDashboard
