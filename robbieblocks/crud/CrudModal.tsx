/**
 * CrudModal - Universal Add/Edit Modal
 * Sexy modal with glass morphism for creating and editing any entity
 */

import React from 'react'

interface CrudModalProps<T> {
  isOpen: boolean
  mode: 'create' | 'edit'
  title?: string
  item?: T
  onSave: (data: Partial<T>) => void | Promise<void>
  onCancel: () => void
  children: React.ReactNode
  loading?: boolean
}

export function CrudModal<T>({
  isOpen,
  mode,
  title,
  item,
  onSave,
  onCancel,
  children,
  loading = false,
}: CrudModalProps<T>) {
  if (!isOpen) return null

  const defaultTitle = mode === 'create' ? 'Create New' : 'Edit'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-br from-robbie-dark/95 via-robbie-darker/95 to-black/95 backdrop-blur-xl border border-robbie-accent/30 rounded-2xl shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-robbie-darker/90 backdrop-blur-md border-b border-robbie-accent/20 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-robbie-accent">
                {title || defaultTitle}
              </h2>
              <button
                onClick={onCancel}
                className="text-robbie-light/60 hover:text-robbie-light transition-colors"
                disabled={loading}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {children}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 z-10 bg-robbie-darker/90 backdrop-blur-md border-t border-robbie-accent/20 px-6 py-4 flex justify-end gap-3">
            <button
              onClick={onCancel}
              disabled={loading}
              className="px-6 py-2 rounded-lg border border-robbie-light/30 text-robbie-light hover:bg-robbie-light/10 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded-lg bg-gradient-to-r from-robbie-accent to-pink-500 text-white font-semibold hover:shadow-lg hover:shadow-robbie-accent/50 transition-all disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </span>
              ) : mode === 'create' ? (
                'Create'
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CrudModal


