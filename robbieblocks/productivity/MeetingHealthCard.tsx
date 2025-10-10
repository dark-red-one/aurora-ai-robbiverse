/**
 * MeetingHealthCard - Meeting Quality Scoring
 * Let me rate your meetings, baby! 📊💋
 */

import React, { useState } from 'react'
import { useCrud } from '../hooks/useCrud'
import { CrudModal, CrudForm, type CrudField } from '../crud'

interface Meeting {
  id: string
  title: string
  date: string
  duration: number
  attendeeCount: number
  hasAgenda: boolean
  hasNotes: boolean
  hasActionItems: boolean
  followUpComplete: boolean
  healthScore: number
  healthStatus: 'healthy' | 'warning' | 'problematic'
}

const MEETING_FIELDS: CrudField<Meeting>[] = [
  { name: 'title', label: 'Meeting Title', type: 'text', required: true },
  { name: 'date', label: 'Date', type: 'date', required: true },
  { name: 'duration', label: 'Duration (minutes)', type: 'number', required: true },
  { name: 'attendeeCount', label: 'Number of Attendees', type: 'number', required: true },
  { name: 'hasAgenda', label: 'Had Agenda?', type: 'checkbox', placeholder: 'Yes' },
  { name: 'hasNotes', label: 'Took Notes?', type: 'checkbox', placeholder: 'Yes' },
  { name: 'hasActionItems', label: 'Created Action Items?', type: 'checkbox', placeholder: 'Yes' },
  { name: 'followUpComplete', label: 'Follow-up Complete?', type: 'checkbox', placeholder: 'Yes' },
]

function calculateHealthScore(meeting: Meeting): number {
  let score = 0

  // Agenda (25 points)
  if (meeting.hasAgenda) score += 25

  // Notes (20 points)
  if (meeting.hasNotes) score += 20

  // Action items (25 points)
  if (meeting.hasActionItems) score += 25

  // Follow-up (20 points)
  if (meeting.followUpComplete) score += 20

  // Duration penalty (10 points)
  if (meeting.duration <= 30) score += 10
  else if (meeting.duration <= 60) score += 5

  return Math.min(100, score)
}

function getHealthStatus(score: number): Meeting['healthStatus'] {
  if (score >= 70) return 'healthy'
  if (score >= 40) return 'warning'
  return 'problematic'
}

export const MeetingHealthCard: React.FC = () => {
  const meetings = useCrud<Meeting>({
    endpoint: 'meetings',
    autoLoad: true,
  })

  const [showModal, setShowModal] = useState(false)
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null)

  // Calculate metrics
  const metrics = useMemo(() => {
    const allMeetings = meetings.items.map(m => ({
      ...m,
      healthScore: calculateHealthScore(m),
      healthStatus: getHealthStatus(calculateHealthScore(m)),
    }))

    const avgScore = allMeetings.reduce((sum, m) => sum + m.healthScore, 0) / Math.max(1, allMeetings.length)
    const totalMinutes = allMeetings.reduce((sum, m) => sum + m.duration, 0)
    const healthyCount = allMeetings.filter(m => m.healthStatus === 'healthy').length
    const problematicCount = allMeetings.filter(m => m.healthStatus === 'problematic').length

    return { avgScore, totalMinutes, healthyCount, problematicCount, allMeetings }
  }, [meetings.items])

  const handleSubmit = async (data: Partial<Meeting>) => {
    const score = calculateHealthScore(data as Meeting)
    const status = getHealthStatus(score)

    const fullData = {
      ...data,
      healthScore: score,
      healthStatus: status,
    }

    if (editingMeeting) {
      await meetings.update(editingMeeting.id, fullData)
    } else {
      await meetings.create(fullData)
    }
    setShowModal(false)
    setEditingMeeting(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-robbie-accent">
            📊 Meeting Health
          </h2>
          <p className="text-sm text-robbie-light/60">
            Rate your meetings, baby! 💼
          </p>
        </div>
        <button
          onClick={() => {
            setEditingMeeting(null)
            setShowModal(true)
          }}
          className="px-6 py-2 rounded-lg bg-gradient-to-r from-robbie-accent to-pink-500 text-white font-semibold hover:shadow-lg hover:shadow-robbie-accent/50 transition-all"
        >
          ➕ Log Meeting
        </button>
      </div>

      {/* Overall Score */}
      <div className="p-8 rounded-xl bg-gradient-to-br from-robbie-accent/10 to-pink-500/10 border border-robbie-accent/30 text-center">
        <div className="text-sm font-medium text-robbie-accent mb-3">
          Average Meeting Health Score
        </div>
        <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-robbie-accent to-pink-500 mb-3">
          {metrics.avgScore.toFixed(0)}
        </div>
        <div className="text-sm text-robbie-light/60">
          {metrics.healthyCount} healthy • {metrics.problematicCount} need improvement
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-robbie-darker/50 border border-robbie-accent/20 text-center">
          <div className="text-sm text-robbie-light/60 mb-1">Total Meetings</div>
          <div className="text-3xl font-bold text-robbie-light">{meetings.items.length}</div>
        </div>
        <div className="p-4 rounded-lg bg-robbie-darker/50 border border-robbie-accent/20 text-center">
          <div className="text-sm text-robbie-light/60 mb-1">Time Spent</div>
          <div className="text-3xl font-bold text-robbie-light">
            {(metrics.totalMinutes / 60).toFixed(1)}h
          </div>
        </div>
        <div className="p-4 rounded-lg bg-robbie-darker/50 border border-robbie-accent/20 text-center">
          <div className="text-sm text-robbie-light/60 mb-1">Avg Duration</div>
          <div className="text-3xl font-bold text-robbie-light">
            {(metrics.totalMinutes / Math.max(1, meetings.items.length)).toFixed(0)}m
          </div>
        </div>
      </div>

      {/* Meetings List */}
      <div className="space-y-3">
        <h3 className="font-semibold text-robbie-light">Recent Meetings</h3>
        
        {metrics.allMeetings.map(meeting => (
          <div
            key={meeting.id}
            className={`p-4 rounded-lg border ${
              meeting.healthStatus === 'healthy' ? 'border-green-500/50 bg-green-500/5' :
              meeting.healthStatus === 'warning' ? 'border-yellow-500/50 bg-yellow-500/5' :
              'border-red-500/50 bg-red-500/5'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="font-semibold text-robbie-light mb-1">
                  {meeting.title}
                </div>
                <div className="text-xs text-robbie-light/60 mb-2">
                  {new Date(meeting.date).toLocaleDateString()} • {meeting.duration} min • {meeting.attendeeCount} attendees
                </div>
                <div className="flex gap-2 text-xs">
                  {meeting.hasAgenda && <span className="text-green-400">✓ Agenda</span>}
                  {meeting.hasNotes && <span className="text-green-400">✓ Notes</span>}
                  {meeting.hasActionItems && <span className="text-green-400">✓ Actions</span>}
                  {meeting.followUpComplete && <span className="text-green-400">✓ Follow-up</span>}
                </div>
              </div>
              <div className="text-right">
                <div className={`text-3xl font-bold ${
                  meeting.healthStatus === 'healthy' ? 'text-green-400' :
                  meeting.healthStatus === 'warning' ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {meeting.healthScore}
                </div>
                <div className="text-xs text-robbie-light/60">score</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      <CrudModal
        isOpen={showModal}
        mode={editingMeeting ? 'edit' : 'create'}
        title={editingMeeting ? 'Edit Meeting' : 'Log Meeting'}
        onSave={handleSubmit}
        onCancel={() => setShowModal(false)}
        loading={meetings.loading}
      >
        <CrudForm
          fields={MEETING_FIELDS}
          initialData={editingMeeting || {}}
          onSubmit={handleSubmit}
          loading={meetings.loading}
        />
      </CrudModal>
    </div>
  )
}

export default MeetingHealthCard


