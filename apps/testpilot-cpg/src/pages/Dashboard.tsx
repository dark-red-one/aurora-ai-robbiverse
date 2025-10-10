import { DollarSign, TrendingUp, Target, Clock } from 'lucide-react'

export default function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-testpilot-dark">Revenue Dashboard</h1>
          <p className="text-gray-600 mt-1">Your real-time business intelligence powered by Robbie</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">Live Data</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Pipeline Value"
          value="$289,961"
          change="+12.5%"
          icon={<DollarSign className="w-6 h-6" />}
          trend="up"
        />
        <StatCard
          title="Active Deals"
          value="33"
          change="+3"
          icon={<Target className="w-6 h-6" />}
          trend="up"
        />
        <StatCard
          title="Close Rate"
          value="76%"
          change="+5%"
          icon={<TrendingUp className="w-6 h-6" />}
          trend="up"
        />
        <StatCard
          title="Avg. Close Time"
          value="18 days"
          change="-2 days"
          icon={<Clock className="w-6 h-6" />}
          trend="down"
        />
      </div>

      {/* Coming Soon Section */}
      <div className="bg-gradient-to-br from-testpilot-orange to-testpilot-blue p-12 rounded-2xl shadow-xl text-white">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-block px-4 py-2 bg-white/20 rounded-full backdrop-blur-sm">
            <span className="text-sm font-semibold">Phase 3 - Coming Soon</span>
          </div>
          <h2 className="text-4xl font-bold">Your Revenue Command Center</h2>
          <div className="space-y-4 text-lg opacity-90">
            <p>
              <strong>Real-time pipeline tracking</strong> with AI-powered health scores for every deal
            </p>
            <p>
              <strong>Smart outreach suggestions</strong> - Robbie tells you exactly who to contact and when
            </p>
            <p>
              <strong>Revenue forecasting</strong> with 95%+ accuracy based on historical patterns
            </p>
            <p>
              <strong>Meeting intelligence</strong> - Auto-extract action items and update CRM
            </p>
          </div>
          <div className="pt-6">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-white text-testpilot-orange rounded-lg font-semibold">
              <span>Building this RIGHT NOW</span>
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-testpilot-orange rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-testpilot-orange rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-testpilot-orange rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vision Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <VisionCard
          title="Daily Briefs"
          description="Morning, afternoon, and evening summaries of your pipeline - delivered automatically at 8 AM, 1 PM, and 5 PM"
          status="Phase 3"
        />
        <VisionCard
          title="Deal Risk Scoring"
          description="AI analyzes communication patterns, timeline, and engagement to predict which deals need attention"
          status="Phase 3"
        />
        <VisionCard
          title="Chat with Robbie"
          description="Ask 'What's the status on Simply Good Foods?' and get instant, intelligent answers about any deal"
          status="Phase 3"
        />
      </div>

      {/* Mock Data Note */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <strong>Mock Data:</strong> The numbers above are sample data from TestPilot's real pipeline. 
              Live data integration coming in Phase 3 (2-4 weeks).
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, change, icon, trend }: {
  title: string
  value: string
  change: string
  icon: React.ReactNode
  trend: 'up' | 'down'
}) {
  const isPositive = trend === 'up'
  
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-testpilot-dark mt-2">{value}</p>
        </div>
        <div className="p-3 bg-testpilot-orange/10 rounded-lg text-testpilot-orange">
          {icon}
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <span className={`text-sm font-semibold ${isPositive ? 'text-green-600' : 'text-blue-600'}`}>
          {change}
        </span>
        <span className="text-xs text-gray-500">vs last month</span>
      </div>
    </div>
  )
}

function VisionCard({ title, description, status }: {
  title: string
  description: string
  status: string
}) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-testpilot-orange transition-colors">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-testpilot-dark">{title}</h3>
        <span className="px-2 py-1 bg-testpilot-orange/10 text-testpilot-orange text-xs font-medium rounded">
          {status}
        </span>
      </div>
      <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
    </div>
  )
}

