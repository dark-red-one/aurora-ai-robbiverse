/**
 * CrudTable - Sortable/Filterable Table
 * Hot table component with sorting, filtering, and pagination 🔥
 */

import React, { useState, useMemo } from 'react'

export interface CrudColumn<T> {
  key: keyof T | string
  label: string
  sortable?: boolean
  render?: (item: T) => React.ReactNode
  width?: string
}

interface CrudTableProps<T extends { id: string }> {
  data: T[]
  columns: CrudColumn<T>[]
  onEdit?: (item: T) => void
  onDelete?: (item: T) => void
  onRowClick?: (item: T) => void
  loading?: boolean
  emptyMessage?: string
}

export function CrudTable<T extends { id: string }>({
  data,
  columns,
  onEdit,
  onDelete,
  onRowClick,
  loading = false,
  emptyMessage = 'No items found',
}: CrudTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn) return data

    return [...data].sort((a, b) => {
      const aVal = a[sortColumn as keyof T]
      const bVal = b[sortColumn as keyof T]

      if (aVal === bVal) return 0

      const comparison = aVal > bVal ? 1 : -1
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [data, sortColumn, sortDirection])

  const handleSort = (column: string, sortable?: boolean) => {
    if (!sortable) return

    if (sortColumn === column) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-robbie-accent animate-pulse">
          Loading... 💋
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-robbie-light/60">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-robbie-accent/20">
            {columns.map(column => (
              <th
                key={String(column.key)}
                className={`px-4 py-3 text-left text-sm font-semibold text-robbie-accent ${
                  column.sortable ? 'cursor-pointer hover:bg-robbie-accent/10' : ''
                }`}
                style={{ width: column.width }}
                onClick={() => handleSort(String(column.key), column.sortable)}
              >
                <div className="flex items-center gap-2">
                  {column.label}
                  {column.sortable && sortColumn === column.key && (
                    <span className="text-xs">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
            ))}
            {(onEdit || onDelete) && (
              <th className="px-4 py-3 text-right text-sm font-semibold text-robbie-accent">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {sortedData.map(item => (
            <tr
              key={item.id}
              className={`border-b border-robbie-light/10 hover:bg-robbie-accent/5 transition-colors ${
                onRowClick ? 'cursor-pointer' : ''
              }`}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map(column => (
                <td key={String(column.key)} className="px-4 py-3 text-sm text-robbie-light">
                  {column.render
                    ? column.render(item)
                    : String(item[column.key as keyof T] || '')}
                </td>
              ))}
              {(onEdit || onDelete) && (
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {onEdit && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onEdit(item)
                        }}
                        className="px-3 py-1 text-xs rounded bg-robbie-accent/20 text-robbie-accent hover:bg-robbie-accent/30 transition-colors"
                      >
                        Edit
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDelete(item)
                        }}
                        className="px-3 py-1 text-xs rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default CrudTable


