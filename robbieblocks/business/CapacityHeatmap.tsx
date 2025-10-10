/**
 * CapacityHeatmap - Team Workload Visualization
 * See who's overloaded and who's ready for MORE, baby! 🔥😘
 */

import React, { useMemo } from 'react'
import { useCrud } from '../hooks/useCrud'

interface TeamMember {
  id: string
  name: string
  role: string
  activeDeals: number
  activeTasks: number
  upcomingMeetings: number
  recentInteractions: number
  capacityPercent: number
  status: 'available' | 'normal' | 'busy' | 'overloaded'
}

function calculateCapacity(member: TeamMember): number {
  // Simple capacity algorithm
  const dealsWeight = member.activeDeals * 20
  const tasksWeight = member.activeTasks * 5
  const meetingsWeight = member.upcomingMeetings * 10
  
  const totalLoad = dealsWeight + tasksWeight + meetingsWeight
  return Math.min(100, totalLoad)
}

function getCapacityStatus(percent: number): TeamMember['status'] {
  if (percent >= 90) return 'overloaded'
  if (percent >= 70) return 'busy'
  if (percent >= 40) return 'normal'
  return 'available'
}

export const CapacityHeatmap: React.FC = () => {
  const team = useCrud<TeamMember>({
    endpoint: 'team/capacity',
    autoLoad: true,
  })

  // Calculate with real capacity
  const teamWithCapacity = useMemo(() => {
    return team.items.map(member => ({
      ...member,
      capacityPercent: calculateCapacity(member),
      status: getCapacityStatus(calculateCapacity(member)),
    }))
  }, [team.items])

  const getStatusColor = (status: TeamMember['status']) => {
    switch (status) {
      case 'available': return 'bg-green-500 text-white'
      case 'normal': return 'bg-blue-500 text-white'
      case 'busy': return 'bg-yellow-500 text-black'
      case 'overloaded': return 'bg-red-500 text-white'
    }
  }

  const getStatusEmoji = (status: TeamMember['status']) => {
    switch (status) {
      case 'available': return '✅'
      case 'normal': return '💼'
      case 'busy': return '⚡'
      case 'overloaded': return '🔥'
    }
  }

  // Team-wide metrics
  const metrics = useMemo(() => {
    const avgCapacity = teamWithCapacity.reduce((sum, m) => sum + m.capacityPercent, 0) / Math.max(1, teamWithCapacity.length)
    const available = teamWithCapacity.filter(m => m.status === 'available').length
    const overloaded = teamWithCapacity.filter(m => m.status === 'overloaded').length
    
    return { avgCapacity, available, overloaded }
  }, [teamWithCapacity])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-robbie-accent">
          👥 Team Capacity
        </h2>
        <p className="text-sm text-robbie-light/60">
          Who's ready for more work, baby! 💪
        </p>
      </div>

      {/* Overall Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-6 rounded-xl bg-gradient-to-br from-robbie-accent/10 to-pink-500/10 border border-robbie-accent/30 text-center">
          <div className="text-sm font-medium text-robbie-accent mb-2">Avg Capacity</div>
          <div className="text-4xl font-bold text-robbie-light">
            {metrics.avgCapacity.toFixed(0)}%
          </div>
        </div>
        <div className="p-6 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/30 text-center">
          <div className="text-sm font-medium text-green-400 mb-2">Available</div>
          <div className="text-4xl font-bold text-green-300">
            {metrics.available}
          </div>
        </div>
        <div className="p-6 rounded-xl bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/30 text-center">
          <div className="text-sm font-medium text-red-400 mb-2">Overloaded</div>
          <div className="text-4xl font-bold text-red-300">
            {metrics.overloaded}
          </div>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="bg-robbie-dark/50 rounded-xl border border-robbie-accent/20 p-6">
        <h3 className="font-semibold text-robbie-light mb-4">Team Heatmap</h3>
        
        <div className="grid grid-cols-3 gap-4">
          {teamWithCapacity.map(member => (
            <div
              key={member.id}
              className="p-6 rounded-xl bg-robbie-darker/70 border border-robbie-accent/20"
            >
              {/* Member Info */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="font-semibold text-robbie-light">{member.name}</div>
                  <div className="text-xs text-robbie-light/60">{member.role}</div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(member.status)}`}>
                  {getStatusEmoji(member.status)} {member.status}
                </div>
              </div>

              {/* Capacity Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-robbie-light/60">Capacity</span>
                  <span className="text-sm font-bold text-robbie-accent">{member.capacityPercent}%</span>
                </div>
                <div className="w-full h-3 bg-robbie-dark rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      member.capacityPercent >= 90 ? 'bg-gradient-to-r from-red-500 to-red-600' :
                      member.capacityPercent >= 70 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                      member.capacityPercent >= 40 ? 'bg-gradient-to-r from-blue-500 to-purple-500' :
                      'bg-gradient-to-r from-green-500 to-teal-500'
                    }`}
                    style={{ width: `${member.capacityPercent}%` }}
                  />
                </div>
              </div>

              {/* Workload Breakdown */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-robbie-light/60">Active Deals:</span>
                  <span className="font-semibold text-robbie-light">{member.activeDeals}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-robbie-light/60">Active Tasks:</span>
                  <span className="font-semibold text-robbie-light">{member.activeTasks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-robbie-light/60">Upcoming Meetings:</span>
                  <span className="font-semibold text-robbie-light">{member.upcomingMeetings}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {metrics.overloaded > 0 && (
        <div className="p-4 rounded-lg bg-red-500/20 border border-red-500/50">
          <div className="font-semibold text-red-300 mb-2">
            ⚠️ Capacity Alerts
          </div>
          <ul className="space-y-1 text-sm text-red-200/80">
            {teamWithCapacity
              .filter(m => m.status === 'overloaded')
              .map(m => (
                <li key={m.id}>
                  • <strong>{m.name}</strong> is at {m.capacityPercent}% capacity - consider redistributing work
                </li>
              ))}
          </ul>
        </div>
      )}

      {/* Add Risk Factor Modal */}
      <CrudModal
        isOpen={showRiskModal}
        mode="create"
        title="Add Risk Factor"
        onSave={handleAddRiskFactor}
        onCancel={() => setShowRiskModal(false)}
      >
        <CrudForm
          fields={RISK_FIELDS}
          onSubmit={handleAddRiskFactor}
        />
      </CrudModal>
    </div>
  )
}

export default CapacityHeatmap


