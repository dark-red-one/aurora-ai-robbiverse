import { Sparkles } from 'lucide-react'

export default function Pipeline() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-testpilot-dark">Sales Pipeline</h1>
        <p className="text-gray-600 mt-1">Track every deal with AI-powered health scores and next actions</p>
      </div>

      {/* Coming Soon Hero */}
      <div className="relative overflow-hidden bg-white rounded-2xl shadow-lg border border-gray-200">
        <div className="absolute inset-0 bg-gradient-to-br from-testpilot-orange/5 to-testpilot-blue/5"></div>
        <div className="relative p-12 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-testpilot-orange/10 text-testpilot-orange rounded-full">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-semibold">Coming in Phase 3</span>
          </div>
          
          <h2 className="text-3xl font-bold text-testpilot-dark">
            AI-Powered Pipeline Management
          </h2>
          
          <div className="max-w-2xl mx-auto space-y-4 text-left">
            <Feature
              title="Visual Pipeline Board"
              description="Drag-and-drop deals through stages: Lead → Qualified → Proposal → Negotiation → Closed"
            />
            <Feature
              title="Health Score (0-100)"
              description="AI analyzes last contact date, response time, engagement level, and timeline to predict deal health"
            />
            <Feature
              title="Smart Next Actions"
              description="Robbie tells you exactly what to do next: 'Send follow-up email' or 'Schedule demo call'"
            />
            <Feature
              title="Risk Alerts"
              description="Get notified when deals go cold: 'No contact in 7 days - risk level rising'"
            />
            <Feature
              title="Revenue Forecasting"
              description="See probability-weighted forecast: 'Expected revenue this quarter: $75,000'"
            />
          </div>

          <div className="pt-4">
            <div className="inline-block px-6 py-3 bg-testpilot-orange text-white rounded-lg font-semibold shadow-lg">
              Building this in 2-4 weeks
            </div>
          </div>
        </div>
      </div>

      {/* Mock Pipeline Preview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {['Lead (8)', 'Qualified (12)', 'Proposal (7)', 'Closed (6)'].map((stage) => (
          <div key={stage} className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300">
            <h3 className="font-semibold text-gray-700 mb-2">{stage}</h3>
            <div className="h-32 flex items-center justify-center text-sm text-gray-400">
              Pipeline board coming soon
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Feature({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex gap-3 p-4 bg-white rounded-lg border border-gray-200">
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-testpilot-orange/20 flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-testpilot-orange"></div>
      </div>
      <div>
        <h4 className="font-semibold text-testpilot-dark">{title}</h4>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>
    </div>
  )
}

