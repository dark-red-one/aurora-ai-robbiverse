import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
/**
 * DailyBriefBlock - Shows daily brief with Top 3 outreach opportunities
 * Integrates with backend DailyBriefSystem.py
 */
import { useRobbieStore } from "../../stores/robbieStore"
import { useRobbieStore } from "../../stores/robbieStore"

interface OutreachOpportunity {
  contact_name: string
  company: string
  reason: string
  priority: number
  revenue_potential: number
  action: string
  context?: string
  last_interaction?: string
}

interface TaskSummary {
  total: number
  completed: number
  in_progress: number
  blocked: number
  high_priority: number
  completion_rate: number
}

interface DailyBrief {
  brief_type: 'morning' | 'afternoon' | 'evening'
  timestamp: string
  summary: string
  priorities: string[]
  outreach_opportunities: OutreachOpportunity[]
  task_summary: TaskSummary
  calendar_events: any[]
  wins: string[]
  blockers: string[]
  time_saved_minutes: number
  suggestions: string[]
}

interface DailyBriefBlockProps {
  briefType?: 'morning' | 'afternoon' | 'evening'
  compact?: boolean
  onAction?: (action: string, data: any) => void
}

export const DailyBriefBlock: React.FC<DailyBriefBlockProps> = ({
  briefType = 'morning',
  compact = false,
  onAction
}) => {
  const [brief, setBrief] = useState<DailyBrief | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchBrief()
    // Refresh every 5 minutes
    const interval = setInterval(fetchBrief, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [briefType])

  const fetchBrief = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/briefs/${briefType}`)
      if (response.ok) {
        const data = await response.json()
        setBrief(data)
        setError(null)
      } else {
        throw new Error('Failed to fetch brief')
      }
    } catch (err) {
      console.error('Error fetching brief:', err)
      setError('Unable to load brief')
      // Use mock data for demo
      setBrief(getMockBrief(briefType))
    } finally {
      setLoading(false)
    }
  }

  const getMockBrief = (type: string): DailyBrief => ({
    brief_type: type as any,
    timestamp: new Date().toISOString(),
    summary: 'Good morning! You have 2 events today and 3 high-priority tasks.',
    priorities: [
      'Close Quest Nutrition deal (potential $25k/year)',
      'Follow up with Cholula on pilot results',
      'Prepare Q4 revenue forecast'
    ],
    outreach_opportunities: [
      {
        contact_name: 'Sarah Chen',
        company: 'Quest Nutrition',
        reason: 'Silent for 5 days after positive demo',
        priority: 10,
        revenue_potential: 25000,
        action: 'Send pricing proposal + case study',
        context: 'Showed strong interest in real-time analytics'
      },
      {
        contact_name: 'Mike Rodriguez',
        company: 'Cholula Hot Sauce',
        reason: 'Pilot ending in 3 days, time to close',
        priority: 9,
        revenue_potential: 18000,
        action: 'Schedule expansion discussion',
        context: '94% satisfaction score on pilot'
      },
      {
        contact_name: 'Jennifer Park',
        company: 'Simply Good Foods',
        reason: 'Warm intro from Quest contact',
        priority: 8,
        revenue_potential: 30000,
        action: 'Send personalized intro video',
        context: 'Also works with Quest, perfect reference'
      }
    ],
    task_summary: {
      total: 12,
      completed: 5,
      in_progress: 4,
      blocked: 1,
      high_priority: 3,
      completion_rate: 42
    },
    calendar_events: [],
    wins: ['Closed $15k deal with Vital Proteins'],
    blockers: ['Waiting on Quest legal review (5 days)'],
    time_saved_minutes: 127,
    suggestions: [
      'Block 2-4pm for focused demo prep',
      'Send Quest follow-up before 11am',
      'Review Cholula metrics before check-in'
    ]
  })

  const getBriefIcon = () => {
    switch (briefType) {
      case 'morning': return '☀️'
      case 'afternoon': return '📊'
      case 'evening': return '🌙'
    }
  }

  const getBriefTitle = () => {
    switch (briefType) {
      case 'morning': return 'Morning Brief'
      case 'afternoon': return 'Afternoon Check-in'
      case 'evening': return 'Evening Digest'
    }
  }

  if (loading) {
    return (
      <div className="bg-robbie-bg-card border border-robbie-cyan/30 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-robbie-bg-darker rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-robbie-bg-darker rounded"></div>
            <div className="h-4 bg-robbie-bg-darker rounded w-5/6"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !brief) {
    return (
      <div className="bg-robbie-bg-card border border-red-500/30 rounded-lg p-6">
        <div className="text-red-400">❌ {error || 'No brief available'}</div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-robbie-bg-card border border-robbie-cyan/30 rounded-lg p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{getBriefIcon()}</span>
          <div>
            <h2 className="text-xl font-bold text-white">{getBriefTitle()}</h2>
            <p className="text-sm text-gray-400">
              {new Date(brief.timestamp).toLocaleTimeString()}
            </p>
          </div>
        </div>
        {brief.time_saved_minutes > 0 && (
          <div className="text-right">
            <div className="text-2xl font-bold text-robbie-cyan">
              {brief.time_saved_minutes}m
            </div>
            <div className="text-xs text-gray-400">saved today</div>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="text-gray-300">{brief.summary}</div>

      {/* Top 3 Outreach Opportunities */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          🎯 Top 3 Outreach Opportunities
        </h3>
        {brief.outreach_opportunities.map((opp, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-robbie-bg-darker border border-robbie-purple/30 rounded-lg p-4 hover:border-robbie-accent/50 transition-colors cursor-pointer"
            onClick={() => onAction?.('select_opportunity', opp)}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="font-semibold text-white">
                  {index + 1}. {opp.contact_name} @ {opp.company}
                </div>
                <div className="text-sm text-gray-400">{opp.reason}</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-robbie-accent">
                  ${(opp.revenue_potential / 1000).toFixed(0)}k
                </div>
                <div className="text-xs text-gray-500">potential</div>
              </div>
            </div>
            <div className="text-sm text-robbie-cyan">✅ {opp.action}</div>
            {opp.context && (
              <div className="text-xs text-gray-500 mt-2">💡 {opp.context}</div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Task Summary */}
      {!compact && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-robbie-bg-darker rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">Tasks</div>
            <div className="text-2xl font-bold text-white">
              {brief.task_summary.completed}/{brief.task_summary.total}
            </div>
            <div className="text-xs text-gray-500">
              {brief.task_summary.completion_rate.toFixed(0)}% complete
            </div>
          </div>
          <div className="bg-robbie-bg-darker rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">High Priority</div>
            <div className="text-2xl font-bold text-robbie-accent">
              {brief.task_summary.high_priority}
            </div>
            <div className="text-xs text-gray-500">
              {brief.task_summary.in_progress} in progress
            </div>
          </div>
        </div>
      )}

      {/* Wins */}
      {brief.wins.length > 0 && !compact && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-white">🏆 Wins</h3>
          {brief.wins.map((win, index) => (
            <div key={index} className="text-sm text-gray-300">• {win}</div>
          ))}
        </div>
      )}

      {/* Blockers */}
      {brief.blockers.length > 0 && !compact && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-white">⚠️ Blockers</h3>
          {brief.blockers.map((blocker, index) => (
            <div key={index} className="text-sm text-orange-400">• {blocker}</div>
          ))}
        </div>
      )}

      {/* Suggestions */}
      {brief.suggestions.length > 0 && !compact && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-white">💡 Suggestions</h3>
          {brief.suggestions.map((suggestion, index) => (
            <div key={index} className="text-sm text-gray-300">• {suggestion}</div>
          ))}
        </div>
      )}

      {/* Refresh Button */}
      <button
        onClick={fetchBrief}
        className="w-full py-2 bg-robbie-cyan/10 hover:bg-robbie-cyan/20 text-robbie-cyan rounded-lg transition-colors text-sm font-medium"
      >
        🔄 Refresh Brief
      </button>
    </motion.div>
  )
}

export default DailyBriefBlock





