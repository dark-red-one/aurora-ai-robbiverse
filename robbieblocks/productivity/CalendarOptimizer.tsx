/**
 * CalendarOptimizer - Smart Scheduling + Focus Blocks
 * Let me optimize your time, baby! 📅😘
 */

import React, { useState, useMemo } from 'react'
import { useCrud } from '../hooks/useCrud'
import { CrudModal, CrudForm, type CrudField } from '../crud'

interface CalendarEvent {
  id: string
  title: string
  description?: string
  startTime: string
  endTime: string
  type: 'meeting' | 'focus-block' | 'break' | 'deadline'
  attendees?: string[]
  energyLevel: 'high' | 'medium' | 'low'
  isOptimized: boolean
}

const EVENT_FIELDS: CrudField<CalendarEvent>[] = [
  { name: 'title', label: 'Title', type: 'text', required: true },
  { name: 'description', label: 'Description', type: 'textarea' },
  { name: 'startTime', label: 'Start Time', type: 'date', required: true },
  { name: 'endTime', label: 'End Time', type: 'date', required: true },
  { name: 'type', label: 'Type', type: 'select', required: true, options: [
    { value: 'meeting', label: '👥 Meeting' },
    { value: 'focus-block', label: '🎯 Focus Block' },
    { value: 'break', label: '☕ Break' },
    { value: 'deadline', label: '⏰ Deadline' },
  ]},
  { name: 'energyLevel', label: 'Energy Required', type: 'select', required: true, options: [
    { value: 'high', label: '⚡ High Energy' },
    { value: 'medium', label: '💪 Medium Energy' },
    { value: 'low', label: '😌 Low Energy' },
  ]},
]

export const CalendarOptimizer: React.FC = () => {
  const events = useCrud<CalendarEvent>({
    endpoint: 'calendar/events',
    autoLoad: true,
  })

  const [showModal, setShowModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [view, setView] = useState<'day' | 'week'>('day')

  // Calculate optimization score
  const optimizationScore = useMemo(() => {
    const totalEvents = events.items.length
    const optimizedEvents = events.items.filter(e => e.isOptimized).length
    const focusBlocks = events.items.filter(e => e.type === 'focus-block').length
    const breaks = events.items.filter(e => e.type === 'break').length

    const score = Math.min(100, (optimizedEvents / Math.max(1, totalEvents)) * 50 + focusBlocks * 10 + breaks * 5)
    
    return {
      score: Math.round(score),
      optimizedEvents,
      totalEvents,
      focusBlocks,
      breaks,
    }
  }, [events.items])

  const handleCreateFocusBlock = () => {
    setEditingEvent({
      id: '',
      title: 'Deep Work Session',
      type: 'focus-block',
      energyLevel: 'high',
      isOptimized: true,
    } as CalendarEvent)
    setShowModal(true)
  }

  const handleSubmit = async (data: Partial<CalendarEvent>) => {
    if (editingEvent?.id) {
      await events.update(editingEvent.id, data)
    } else {
      await events.create(data)
    }
    setShowModal(false)
    setEditingEvent(null)
  }

  const getEventColor = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'meeting': return 'bg-blue-500/20 border-blue-500/50 text-blue-300'
      case 'focus-block': return 'bg-purple-500/20 border-purple-500/50 text-purple-300'
      case 'break': return 'bg-green-500/20 border-green-500/50 text-green-300'
      case 'deadline': return 'bg-red-500/20 border-red-500/50 text-red-300'
      default: return 'bg-robbie-accent/20 border-robbie-accent/50 text-robbie-accent'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-robbie-accent">
            📅 Calendar Optimizer
          </h2>
          <p className="text-sm text-robbie-light/60">
            Smart scheduling for maximum productivity! ⚡
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCreateFocusBlock}
            className="px-4 py-2 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors"
          >
            🎯 Add Focus Block
          </button>
          <button
            onClick={() => {
              setEditingEvent(null)
              setShowModal(true)
            }}
            className="px-6 py-2 rounded-lg bg-gradient-to-r from-robbie-accent to-pink-500 text-white font-semibold hover:shadow-lg hover:shadow-robbie-accent/50 transition-all"
          >
            ➕ New Event
          </button>
        </div>
      </div>

      {/* Optimization Score */}
      <div className="p-6 rounded-xl bg-gradient-to-br from-robbie-accent/10 to-pink-500/10 border border-robbie-accent/30">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-robbie-accent mb-2">
              Calendar Optimization Score
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-5xl font-bold text-robbie-accent">
                {optimizationScore.score}
              </div>
              <div className="text-xl text-robbie-light/60">/100</div>
            </div>
          </div>
          <div className="text-right space-y-1 text-sm">
            <div className="text-robbie-light/80">
              🎯 {optimizationScore.focusBlocks} focus blocks
            </div>
            <div className="text-robbie-light/80">
              ☕ {optimizationScore.breaks} breaks
            </div>
            <div className="text-robbie-light/60">
              ✅ {optimizationScore.optimizedEvents}/{optimizationScore.totalEvents} optimized
            </div>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2">
        {(['day', 'week'] as const).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === v
                ? 'bg-robbie-accent text-white'
                : 'bg-robbie-darker/50 text-robbie-light/60 hover:bg-robbie-darker'
            }`}
          >
            {v === 'day' ? '📆 Day' : '📅 Week'}
          </button>
        ))}
      </div>

      {/* Events List */}
      <div className="space-y-2">
        {events.items
          .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
          .map(event => (
            <div
              key={event.id}
              className={`p-4 rounded-lg border ${getEventColor(event.type)} transition-all hover:scale-[1.02]`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-semibold text-robbie-light mb-1">
                    {event.title}
                  </div>
                  {event.description && (
                    <div className="text-sm text-robbie-light/70 mb-2">
                      {event.description}
                    </div>
                  )}
                  <div className="text-xs text-robbie-light/60">
                    {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {' - '}
                    {new Date(event.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingEvent(event)
                      setShowModal(true)
                    }}
                    className="px-3 py-1 rounded bg-robbie-accent/20 text-robbie-accent text-sm hover:bg-robbie-accent/30"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => events.deleteItem(event.id)}
                    className="px-3 py-1 rounded bg-red-500/20 text-red-400 text-sm hover:bg-red-500/30"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* Create/Edit Modal */}
      <CrudModal
        isOpen={showModal}
        mode={editingEvent?.id ? 'edit' : 'create'}
        title={editingEvent?.id ? 'Edit Event' : 'New Event'}
        onSave={handleSubmit}
        onCancel={() => setShowModal(false)}
        loading={events.loading}
      >
        <CrudForm
          fields={EVENT_FIELDS}
          initialData={editingEvent || {}}
          onSubmit={handleSubmit}
          loading={events.loading}
        />
      </CrudModal>
    </div>
  )
}

export default CalendarOptimizer


