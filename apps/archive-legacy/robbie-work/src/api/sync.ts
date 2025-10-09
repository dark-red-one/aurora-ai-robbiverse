// Data Sync API for Robbie App
// Syncs notes, tasks, chat history with PostgreSQL backend

const API_BASE = '/api'

export interface Note {
  id: string
  title: string
  content: string
  color: string
  timestamp: Date
  user_id: string
}

export interface Task {
  id: string
  title: string
  status: 'todo' | 'doing' | 'done'
  priority: 'high' | 'medium' | 'low'
  user_id: string
  created_at: Date
}

export interface ChatMessage {
  id: string
  session_id: string
  role: 'user' | 'robbie'
  content: string
  timestamp: Date
}

// Sync Notes
export const syncNotes = async (): Promise<Note[]> => {
  const response = await fetch(`${API_BASE}/notes`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('robbie_token')}`,
    },
  })
  return response.json()
}

export const saveNote = async (note: Omit<Note, 'id' | 'timestamp'>): Promise<Note> => {
  const response = await fetch(`${API_BASE}/notes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('robbie_token')}`,
    },
    body: JSON.stringify(note),
  })
  return response.json()
}

export const deleteNote = async (noteId: string): Promise<void> => {
  await fetch(`${API_BASE}/notes/${noteId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('robbie_token')}`,
    },
  })
}

// Sync Tasks
export const syncTasks = async (): Promise<Task[]> => {
  const response = await fetch(`${API_BASE}/tasks`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('robbie_token')}`,
    },
  })
  return response.json()
}

export const saveTask = async (task: Omit<Task, 'id' | 'created_at'>): Promise<Task> => {
  const response = await fetch(`${API_BASE}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('robbie_token')}`,
    },
    body: JSON.stringify(task),
  })
  return response.json()
}

export const updateTask = async (taskId: string, updates: Partial<Task>): Promise<Task> => {
  const response = await fetch(`${API_BASE}/tasks/${taskId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('robbie_token')}`,
    },
    body: JSON.stringify(updates),
  })
  return response.json()
}

// Sync Chat
export const syncChatHistory = async (sessionId: string): Promise<ChatMessage[]> => {
  const response = await fetch(`${API_BASE}/chat/history/${sessionId}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('robbie_token')}`,
    },
  })
  return response.json()
}

export const sendChatMessage = async (sessionId: string, content: string): Promise<ChatMessage> => {
  const response = await fetch(`${API_BASE}/chat/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('robbie_token')}`,
    },
    body: JSON.stringify({
      session_id: sessionId,
      content: content,
    }),
  })
  return response.json()
}
