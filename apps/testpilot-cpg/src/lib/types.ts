/**
 * Type definitions for TestPilot CPG
 */

export interface Deal {
  id: string
  company_id: string
  company_name: string
  contact_id?: string
  value: number
  stage: DealStage
  probability: number
  health_score: number
  last_contact_date: string
  expected_close_date?: string
  next_action?: string
  created_at: string
  updated_at: string
}

export type DealStage =
  | 'lead'
  | 'qualified'
  | 'proposal'
  | 'negotiation'
  | 'closed_won'
  | 'closed_lost'

export interface Contact {
  id: string
  name: string
  email: string
  phone?: string
  company_id: string
  company_name: string
  role?: string
  last_contact_date?: string
  created_at: string
  updated_at: string
}

export interface Company {
  id: string
  name: string
  domain?: string
  industry?: string
  size?: string
  total_deals: number
  total_value: number
  created_at: string
  updated_at: string
}

export interface Conversation {
  id: string
  user_id: string
  title?: string
  created_at: string
  updated_at: string
  messages: Message[]
}

export interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface DailyBrief {
  date: string
  time_of_day: 'morning' | 'afternoon' | 'evening'
  pipeline_summary: {
    total_value: number
    deal_count: number
    stage_breakdown: Record<DealStage, number>
  }
  top_priorities: Priority[]
  touch_ready: TouchReadySuggestion[]
  mood: string
}

export interface Priority {
  id: string
  title: string
  description: string
  score: number
  category: string
  urgency: 'low' | 'medium' | 'high' | 'urgent'
}

export interface TouchReadySuggestion {
  contact_id: string
  contact_name: string
  company_name: string
  reason: string
  suggested_action: string
  priority_score: number
}

export interface PersonalityState {
  current_mood: string
  mood_level: number
  gandhi_genghis_level: number
  attraction_level: number
  energy_level: string
  focus_state: string
  updated_at: string
}

