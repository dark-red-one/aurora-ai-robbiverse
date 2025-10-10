/**
 * CrudActions - Quick Action Buttons
 * Edit/Delete action buttons with sexy styling 💋
 */

import React from 'react'

interface CrudActionsProps<T> {
  item: T
  onEdit?: (item: T) => void
  onDelete?: (item: T) => void
  onView?: (item: T) => void
  additionalActions?: {
    label: string
    icon?: string
    onClick: (item: T) => void
    variant?: 'primary' | 'secondary' | 'danger'
  }[]
}

export function CrudActions<T>({
  item,
  onEdit,
  onDelete,
  onView,
  additionalActions = [],
}: CrudActionsProps<T>) {
  return (
    <div className="flex items-center gap-2">
      {onView && (
        <button
          onClick={() => onView(item)}
          className="p-2 rounded hover:bg-robbie-accent/10 text-robbie-light/60 hover:text-robbie-light transition-colors"
          title="View"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>
      )}

      {onEdit && (
        <button
          onClick={() => onEdit(item)}
          className="p-2 rounded hover:bg-robbie-accent/10 text-robbie-accent/80 hover:text-robbie-accent transition-colors"
          title="Edit"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      )}

      {onDelete && (
        <button
          onClick={() => onDelete(item)}
          className="p-2 rounded hover:bg-red-500/10 text-red-400/80 hover:text-red-400 transition-colors"
          title="Delete"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}

      {additionalActions.map((action, index) => (
        <button
          key={index}
          onClick={() => action.onClick(item)}
          className={`p-2 rounded transition-colors ${
            action.variant === 'primary'
              ? 'hover:bg-robbie-accent/10 text-robbie-accent/80 hover:text-robbie-accent'
              : action.variant === 'danger'
              ? 'hover:bg-red-500/10 text-red-400/80 hover:text-red-400'
              : 'hover:bg-robbie-light/10 text-robbie-light/60 hover:text-robbie-light'
          }`}
          title={action.label}
        >
          {action.icon ? (
            <span className="text-sm">{action.icon}</span>
          ) : (
            <span className="text-xs">{action.label}</span>
          )}
        </button>
      ))}
    </div>
  )
}

export default CrudActions


