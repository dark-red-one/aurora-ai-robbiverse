/**
 * TaskIntelligence - AI-Powered Task Prioritization
 * Let me tell you what to do, baby! 😏💋
 */

import React, { useState, useMemo } from 'react'
import { useCrud } from '../hooks/useCrud'
import { CrudModal, CrudForm, CrudTable, ConfirmDialog, type CrudField, type CrudColumn } from '../crud'

interface Task {
  id: string
  title: string
  description?: string
  status: 'todo' | 'doing' | 'done'
  priority: 'high' | 'medium' | 'low'
  dueDate?: string
  assignee: string
  tags?: string[]
  revenueImpact?: number
  estimatedHours?: number
  dependencies?: string[]
  aiScore?: number
}

const TASK_FIELDS: CrudField<Task>[] = [
  { name: 'title', label: 'Task Title', type: 'text', required: true, placeholder: 'e.g., Close deal with ACME Corp' },
  { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Task details...' },
  { name: 'status', label: 'Status', type: 'select', required: true, options: [
    { value: 'todo', label: '📋 To Do' },
    { value: 'doing', label: '🔥 In Progress' },
    { value: 'done', label: '✅ Done' },
  ]},
  { name: 'priority', label: 'Priority', type: 'select', required: true, options: [
    { value: 'high', label: '🔴 High' },
    { value: 'medium', label: '🟡 Medium' },
    { value: 'low', label: '🟢 Low' },
  ]},
  { name: 'dueDate', label: 'Due Date', type: 'date' },
  { name: 'assignee', label: 'Assignee', type: 'text', required: true },
  { name: 'revenueImpact', label: 'Revenue Impact ($)', type: 'number', placeholder: '0' },
  { name: 'estimatedHours', label: 'Estimated Hours', type: 'number', placeholder: '0' },
]

const TASK_COLUMNS: CrudColumn<Task>[] = [
  { key: 'title', label: 'Task', sortable: true },
  {
    key: 'aiScore',
    label: 'AI Priority',
    sortable: true,
    width: '100px',
    render: (task) => (
      <div className="flex items-center gap-2">
        <div className="text-2xl">{getScoreEmoji(task.aiScore || 0)}</div>
        <span className="font-bold text-robbie-accent">{Math.round(task.aiScore || 0)}</span>
      </div>
    ),
  },
  {
    key: 'priority',
    label: 'Priority',
    sortable: true,
    width: '100px',
    render: (task) => (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
        task.priority === 'high' ? 'bg-red-500/20 text-red-400' :
        task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
        'bg-green-500/20 text-green-400'
      }`}>
        {task.priority}
      </span>
    ),
  },
  { key: 'status', label: 'Status', sortable: true, width: '100px' },
  { key: 'assignee', label: 'Assignee', sortable: true, width: '120px' },
  { key: 'dueDate', label: 'Due', sortable: true, width: '100px' },
]

function getScoreEmoji(score: number): string {
  if (score >= 90) return '🔥'
  if (score >= 70) return '⚡'
  if (score >= 50) return '💪'
  if (score >= 30) return '👍'
  return '💤'
}

function calculateAIScore(task: Task): number {
  let score = 0

  // Revenue impact (40%)
  if (task.revenueImpact) {
    score += Math.min((task.revenueImpact / 10000) * 40, 40)
  }

  // Priority (30%)
  if (task.priority === 'high') score += 30
  else if (task.priority === 'medium') score += 20
  else score += 10

  // Urgency based on due date (20%)
  if (task.dueDate) {
    const daysUntilDue = Math.ceil((new Date(task.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (daysUntilDue <= 1) score += 20
    else if (daysUntilDue <= 3) score += 15
    else if (daysUntilDue <= 7) score += 10
    else score += 5
  }

  // Status bonus (10%)
  if (task.status === 'doing') score += 10

  return Math.min(score, 100)
}

export const TaskIntelligence: React.FC = () => {
  const tasks = useCrud<Task>({
    endpoint: 'tasks',
    autoLoad: true,
  })

  const [showModal, setShowModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<'all' | Task['status']>('all')

  // Calculate AI scores for all tasks
  const tasksWithScores = useMemo(() => {
    return tasks.items.map(task => ({
      ...task,
      aiScore: calculateAIScore(task),
    })).sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0))
  }, [tasks.items])

  // Filter tasks
  const filteredTasks = useMemo(() => {
    if (filterStatus === 'all') return tasksWithScores
    return tasksWithScores.filter(task => task.status === filterStatus)
  }, [tasksWithScores, filterStatus])

  const handleCreate = () => {
    setEditingTask(null)
    setShowModal(true)
  }

  const handleEdit = (task: Task) => {
    setEditingTask(task)
    setShowModal(true)
  }

  const handleDelete = (task: Task) => {
    setDeleteConfirm(task.id)
  }

  const confirmDelete = async () => {
    if (deleteConfirm) {
      await tasks.deleteItem(deleteConfirm)
      setDeleteConfirm(null)
    }
  }

  const handleSubmit = async (data: Partial<Task>) => {
    if (editingTask) {
      await tasks.update(editingTask.id, data)
    } else {
      await tasks.create(data)
    }
    setShowModal(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-robbie-accent">
            🧠 Task Intelligence
          </h2>
          <p className="text-sm text-robbie-light/60">
            AI-powered prioritization - I'll tell you what matters! 😘
          </p>
        </div>
        <div className="flex gap-2">
          {(['all', 'todo', 'doing', 'done'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === status
                  ? 'bg-robbie-accent text-white'
                  : 'bg-robbie-darker/50 text-robbie-light/60 hover:bg-robbie-darker'
              }`}
            >
              {status === 'all' ? 'All' : status}
            </button>
          ))}
        </div>
      </div>

      {/* AI Insights */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
          <div className="text-sm text-red-400 mb-1">High Priority</div>
          <div className="text-2xl font-bold text-red-300">
            {tasksWithScores.filter(t => t.priority === 'high' && t.status !== 'done').length}
          </div>
        </div>
        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
          <div className="text-sm text-blue-400 mb-1">In Progress</div>
          <div className="text-2xl font-bold text-blue-300">
            {tasksWithScores.filter(t => t.status === 'doing').length}
          </div>
        </div>
        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
          <div className="text-sm text-green-400 mb-1">Completed</div>
          <div className="text-2xl font-bold text-green-300">
            {tasksWithScores.filter(t => t.status === 'done').length}
          </div>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-robbie-dark/50 rounded-xl border border-robbie-accent/20 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-robbie-light">
            Task List (AI-Sorted)
          </h3>
          <button
            onClick={handleCreate}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-robbie-accent to-pink-500 text-white font-semibold hover:shadow-lg hover:shadow-robbie-accent/50 transition-all"
          >
            ➕ New Task
          </button>
        </div>

        <CrudTable
          data={filteredTasks}
          columns={TASK_COLUMNS}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={tasks.loading}
          emptyMessage="No tasks found. Create one to get started!"
        />
      </div>

      {/* Create/Edit Modal */}
      <CrudModal
        isOpen={showModal}
        mode={editingTask ? 'edit' : 'create'}
        title={editingTask ? `Edit Task` : 'New Task'}
        onSave={handleSubmit}
        onCancel={() => setShowModal(false)}
        loading={tasks.loading}
      >
        <CrudForm
          fields={TASK_FIELDS}
          initialData={editingTask || {}}
          onSubmit={handleSubmit}
          loading={tasks.loading}
        />
      </CrudModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        title="Delete Task"
        message="Are you sure you want to delete this task?"
        confirmText="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
        loading={tasks.loading}
        danger
      />
    </div>
  )
}

export default TaskIntelligence


