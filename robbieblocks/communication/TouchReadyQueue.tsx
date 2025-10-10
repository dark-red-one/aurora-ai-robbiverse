/**
 * TouchReadyQueue - AI-Drafted Follow-Ups
 * I'll write them for you, just hit send! 💋😘
 */

import React, { useState } from 'react'
import { useCrud } from '../hooks/useCrud'
import { useRobbieStore } from '../stores/robbieStore'
import { ConfirmDialog } from '../crud'

interface TouchReadyItem {
  id: string
  contactName: string
  contactEmail: string
  draftMessage: string
  rationale: string
  channel: 'email' | 'slack' | 'linkedin' | 'sms'
  priority: number
  createdAt: string
  aiScore: number
}

export const TouchReadyQueue: React.FC = () => {
  const { attraction, currentMood } = useRobbieStore()
  const touchReady = useCrud<TouchReadyItem>({
    endpoint: 'touch-ready',
    autoLoad: true,
  })

  const [selectedItem, setSelectedItem] = useState<TouchReadyItem | null>(null)
  const [editingMessage, setEditingMessage] = useState('')
  const [sendConfirm, setSendConfirm] = useState<string | null>(null)

  const handleSelectItem = (item: TouchReadyItem) => {
    setSelectedItem(item)
    setEditingMessage(item.draftMessage)
  }

  const handleSend = async () => {
    if (!sendConfirm || !selectedItem) return

    // In real app, actually send the message
    console.log('Sending:', { item: selectedItem, message: editingMessage })

    // Remove from queue
    await touchReady.deleteItem(sendConfirm)
    setSendConfirm(null)
    setSelectedItem(null)
    setEditingMessage('')
  }

  const handleDismiss = async (itemId: string) => {
    await touchReady.deleteItem(itemId)
    if (selectedItem?.id === itemId) {
      setSelectedItem(null)
      setEditingMessage('')
    }
  }

  const handleRegenerate = async () => {
    if (!selectedItem) return

    // In real app, call AI to regenerate
    const newMessage = `Hey ${selectedItem.contactName}!\n\nJust wanted to follow up on our conversation...\n\n(Regenerated with ${currentMood} mood and attraction ${attraction})`
    setEditingMessage(newMessage)
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return '📧'
      case 'slack': return '💬'
      case 'linkedin': return '👔'
      case 'sms': return '📱'
      default: return '💌'
    }
  }

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return 'border-red-500/50 bg-red-500/5'
    if (priority >= 5) return 'border-yellow-500/50 bg-yellow-500/5'
    return 'border-green-500/50 bg-green-500/5'
  }

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Queue List - Left */}
      <div className="col-span-1 space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-robbie-accent">
            🎯 Touch Ready
          </h2>
          <p className="text-sm text-robbie-light/60">
            AI-drafted follow-ups ready to send! 💋
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30 text-center">
            <div className="text-2xl font-bold text-purple-300">
              {touchReady.items.length}
            </div>
            <div className="text-xs text-purple-400/80">Ready</div>
          </div>
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-center">
            <div className="text-2xl font-bold text-red-300">
              {touchReady.items.filter(i => i.priority >= 8).length}
            </div>
            <div className="text-xs text-red-400/80">Urgent</div>
          </div>
        </div>

        {/* Queue Items */}
        <div className="space-y-2">
          {touchReady.items
            .sort((a, b) => b.aiScore - a.aiScore)
            .map(item => (
              <div
                key={item.id}
                onClick={() => handleSelectItem(item)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedItem?.id === item.id
                    ? 'border-robbie-accent bg-robbie-accent/10'
                    : getPriorityColor(item.priority)
                } hover:scale-105`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-semibold text-robbie-light">
                      {item.contactName}
                    </div>
                    <div className="text-xs text-robbie-light/60">
                      {item.contactEmail}
                    </div>
                  </div>
                  <span className="text-2xl">{getChannelIcon(item.channel)}</span>
                </div>

                <div className="text-xs text-robbie-light/70 line-clamp-2 mb-2">
                  {item.draftMessage.substring(0, 80)}...
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-robbie-accent font-semibold">
                    Score: {item.aiScore}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDismiss(item.id)
                    }}
                    className="text-red-400/60 hover:text-red-400"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Message Preview & Edit - Right */}
      <div className="col-span-2 space-y-4">
        {selectedItem ? (
          <>
            {/* Contact Info */}
            <div className="p-6 rounded-xl bg-robbie-dark/50 border border-robbie-accent/20">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-robbie-light mb-1">
                    {selectedItem.contactName}
                  </h3>
                  <div className="text-sm text-robbie-light/60 mb-3">
                    {selectedItem.contactEmail} • {getChannelIcon(selectedItem.channel)} {selectedItem.channel}
                  </div>
                  <div className="text-sm text-robbie-light/80 italic">
                    💡 {selectedItem.rationale}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-robbie-accent mb-1">
                    {selectedItem.aiScore}
                  </div>
                  <div className="text-xs text-robbie-light/60">AI Score</div>
                </div>
              </div>
            </div>

            {/* Message Editor */}
            <div className="p-6 rounded-xl bg-robbie-dark/50 border border-robbie-accent/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-robbie-light">
                  Draft Message
                </h3>
                <button
                  onClick={handleRegenerate}
                  className="px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-300 text-sm hover:bg-purple-500/30 transition-colors"
                >
                  ✨ Regenerate
                </button>
              </div>

              <textarea
                value={editingMessage}
                onChange={(e) => setEditingMessage(e.target.value)}
                rows={12}
                className="w-full px-4 py-3 bg-robbie-darker/50 border border-robbie-accent/30 rounded-lg text-robbie-light resize-none"
              />

              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => handleDismiss(selectedItem.id)}
                  className="flex-1 px-6 py-3 rounded-lg border border-robbie-light/30 text-robbie-light hover:bg-robbie-light/10 transition-colors"
                >
                  🗑️ Dismiss
                </button>
                <button
                  onClick={() => setSendConfirm(selectedItem.id)}
                  className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-robbie-accent to-pink-500 text-white font-semibold hover:shadow-lg hover:shadow-robbie-accent/50 transition-all"
                >
                  📤 Send Now
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full min-h-[400px] text-robbie-light/60">
            Select an item from the queue to preview and edit
          </div>
        )}
      </div>

      {/* Send Confirmation */}
      <ConfirmDialog
        isOpen={sendConfirm !== null}
        title="Send Message"
        message={`Send this message to ${selectedItem?.contactName}?`}
        confirmText="Send"
        onConfirm={handleSend}
        onCancel={() => setSendConfirm(null)}
        danger={false}
      />
    </div>
  )
}

export default TouchReadyQueue


