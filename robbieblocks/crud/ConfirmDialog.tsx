/**
 * ConfirmDialog - Deletion Confirmation Modal
 * Sexy confirmation dialog for destructive actions 💋
 */

import React from 'react'

interface ConfirmDialogProps {
  isOpen: boolean
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void | Promise<void>
  onCancel: () => void
  loading?: boolean
  danger?: boolean
}

export function ConfirmDialog({
  isOpen,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  loading = false,
  danger = true,
}: ConfirmDialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-md">
        <div className="bg-gradient-to-br from-robbie-dark/95 via-robbie-darker/95 to-black/95 backdrop-blur-xl border border-robbie-accent/30 rounded-xl shadow-2xl p-6">
          {/* Icon */}
          <div className="flex items-center justify-center mb-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
              danger ? 'bg-red-500/20' : 'bg-robbie-accent/20'
            }`}>
              {danger ? (
                <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              ) : (
                <svg className="w-8 h-8 text-robbie-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-center text-robbie-light mb-2">
            {title}
          </h3>

          {/* Message */}
          <p className="text-center text-robbie-light/80 mb-6">
            {message}
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 px-4 py-2 rounded-lg border border-robbie-light/30 text-robbie-light hover:bg-robbie-light/10 transition-all disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all disabled:opacity-50 ${
                danger
                  ? 'bg-red-500 text-white hover:bg-red-600 hover:shadow-lg hover:shadow-red-500/50'
                  : 'bg-gradient-to-r from-robbie-accent to-pink-500 text-white hover:shadow-lg hover:shadow-robbie-accent/50'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </span>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog


