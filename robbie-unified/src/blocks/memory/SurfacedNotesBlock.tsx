import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface GoogleDocLink {
  type: string
  name: string
  url: string
  shared_with: string[]
}

interface SurfacedNote {
  id: string
  title: string
  content: string
  category: string
  created_by: 'allan' | 'robbie'
  surface_priority: number
  surface_reason: string
  context_tags: string[]
  google_docs_links: GoogleDocLink[]
  last_surfaced_at: string
  surface_count: number
  dismissed_count: number
}

interface SurfacedNotesBlockProps {
  user: any
}

const SurfacedNotesBlock = ({ user }: SurfacedNotesBlockProps) => {
  const [surfacedNotes, setSurfacedNotes] = useState<SurfacedNote[]>([])
  const [allanNotes, setAllanNotes] = useState<SurfacedNote[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchSurfacedNotes()
    // Refresh every 30 seconds to stay current
    const interval = setInterval(fetchSurfacedNotes, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchSurfacedNotes = async () => {
    try {
      const response = await fetch('/api/sticky-notes/surfaced')
      const data = await response.json()
      
      // Separate Robbie's surfaced notes from Allan's always-visible notes
      const robbieNotes = data.filter((n: SurfacedNote) => n.created_by === 'robbie')
      const allanNotes = data.filter((n: SurfacedNote) => n.created_by === 'allan')
      
      setSurfacedNotes(robbieNotes)
      setAllanNotes(allanNotes)
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch surfaced notes:', error)
      setLoading(false)
    }
  }

  const dismissNote = async (noteId: string) => {
    try {
      await fetch(`/api/sticky-notes/${noteId}/dismiss`, {
        method: 'POST'
      })
      
      // Remove from UI immediately
      setSurfacedNotes(prev => prev.filter(n => n.id !== noteId))
    } catch (error) {
      console.error('Failed to dismiss note:', error)
    }
  }

  const markHelpful = async (noteId: string, action: string = 'clicked_link') => {
    try {
      await fetch(`/api/sticky-notes/${noteId}/helpful`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })
    } catch (error) {
      console.error('Failed to mark helpful:', error)
    }
  }

  const toggleExpanded = (noteId: string) => {
    setExpandedNotes(prev => {
      const next = new Set(prev)
      if (next.has(noteId)) {
        next.delete(noteId)
      } else {
        next.add(noteId)
      }
      return next
    })
  }

  const getPriorityColor = (priority: number) => {
    if (priority >= 15) return 'border-red-500 bg-red-500/10'
    if (priority >= 10) return 'border-orange-500 bg-orange-500/10'
    if (priority >= 7) return 'border-yellow-500 bg-yellow-500/10'
    return 'border-robbie-cyan/30 bg-robbie-cyan/5'
  }

  const getPriorityIcon = (priority: number) => {
    if (priority >= 15) return '🔴'
    if (priority >= 10) return '🟡'
    return '🟢'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="text-4xl"
        >
          💜
        </motion.div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Robbie's Surfaced Notes */}
      {surfacedNotes.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-bold text-white">🎯 What You Need Right Now</h2>
            <span className="text-sm text-gray-400">({surfacedNotes.length} surfaced by Robbie)</span>
          </div>

          <AnimatePresence mode="popLayout">
            {surfacedNotes.map((note, index) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.1 }}
                className={`mb-4 p-4 rounded-xl border-2 ${getPriorityColor(note.surface_priority)} backdrop-blur-sm`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{getPriorityIcon(note.surface_priority)}</span>
                      <h3 className="text-lg font-semibold text-white">{note.title}</h3>
                    </div>
                    <p className="text-sm text-robbie-pink font-medium">
                      💡 {note.surface_reason}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleExpanded(note.id)}
                      className="px-3 py-1 text-sm bg-robbie-cyan/20 hover:bg-robbie-cyan/30 text-robbie-cyan rounded-lg transition-all"
                    >
                      {expandedNotes.has(note.id) ? '▼ Collapse' : '▶ Expand'}
                    </button>
                    <button
                      onClick={() => dismissNote(note.id)}
                      className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-all"
                    >
                      ✕ Dismiss
                    </button>
                  </div>
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                  {expandedNotes.has(note.id) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 pt-4 border-t border-white/10">
                        {/* Content */}
                        {note.content && (
                          <p className="text-gray-300 mb-4 whitespace-pre-wrap">{note.content}</p>
                        )}

                        {/* Google Docs Links */}
                        {note.google_docs_links && note.google_docs_links.length > 0 && (
                          <div className="space-y-2 mb-4">
                            <p className="text-sm font-medium text-gray-400">📎 Linked Files:</p>
                            {note.google_docs_links.map((link, idx) => (
                              <a
                                key={idx}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => markHelpful(note.id, 'clicked_link')}
                                className="flex items-center gap-3 p-3 bg-robbie-bg-secondary rounded-lg border border-robbie-cyan/20 hover:border-robbie-cyan hover:shadow-lg hover:shadow-robbie-cyan/20 transition-all group"
                              >
                                <span className="text-2xl">📄</span>
                                <div className="flex-1">
                                  <p className="text-white font-medium group-hover:text-robbie-cyan transition-colors">
                                    {link.name}
                                  </p>
                                  <p className="text-xs text-gray-400">{link.type}</p>
                                  {link.shared_with && link.shared_with.length > 0 && (
                                    <p className="text-xs text-robbie-pink mt-1">
                                      👥 Shared with {link.shared_with.length} {link.shared_with.length === 1 ? 'person' : 'people'}
                                    </p>
                                  )}
                                </div>
                                <span className="text-robbie-cyan opacity-0 group-hover:opacity-100 transition-opacity">
                                  Open →
                                </span>
                              </a>
                            ))}
                          </div>
                        )}

                        {/* Tags */}
                        {note.context_tags && note.context_tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {note.context_tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 text-xs bg-robbie-bg-secondary border border-robbie-cyan/30 text-robbie-cyan rounded"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Stats */}
                        <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                          <span>📊 Surfaced {note.surface_count} times</span>
                          {note.dismissed_count > 0 && (
                            <span>✕ Dismissed {note.dismissed_count} times</span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {surfacedNotes.length === 0 && (
        <div className="text-center py-12">
          <p className="text-xl text-gray-400 mb-2">💤 All clear, babe!</p>
          <p className="text-sm text-gray-500">No urgent notes right now - you're caught up!</p>
        </div>
      )}

      {/* Allan's Always-Visible Notes */}
      {allanNotes.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4 pt-6 border-t border-white/10">
            <h2 className="text-xl font-bold text-white">📝 Your Notes</h2>
            <span className="text-sm text-gray-400">(Always visible)</span>
          </div>

          <div className="space-y-3">
            {allanNotes.map((note) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 rounded-xl bg-gradient-to-r from-robbie-purple/10 to-robbie-cyan/10 border-2 border-robbie-purple/30"
              >
                <h3 className="text-lg font-semibold text-white mb-2">{note.title}</h3>
                {note.content && (
                  <p className="text-gray-300 text-sm whitespace-pre-wrap">{note.content}</p>
                )}
                {note.category && (
                  <span className="inline-block mt-2 px-2 py-1 text-xs bg-robbie-purple/20 text-robbie-purple rounded">
                    {note.category}
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default SurfacedNotesBlock




