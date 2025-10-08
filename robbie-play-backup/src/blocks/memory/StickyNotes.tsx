import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRobbieStore } from "../../stores/robbieStore"

interface StickyNotesProps {
  user: any
}

interface Note {
  id: string
  title: string
  content: string
  color: string
  timestamp: Date
}

const colors = [
  { name: 'yellow', class: 'bg-robbie-notes-yellow text-gray-900', label: '💛' },
  { name: 'green', class: 'bg-robbie-notes-green text-white', label: '💚' },
  { name: 'blue', class: 'bg-robbie-notes-blue text-white', label: '💙' },
  { name: 'red', class: 'bg-robbie-notes-red text-white', label: '❤️' },
  { name: 'purple', class: 'bg-robbie-notes-purple text-white', label: '💜' },
  { name: 'orange', class: 'bg-robbie-notes-orange text-white', label: '🧡' },
]

const StickyNotes = ({ user }: StickyNotesProps) => {
  const [notes, setNotes] = useState<Note[]>([
    {
      id: '1',
      title: 'Welcome!',
      content: 'This is your sticky notes board. Add quick thoughts, reminders, or ideas here! 💡',
      color: 'yellow',
      timestamp: new Date(),
    }
  ])
  const [isAdding, setIsAdding] = useState(false)
  const [newNote, setNewNote] = useState({ title: '', content: '', color: 'yellow' })

  const handleAdd = () => {
    if (!newNote.title.trim()) return

    const note: Note = {
      id: Date.now().toString(),
      title: newNote.title,
      content: newNote.content,
      color: newNote.color,
      timestamp: new Date(),
    }

    setNotes(prev => [note, ...prev])
    setNewNote({ title: '', content: '', color: 'yellow' })
    setIsAdding(false)
  }

  const handleDelete = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id))
  }

  return (
    <div className="h-full flex flex-col bg-robbie-bg-primary p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Sticky Notes 📝</h2>
        <p className="text-gray-400">Quick capture your thoughts, beautifully organized</p>
      </div>

      {/* Add Button */}
      {!isAdding && (
        <motion.button
          onClick={() => setIsAdding(true)}
          className="mb-6 px-6 py-3 bg-gradient-to-r from-robbie-cyan to-robbie-teal text-black font-semibold rounded-lg hover:shadow-lg hover:shadow-robbie-cyan/50 transition-all duration-200"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          + New Note
        </motion.button>
      )}

      {/* Add Note Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 bg-robbie-bg-card border border-robbie-cyan/30 rounded-lg p-4"
          >
            <input
              type="text"
              placeholder="Note title..."
              value={newNote.title}
              onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
              className="w-full bg-robbie-bg-secondary border border-robbie-cyan/20 rounded px-3 py-2 text-white mb-3 focus:border-robbie-cyan focus:outline-none"
              autoFocus
            />
            <textarea
              placeholder="What's on your mind?"
              value={newNote.content}
              onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
              className="w-full bg-robbie-bg-secondary border border-robbie-cyan/20 rounded px-3 py-2 text-white mb-3 resize-none focus:border-robbie-cyan focus:outline-none"
              rows={4}
            />
            <div className="flex gap-2 mb-3">
              {colors.map((color) => (
                <button
                  key={color.name}
                  onClick={() => setNewNote({ ...newNote, color: color.name })}
                  className={`w-8 h-8 rounded-full ${color.class} flex items-center justify-center ${
                    newNote.color === color.name ? 'ring-2 ring-white scale-110' : 'opacity-70'
                  } transition-all`}
                  title={color.name}
                >
                  {newNote.color === color.name && '✓'}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                className="flex-1 bg-robbie-cyan text-black font-semibold py-2 rounded hover:bg-robbie-teal transition-colors"
              >
                Add Note
              </button>
              <button
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 bg-robbie-bg-secondary text-gray-300 rounded hover:bg-robbie-bg-primary transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notes Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {notes.map((note, index) => {
              const colorConfig = colors.find(c => c.name === note.color) || colors[0]
              return (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, scale: 0.8, rotate: -2 }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1, 
                    rotate: index % 2 === 0 ? -1 : 1 
                  }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ scale: 1.05, rotate: 0, zIndex: 10 }}
                  className={`${colorConfig.class} rounded-lg p-5 shadow-xl cursor-pointer relative`}
                  style={{
                    boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
                  }}
                >
                  <div className="mb-2">
                    <h3 className="font-bold text-lg mb-1">{note.title}</h3>
                    <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                  </div>
                  <div className="text-xs opacity-70 flex items-center justify-between mt-3">
                    <span>{note.timestamp.toLocaleDateString()}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(note.id)
                      }}
                      className="opacity-0 hover:opacity-100 transition-opacity bg-black/20 hover:bg-black/40 px-2 py-1 rounded"
                    >
                      Delete
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

export default StickyNotes
