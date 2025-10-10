/**
 * PipelineView - Drag-Drop Deal Pipeline
 * Watch those deals MOVE through the stages, baby! 💰😘
 */

import React, { useState } from 'react'
import { useCrud } from '../hooks/useCrud'
import { CrudModal, CrudForm, ConfirmDialog, type CrudField } from '../crud'

interface Deal {
  id: string
  name: string
  company: string
  value: number
  stage: 'awareness' | 'engage' | 'qualify' | 'propose' | 'close'
  healthStatus: 'good' | 'watch' | 'risk'
  owner: string
  lastActivity: string
  notes?: string
}

const DEAL_FIELDS: CrudField<Deal>[] = [
  { name: 'name', label: 'Deal Name', type: 'text', required: true, placeholder: 'e.g., Enterprise Contract' },
  { name: 'company', label: 'Company', type: 'text', required: true },
  { name: 'value', label: 'Deal Value ($)', type: 'number', required: true },
  { name: 'stage', label: 'Stage', type: 'select', required: true, options: [
    { value: 'awareness', label: '🔍 Awareness' },
    { value: 'engage', label: '💬 Engage' },
    { value: 'qualify', label: '✅ Qualify' },
    { value: 'propose', label: '📄 Propose' },
    { value: 'close', label: '💰 Close' },
  ]},
  { name: 'healthStatus', label: 'Health', type: 'select', required: true, options: [
    { value: 'good', label: '✅ Good' },
    { value: 'watch', label: '⚠️ Watch' },
    { value: 'risk', label: '🔴 Risk' },
  ]},
  { name: 'owner', label: 'Owner', type: 'text', required: true },
  { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Internal notes...' },
]

const STAGES = [
  { id: 'awareness', label: '🔍 Awareness', color: '#6b7280' },
  { id: 'engage', label: '💬 Engage', color: '#3b82f6' },
  { id: 'qualify', label: '✅ Qualify', color: '#8b5cf6' },
  { id: 'propose', label: '📄 Propose', color: '#ec4899' },
  { id: 'close', label: '💰 Close', color: '#10b981' },
] as const

export const PipelineView: React.FC = () => {
  const deals = useCrud<Deal>({
    endpoint: 'deals',
    autoLoad: true,
  })

  const [showModal, setShowModal] = useState(false)
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [draggedDeal, setDraggedDeal] = useState<string | null>(null)

  const handleCreate = () => {
    setEditingDeal(null)
    setShowModal(true)
  }

  const handleEdit = (deal: Deal) => {
    setEditingDeal(deal)
    setShowModal(true)
  }

  const handleDelete = (deal: Deal) => {
    setDeleteConfirm(deal.id)
  }

  const confirmDelete = async () => {
    if (deleteConfirm) {
      await deals.deleteItem(deleteConfirm)
      setDeleteConfirm(null)
    }
  }

  const handleSubmit = async (data: Partial<Deal>) => {
    if (editingDeal) {
      await deals.update(editingDeal.id, data)
    } else {
      await deals.create(data)
    }
    setShowModal(false)
  }

  const handleDragStart = (dealId: string) => {
    setDraggedDeal(dealId)
  }

  const handleDrop = async (stage: string) => {
    if (!draggedDeal) return

    const deal = deals.items.find(d => d.id === draggedDeal)
    if (!deal) return

    await deals.update(deal.id, { stage: stage as Deal['stage'] })
    setDraggedDeal(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const getDealsByStage = (stage: string) => {
    return deals.items.filter(deal => deal.stage === stage)
  }

  const getStageTotal = (stage: string) => {
    return getDealsByStage(stage).reduce((sum, deal) => sum + deal.value, 0)
  }

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'good': return 'border-green-500/50 bg-green-500/5'
      case 'watch': return 'border-yellow-500/50 bg-yellow-500/5'
      case 'risk': return 'border-red-500/50 bg-red-500/5'
      default: return 'border-robbie-accent/50'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-robbie-accent">
            💼 Deal Pipeline
          </h2>
          <p className="text-sm text-robbie-light/60">
            Drag deals between stages, baby! 😏
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="px-6 py-2 rounded-lg bg-gradient-to-r from-robbie-accent to-pink-500 text-white font-semibold hover:shadow-lg hover:shadow-robbie-accent/50 transition-all"
        >
          ➕ New Deal
        </button>
      </div>

      {/* Pipeline Stages */}
      <div className="grid grid-cols-5 gap-4">
        {STAGES.map(stage => {
          const stageDeals = getDealsByStage(stage.id)
          const stageTotal = getStageTotal(stage.id)

          return (
            <div
              key={stage.id}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(stage.id)}
              className="space-y-3"
            >
              {/* Stage Header */}
              <div className="p-4 rounded-lg bg-robbie-darker border border-robbie-accent/20">
                <div className="font-semibold text-robbie-light mb-1">
                  {stage.label}
                </div>
                <div className="text-xs text-robbie-light/60">
                  {stageDeals.length} deals
                </div>
                <div className="text-sm font-bold text-robbie-accent mt-2">
                  {formatCurrency(stageTotal)}
                </div>
              </div>

              {/* Deal Cards */}
              <div className="space-y-2 min-h-[400px]">
                {stageDeals.map(deal => (
                  <div
                    key={deal.id}
                    draggable
                    onDragStart={() => handleDragStart(deal.id)}
                    className={`p-4 rounded-lg border-2 cursor-move transition-all hover:scale-105 ${getHealthColor(deal.healthStatus)}`}
                  >
                    <div className="font-semibold text-robbie-light mb-1">
                      {deal.name}
                    </div>
                    <div className="text-xs text-robbie-light/60 mb-2">
                      {deal.company}
                    </div>
                    <div className="text-lg font-bold text-robbie-accent mb-2">
                      {formatCurrency(deal.value)}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-robbie-light/40">{deal.owner}</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEdit(deal)}
                          className="px-2 py-1 rounded bg-robbie-accent/20 text-robbie-accent hover:bg-robbie-accent/30"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(deal)}
                          className="px-2 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Create/Edit Modal */}
      <CrudModal
        isOpen={showModal}
        mode={editingDeal ? 'edit' : 'create'}
        title={editingDeal ? `Edit ${editingDeal.name}` : 'New Deal'}
        onSave={handleSubmit}
        onCancel={() => setShowModal(false)}
        loading={deals.loading}
      >
        <CrudForm
          fields={DEAL_FIELDS}
          initialData={editingDeal || {}}
          onSubmit={handleSubmit}
          loading={deals.loading}
        />
      </CrudModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        title="Delete Deal"
        message="Are you sure you want to delete this deal? This will remove it from your pipeline."
        confirmText="Delete Deal"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
        loading={deals.loading}
        danger
      />
    </div>
  )
}

export default PipelineView


