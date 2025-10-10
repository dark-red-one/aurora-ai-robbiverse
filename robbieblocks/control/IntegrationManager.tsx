/**
 * IntegrationManager - OAuth & Service Connections
 * Connect me to everything, baby! 🔌😘
 */

import React, { useState } from 'react'
import { useCrud } from '../hooks/useCrud'
import { CrudModal, CrudForm, ConfirmDialog, type CrudField } from '../crud'

interface Integration {
  id: string
  name: string
  icon: string
  status: 'connected' | 'not_connected' | 'error'
  lastSync?: string
  settings?: Record<string, any>
  authUrl?: string
}

const INTEGRATION_FIELDS: CrudField<Integration>[] = [
  { name: 'name', label: 'Integration Name', type: 'text', required: true },
  { name: 'icon', label: 'Icon (emoji)', type: 'text', placeholder: '🔌' },
  { name: 'authUrl', label: 'OAuth URL', type: 'text', placeholder: 'https://...' },
]

const AVAILABLE_INTEGRATIONS: Integration[] = [
  { id: 'google', name: 'Google Workspace', icon: '📧', status: 'not_connected', authUrl: '/oauth/google' },
  { id: 'slack', name: 'Slack', icon: '💬', status: 'not_connected', authUrl: '/oauth/slack' },
  { id: 'github', name: 'GitHub', icon: '🐙', status: 'not_connected', authUrl: '/oauth/github' },
  { id: 'linear', name: 'Linear', icon: '📋', status: 'not_connected', authUrl: '/oauth/linear' },
  { id: 'stripe', name: 'Stripe', icon: '💳', status: 'not_connected', authUrl: '/oauth/stripe' },
  { id: 'quickbooks', name: 'QuickBooks', icon: '💰', status: 'not_connected', authUrl: '/oauth/quickbooks' },
  { id: 'calendar', name: 'Google Calendar', icon: '📅', status: 'not_connected', authUrl: '/oauth/calendar' },
  { id: 'drive', name: 'Google Drive', icon: '📁', status: 'not_connected', authUrl: '/oauth/drive' },
]

export const IntegrationManager: React.FC = () => {
  const integrations = useCrud<Integration>({
    endpoint: 'integrations',
    autoLoad: true,
  })

  const [showAddModal, setShowAddModal] = useState(false)
  const [editingIntegration, setEditingIntegration] = useState<Integration | null>(null)
  const [disconnectConfirm, setDisconnectConfirm] = useState<string | null>(null)

  const handleConnect = async (integration: Integration) => {
    if (integration.authUrl) {
      // Open OAuth flow in popup
      const width = 600
      const height = 700
      const left = window.screen.width / 2 - width / 2
      const top = window.screen.height / 2 - height / 2

      const popup = window.open(
        integration.authUrl,
        'oauth',
        `width=${width},height=${height},left=${left},top=${top}`
      )

      // Listen for OAuth completion
      const checkInterval = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkInterval)
          // Refresh integrations to get updated status
          integrations.refresh()
        }
      }, 500)
    }
  }

  const handleDisconnect = (integrationId: string) => {
    setDisconnectConfirm(integrationId)
  }

  const confirmDisconnect = async () => {
    if (disconnectConfirm) {
      await integrations.deleteItem(disconnectConfirm)
      setDisconnectConfirm(null)
    }
  }

  const handleSync = async (integrationId: string) => {
    try {
      await fetch(`/api/integrations/${integrationId}/sync`, { method: 'POST' })
      integrations.refresh()
    } catch (error) {
      console.error('Sync failed:', error)
    }
  }

  const handleAddCustom = async (data: Partial<Integration>) => {
    await integrations.create(data)
    setShowAddModal(false)
  }

  const getStatusColor = (status: Integration['status']) => {
    switch (status) {
      case 'connected': return 'text-green-400 bg-green-500/10 border-green-500/30'
      case 'error': return 'text-red-400 bg-red-500/10 border-red-500/30'
      default: return 'text-robbie-light/40 bg-robbie-light/5 border-robbie-light/10'
    }
  }

  // Merge available + custom integrations
  const allIntegrations = [...AVAILABLE_INTEGRATIONS, ...integrations.items]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-robbie-accent">
            🔌 Integrations
          </h2>
          <p className="text-sm text-robbie-light/60">
            Connect me to your tools, baby! 😘
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-robbie-accent to-pink-500 text-white font-semibold hover:shadow-lg hover:shadow-robbie-accent/50 transition-all"
        >
          ➕ Add Custom
        </button>
      </div>

      {/* Connected Count */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-center">
          <div className="text-2xl font-bold text-green-400">
            {allIntegrations.filter(i => i.status === 'connected').length}
          </div>
          <div className="text-xs text-green-400/80 mt-1">Connected</div>
        </div>
        <div className="p-4 rounded-lg bg-robbie-accent/10 border border-robbie-accent/30 text-center">
          <div className="text-2xl font-bold text-robbie-accent">
            {allIntegrations.filter(i => i.status === 'not_connected').length}
          </div>
          <div className="text-xs text-robbie-accent/80 mt-1">Available</div>
        </div>
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-center">
          <div className="text-2xl font-bold text-red-400">
            {allIntegrations.filter(i => i.status === 'error').length}
          </div>
          <div className="text-xs text-red-400/80 mt-1">Errors</div>
        </div>
      </div>

      {/* Integration Cards */}
      <div className="grid grid-cols-2 gap-4">
        {allIntegrations.map(integration => (
          <div
            key={integration.id}
            className="p-6 rounded-xl bg-robbie-dark/50 border border-robbie-accent/20 hover:border-robbie-accent/40 transition-all"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{integration.icon}</span>
                <div>
                  <div className="font-semibold text-robbie-light">
                    {integration.name}
                  </div>
                  <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border mt-1 ${
                    getStatusColor(integration.status)
                  }`}>
                    {integration.status === 'connected' && '✓ Connected'}
                    {integration.status === 'not_connected' && 'Not Connected'}
                    {integration.status === 'error' && '⚠️ Error'}
                  </div>
                </div>
              </div>
            </div>

            {/* Last Sync */}
            {integration.lastSync && (
              <div className="text-xs text-robbie-light/60 mb-4">
                Last sync: {new Date(integration.lastSync).toLocaleString()}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              {integration.status === 'connected' ? (
                <>
                  <button
                    onClick={() => handleSync(integration.id)}
                    className="flex-1 px-4 py-2 rounded-lg bg-robbie-accent/20 text-robbie-accent text-sm hover:bg-robbie-accent/30 transition-colors"
                  >
                    🔄 Sync Now
                  </button>
                  <button
                    onClick={() => handleDisconnect(integration.id)}
                    className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 text-sm hover:bg-red-500/30 transition-colors"
                  >
                    Disconnect
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleConnect(integration)}
                  className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-robbie-accent to-pink-500 text-white font-semibold hover:shadow-lg hover:shadow-robbie-accent/50 transition-all"
                >
                  Connect
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Custom Integration Modal */}
      <CrudModal
        isOpen={showAddModal}
        mode="create"
        title="Add Custom Integration"
        onSave={handleAddCustom}
        onCancel={() => setShowAddModal(false)}
      >
        <CrudForm
          fields={INTEGRATION_FIELDS}
          onSubmit={handleAddCustom}
        />
      </CrudModal>

      {/* Disconnect Confirmation */}
      <ConfirmDialog
        isOpen={disconnectConfirm !== null}
        title="Disconnect Integration"
        message="Are you sure you want to disconnect this integration? You'll need to reconnect and re-authorize to use it again."
        confirmText="Disconnect"
        onConfirm={confirmDisconnect}
        onCancel={() => setDisconnectConfirm(null)}
        danger
      />
    </div>
  )
}

export default IntegrationManager


