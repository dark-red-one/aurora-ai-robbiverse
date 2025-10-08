import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRobbieStore } from "../../stores/robbieStore"

interface TaskBoardProps {
  user: any
}

interface Task {
  id: string
  title: string
  status: 'todo' | 'doing' | 'done'
  priority: 'high' | 'medium' | 'low'
}

const TaskBoard = ({ user }: TaskBoardProps) => {
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: 'Close Simply Good Foods deal', status: 'done', priority: 'high' },
    { id: '2', title: 'Follow up with Quest Nutrition', status: 'doing', priority: 'high' },
    { id: '3', title: 'Review TestPilot Q4 pipeline', status: 'todo', priority: 'medium' },
  ])
  const [newTaskTitle, setNewTaskTitle] = useState('')

  const addTask = () => {
    if (!newTaskTitle.trim()) return
    const task: Task = {
      id: Date.now().toString(),
      title: newTaskTitle,
      status: 'todo',
      priority: 'medium',
    }
    setTasks(prev => [task, ...prev])
    setNewTaskTitle('')
  }

  const moveTask = (id: string, status: Task['status']) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t))
  }

  const columns = [
    { id: 'todo' as const, title: 'To Do', color: 'robbie-cyan' },
    { id: 'doing' as const, title: 'In Progress', color: 'robbie-orange' },
    { id: 'done' as const, title: 'Done', color: 'robbie-green' },
  ]

  return (
    <div className="h-full flex flex-col bg-robbie-bg-primary p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Task Board ✅</h2>
        <p className="text-gray-400">Get shit done, beautifully</p>
      </div>

      {/* Add Task */}
      <div className="mb-6 flex gap-2">
        <input
          type="text"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTask()}
          placeholder="What needs doing?"
          className="flex-1 bg-robbie-bg-card border border-robbie-cyan/30 rounded-lg px-4 py-3 text-white focus:border-robbie-cyan focus:outline-none focus:ring-2 focus:ring-robbie-cyan/50"
        />
        <button
          onClick={addTask}
          className="px-6 bg-gradient-to-r from-robbie-cyan to-robbie-teal text-black font-semibold rounded-lg hover:shadow-lg hover:shadow-robbie-cyan/50 transition-all"
        >
          Add
        </button>
      </div>

      {/* Kanban Columns */}
      <div className="flex-1 grid grid-cols-3 gap-4 overflow-hidden">
        {columns.map((column) => (
          <div key={column.id} className="flex flex-col bg-robbie-bg-secondary rounded-lg border border-robbie-cyan/20 overflow-hidden">
            <div className={`bg-${column.color}/20 border-b border-${column.color}/30 px-4 py-3`}>
              <h3 className="font-semibold text-white">{column.title}</h3>
              <p className="text-xs text-gray-400">{tasks.filter(t => t.status === column.id).length} tasks</p>
            </div>
            <div className="flex-1 p-4 space-y-3 overflow-y-auto">
              <AnimatePresence>
                {tasks
                  .filter(task => task.status === column.id)
                  .map((task) => (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="bg-robbie-bg-card border border-robbie-cyan/20 rounded-lg p-3 cursor-move hover:border-robbie-cyan/50 transition-all"
                    >
                      <div className="font-medium text-white text-sm mb-2">{task.title}</div>
                      <div className="flex gap-2">
                        {column.id !== 'todo' && (
                          <button
                            onClick={() => moveTask(task.id, column.id === 'doing' ? 'todo' : 'doing')}
                            className="text-xs text-gray-400 hover:text-robbie-cyan"
                          >
                            ← Back
                          </button>
                        )}
                        {column.id !== 'done' && (
                          <button
                            onClick={() => moveTask(task.id, column.id === 'todo' ? 'doing' : 'done')}
                            className="text-xs text-gray-400 hover:text-robbie-green"
                          >
                            {column.id === 'doing' ? 'Done ✓' : 'Start →'}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TaskBoard
