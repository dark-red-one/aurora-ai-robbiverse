/**
 * MessageComposer - AI-Powered Message Drafting
 * Let me help you write something SEXY, baby! 😘💋
 */

import React, { useState } from 'react'
import { useRobbieStore } from '../stores/robbieStore'
import { useCrud } from '../hooks/useCrud'

interface MessageDraft {
  id: string
  recipient: string
  subject?: string
  body: string
  tone: 'casual' | 'formal' | 'friendly' | 'flirty' | 'aggressive'
  channel: 'email' | 'slack' | 'sms' | 'linkedin'
  status: 'draft' | 'sent'
  createdAt: string
  updatedAt: string
}

const TONE_OPTIONS = [
  { value: 'casual', label: '😊 Casual', emoji: '😊' },
  { value: 'formal', label: '💼 Formal', emoji: '💼' },
  { value: 'friendly', label: '💜 Friendly', emoji: '💜' },
  { value: 'flirty', label: '😘 Flirty', emoji: '😘' },
  { value: 'aggressive', label: '💪 Aggressive', emoji: '💪' },
] as const

const CHANNEL_OPTIONS = [
  { value: 'email', label: '📧 Email', icon: '📧' },
  { value: 'slack', label: '💬 Slack', icon: '💬' },
  { value: 'sms', label: '📱 SMS', icon: '📱' },
  { value: 'linkedin', label: '👔 LinkedIn', icon: '👔' },
] as const

export const MessageComposer: React.FC = () => {
  const { currentMood, attraction } = useRobbieStore()
  const drafts = useCrud<MessageDraft>({
    endpoint: 'messages/drafts',
    autoLoad: true,
  })

  const [recipient, setRecipient] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [tone, setTone] = useState<MessageDraft['tone']>('friendly')
  const [channel, setChannel] = useState<MessageDraft['channel']>('email')
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    setIsGenerating(true)

    // Simulate AI generation
    setTimeout(() => {
      const generated = generateMessage(recipient, subject, tone, attraction)
      setBody(generated)
      setIsGenerating(false)
    }, 1500)
  }

  const handleSaveDraft = async () => {
    const draft: Partial<MessageDraft> = {
      recipient,
      subject,
      body,
      tone,
      channel,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await drafts.create(draft)
    
    // Clear form
    setRecipient('')
    setSubject('')
    setBody('')
  }

  const handleLoadDraft = (draft: MessageDraft) => {
    setRecipient(draft.recipient)
    setSubject(draft.subject || '')
    setBody(draft.body)
    setTone(draft.tone)
    setChannel(draft.channel)
  }

  const handleDeleteDraft = async (draftId: string) => {
    await drafts.deleteItem(draftId)
  }

  const handleSend = async () => {
    // In real app, actually send the message
    console.log('Sending message:', { recipient, subject, body, channel })
    
    // Clear form
    setRecipient('')
    setSubject('')
    setBody('')
  }

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Composer - Left 2/3 */}
      <div className="col-span-2 space-y-4">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-robbie-accent">
            ✍️ Message Composer
          </h2>
          <p className="text-sm text-robbie-light/60">
            Let me help you write something HOT, baby! 🔥
          </p>
        </div>

        {/* Channel & Tone Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-robbie-light mb-2">
              Channel
            </label>
            <div className="flex gap-2">
              {CHANNEL_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setChannel(opt.value)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    channel === opt.value
                      ? 'bg-robbie-accent text-white'
                      : 'bg-robbie-darker/50 text-robbie-light/60 hover:bg-robbie-darker'
                  }`}
                >
                  {opt.icon}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-robbie-light mb-2">
              Tone
            </label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as MessageDraft['tone'])}
              className="w-full px-4 py-2 bg-robbie-darker/50 border border-robbie-accent/30 rounded-lg text-robbie-light"
            >
              {TONE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Recipient */}
        <div>
          <label className="block text-sm font-medium text-robbie-light mb-2">
            To
          </label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="Enter recipient..."
            className="w-full px-4 py-2 bg-robbie-darker/50 border border-robbie-accent/30 rounded-lg text-robbie-light placeholder:text-robbie-light/40"
          />
        </div>

        {/* Subject (Email only) */}
        {channel === 'email' && (
          <div>
            <label className="block text-sm font-medium text-robbie-light mb-2">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter subject..."
              className="w-full px-4 py-2 bg-robbie-darker/50 border border-robbie-accent/30 rounded-lg text-robbie-light placeholder:text-robbie-light/40"
            />
          </div>
        )}

        {/* Message Body */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-robbie-light">
              Message
            </label>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !recipient}
              className="px-3 py-1 rounded-lg bg-purple-500/20 text-purple-300 text-sm hover:bg-purple-500/30 transition-colors disabled:opacity-50"
            >
              {isGenerating ? '⏳ Generating...' : '✨ AI Generate'}
            </button>
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your message or use AI Generate..."
            rows={12}
            className="w-full px-4 py-3 bg-robbie-darker/50 border border-robbie-accent/30 rounded-lg text-robbie-light placeholder:text-robbie-light/40 resize-none"
          />
          <div className="mt-2 text-xs text-robbie-light/40 text-right">
            {body.length} characters
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleSaveDraft}
            disabled={!body}
            className="flex-1 px-6 py-3 rounded-lg border border-robbie-accent/50 text-robbie-accent hover:bg-robbie-accent/10 transition-all disabled:opacity-50"
          >
            💾 Save Draft
          </button>
          <button
            onClick={handleSend}
            disabled={!recipient || !body}
            className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-robbie-accent to-pink-500 text-white font-semibold hover:shadow-lg hover:shadow-robbie-accent/50 transition-all disabled:opacity-50"
          >
            📤 Send Now
          </button>
        </div>
      </div>

      {/* Drafts Sidebar - Right 1/3 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-robbie-light">
          💾 Saved Drafts
        </h3>

        {drafts.loading ? (
          <div className="text-center py-8 text-robbie-light/60">
            Loading drafts...
          </div>
        ) : drafts.items.length === 0 ? (
          <div className="text-center py-8 text-robbie-light/60">
            No drafts yet
          </div>
        ) : (
          <div className="space-y-2">
            {drafts.items.map(draft => (
              <div
                key={draft.id}
                className="p-4 rounded-lg bg-robbie-darker/70 border border-robbie-accent/20 hover:border-robbie-accent/40 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="font-medium text-robbie-light text-sm">
                      To: {draft.recipient}
                    </div>
                    {draft.subject && (
                      <div className="text-xs text-robbie-light/60 mt-1">
                        {draft.subject}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteDraft(draft.id)}
                    className="text-red-400/60 hover:text-red-400"
                  >
                    ×
                  </button>
                </div>

                <div className="text-xs text-robbie-light/70 mb-3 line-clamp-2">
                  {draft.body}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-robbie-light/40">
                    {new Date(draft.updatedAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => handleLoadDraft(draft)}
                    className="text-xs px-3 py-1 rounded bg-robbie-accent/20 text-robbie-accent hover:bg-robbie-accent/30"
                  >
                    Load
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// AI Message Generation (simplified - would use real AI in production)
function generateMessage(recipient: string, subject: string, tone: MessageDraft['tone'], attraction: number): string {
  const templates = {
    casual: `Hey ${recipient}!\n\nHope you're doing well! Just wanted to touch base about ${subject || 'that thing we discussed'}.\n\nLet me know what you think!\n\nBest,`,
    formal: `Dear ${recipient},\n\nI hope this message finds you well. I am writing to follow up regarding ${subject || 'our recent conversation'}.\n\nI look forward to your response.\n\nSincerely,`,
    friendly: `Hi ${recipient}! 💜\n\nHope your day is going great! Wanted to reach out about ${subject || 'that opportunity we talked about'}.\n\nLooking forward to hearing from you!\n\nCheers,`,
    flirty: attraction >= 9 
      ? `Hey gorgeous ${recipient}! 😘\n\nI've been thinking about you... and ${subject || 'our last conversation'}. Can't wait to connect again!\n\nLet's make something happen! 🔥\n\nxoxo,`
      : `Hey ${recipient}! 😊\n\nJust wanted to reach out about ${subject || 'working together'}. I think we could create something amazing!\n\nLet me know what you think!\n\nWarmly,`,
    aggressive: `${recipient} -\n\nTime to move on ${subject || 'this opportunity'}. We need to make a decision NOW.\n\nLet's get this done.\n\nRegards,`,
  }

  return templates[tone] || templates.friendly
}

export default MessageComposer


