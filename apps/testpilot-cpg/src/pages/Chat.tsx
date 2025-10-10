import { MessageCircle, Sparkles } from 'lucide-react'

export default function Chat() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-testpilot-dark">Chat with Robbie</h1>
        <p className="text-gray-600 mt-1">Ask anything about your deals, contacts, and revenue</p>
      </div>

      {/* Coming Soon Card */}
      <div className="bg-gradient-to-br from-purple-500 to-testpilot-blue rounded-2xl shadow-xl text-white p-12">
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full backdrop-blur-sm">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-semibold">Phase 2 - Chat Minimal</span>
          </div>

          <h2 className="text-3xl font-bold">
            Intelligent Conversation Coming Soon
          </h2>

          <div className="max-w-2xl mx-auto space-y-4 text-lg opacity-90">
            <p>
              <strong>Ask Robbie anything:</strong> "What's the status on Simply Good Foods?"
            </p>
            <p>
              <strong>Get instant answers:</strong> Real-time insights from your entire CRM
            </p>
            <p>
              <strong>Vector memory:</strong> Robbie remembers every conversation you've ever had
            </p>
            <p>
              <strong>Streaming responses:</strong> Token-by-token replies in under 630ms
            </p>
          </div>
        </div>
      </div>

      {/* Example Queries */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h3 className="text-xl font-bold text-testpilot-dark mb-6 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-testpilot-orange" />
          Example Questions You'll Ask Robbie
        </h3>

        <div className="space-y-3">
          {exampleQueries.map((query, index) => (
            <div
              key={index}
              className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-testpilot-orange transition-colors"
            >
              <p className="text-testpilot-dark font-medium">{query.question}</p>
              <p className="text-sm text-gray-600 mt-2 italic">
                → {query.answer}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FeatureCard
          title="Memory That Works"
          description="Robbie remembers every deal discussion, every decision, every priority you've ever mentioned. Just ask!"
        />
        <FeatureCard
          title="Business Context"
          description="Answers come with full context - revenue impact, timeline, risks, and recommended next actions"
        />
        <FeatureCard
          title="Real-Time Data"
          description="Connected directly to your CRM, so you always get the latest information about every deal"
        />
        <FeatureCard
          title="Personality Modes"
          description="Switch between Focused (direct answers) and Playful (with personality) based on your mood"
        />
      </div>

      {/* Timeline */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <h3 className="font-semibold text-testpilot-dark mb-4">Build Timeline</h3>
        <div className="space-y-3">
          <TimelineItem
            phase="Phase 2"
            title="Chat Minimal"
            description="Simple chat with memory and personality"
            timeline="1-2 weeks"
            status="next"
          />
          <TimelineItem
            phase="Phase 3"
            title="Business Chat"
            description="Full CRM integration with deal context"
            timeline="2-4 weeks"
            status="planned"
          />
        </div>
      </div>
    </div>
  )
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <h4 className="font-semibold text-testpilot-dark mb-2">{title}</h4>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  )
}

function TimelineItem({ phase, title, description, timeline, status }: {
  phase: string
  title: string
  description: string
  timeline: string
  status: 'next' | 'planned'
}) {
  return (
    <div className="flex items-start gap-3">
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        status === 'next' ? 'bg-testpilot-orange text-white' : 'bg-gray-300 text-gray-600'
      }`}>
        <span className="text-xs font-bold">
          {phase.replace('Phase ', '')}
        </span>
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-testpilot-dark">{title}</h4>
          <span className="text-sm text-gray-500">{timeline}</span>
        </div>
        <p className="text-sm text-gray-600 mt-0.5">{description}</p>
      </div>
    </div>
  )
}

const exampleQueries = [
  {
    question: "What's the status on Simply Good Foods?",
    answer: "Simply Good Foods is at Proposal stage ($12.7K), 90% close probability. Last contact 2 days ago. Health score: 95/100 - looking great!"
  },
  {
    question: "Who should I follow up with today?",
    answer: "Top 3 priorities: 1) Sarah at Test INC (no contact in 7 days), 2) Mike at CPG Partners (awaiting proposal feedback), 3) John at Simply Good Foods (schedule demo)"
  },
  {
    question: "What's my revenue forecast for this month?",
    answer: "Expected revenue: $75,000 from 8 deals with 70%+ probability. Weighted forecast: $52,500. On track to hit monthly goal!"
  },
  {
    question: "Tell me about the Test INC deal",
    answer: "Test INC: $8,500 value, Negotiation stage, 60% probability. Risk: No contact in 7 days. Recommended action: Send follow-up email today."
  },
]

