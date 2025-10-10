/**
 * GoogleDocBrowser - Browse Google Drive
 * Search and find your docs, baby! 📁😘
 */

import React, { useState, useMemo } from 'react'
import { useCrud } from '../hooks/useCrud'
import { CrudTable, type CrudColumn } from '../crud'

interface GoogleDocument {
  id: string
  title: string
  url: string
  type: 'doc' | 'sheet' | 'slide' | 'folder'
  owner: string
  lastModified: string
  shared: boolean
  viewers?: string[]
  editors?: string[]
  size?: number
}

const DOC_COLUMNS: CrudColumn<GoogleDocument>[] = [
  {
    key: 'type',
    label: 'Type',
    width: '60px',
    render: (doc) => (
      <span className="text-2xl">
        {doc.type === 'doc' ? '📄' :
         doc.type === 'sheet' ? '📊' :
         doc.type === 'slide' ? '📽️' :
         '📁'}
      </span>
    ),
  },
  { key: 'title', label: 'Name', sortable: true },
  { key: 'owner', label: 'Owner', sortable: true, width: '150px' },
  {
    key: 'lastModified',
    label: 'Modified',
    sortable: true,
    width: '120px',
    render: (doc) => (
      <span className="text-xs text-robbie-light/60">
        {new Date(doc.lastModified).toLocaleDateString()}
      </span>
    ),
  },
  {
    key: 'shared',
    label: 'Shared',
    width: '80px',
    render: (doc) => (
      doc.shared ? (
        <div className="flex items-center gap-1">
          <span className="text-green-400">👥</span>
          {doc.viewers && doc.viewers.length > 0 && (
            <span className="text-xs text-green-400">{doc.viewers.length}</span>
          )}
        </div>
      ) : (
        <span className="text-robbie-light/40">-</span>
      )
    ),
  },
]

interface GoogleDocBrowserProps {
  onSelectDoc?: (doc: GoogleDocument) => void
  onCreateDoc?: (type: GoogleDocument['type']) => void
}

export const GoogleDocBrowser: React.FC<GoogleDocBrowserProps> = ({
  onSelectDoc,
  onCreateDoc,
}) => {
  const documents = useCrud<GoogleDocument>({
    endpoint: 'google/docs',
    autoLoad: true,
  })

  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | GoogleDocument['type']>('all')
  const [sortBy, setSortBy] = useState<'name' | 'date'>('date')

  // Filter and search
  const filteredDocs = useMemo(() => {
    let result = documents.items

    // Filter by type
    if (filterType !== 'all') {
      result = result.filter(doc => doc.type === filterType)
    }

    // Search
    if (searchQuery) {
      result = result.filter(doc =>
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.owner.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'name') {
        return a.title.localeCompare(b.title)
      } else {
        return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
      }
    })

    return result
  }, [documents.items, filterType, searchQuery, sortBy])

  const handleCreateDoc = (type: GoogleDocument['type']) => {
    if (onCreateDoc) {
      onCreateDoc(type)
    }
  }

  const handleDeleteDoc = async (doc: GoogleDocument) => {
    // In real app, this would move to trash
    await documents.deleteItem(doc.id)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-robbie-accent">
            📁 Google Drive
          </h2>
          <p className="text-sm text-robbie-light/60">
            Browse your docs, baby! 😘
          </p>
        </div>
        
        {/* Create Menu */}
        <div className="flex gap-2">
          <button
            onClick={() => handleCreateDoc('doc')}
            className="px-4 py-2 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-colors text-sm"
          >
            📄 Doc
          </button>
          <button
            onClick={() => handleCreateDoc('sheet')}
            className="px-4 py-2 rounded-lg bg-green-500/20 text-green-300 hover:bg-green-500/30 transition-colors text-sm"
          >
            📊 Sheet
          </button>
          <button
            onClick={() => handleCreateDoc('slide')}
            className="px-4 py-2 rounded-lg bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 transition-colors text-sm"
          >
            📽️ Slides
          </button>
          <button
            onClick={() => handleCreateDoc('folder')}
            className="px-4 py-2 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors text-sm"
          >
            📁 Folder
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex gap-4">
        {/* Search */}
        <div className="flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents..."
            className="w-full px-4 py-2 bg-robbie-darker/50 border border-robbie-accent/30 rounded-lg text-robbie-light placeholder:text-robbie-light/40"
          />
        </div>

        {/* Type Filter */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as any)}
          className="px-4 py-2 bg-robbie-darker/50 border border-robbie-accent/30 rounded-lg text-robbie-light"
        >
          <option value="all">All Types</option>
          <option value="doc">📄 Docs</option>
          <option value="sheet">📊 Sheets</option>
          <option value="slide">📽️ Slides</option>
          <option value="folder">📁 Folders</option>
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-4 py-2 bg-robbie-darker/50 border border-robbie-accent/30 rounded-lg text-robbie-light"
        >
          <option value="date">Date Modified</option>
          <option value="name">Name</option>
        </select>
      </div>

      {/* Documents Table */}
      <div className="bg-robbie-dark/50 rounded-xl border border-robbie-accent/20 p-6">
        <CrudTable
          data={filteredDocs}
          columns={DOC_COLUMNS}
          onRowClick={onSelectDoc}
          onDelete={handleDeleteDoc}
          loading={documents.loading}
          emptyMessage={searchQuery ? 'No documents found matching your search' : 'No documents in your Drive'}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-robbie-darker/50 border border-robbie-accent/20 text-center">
          <div className="text-2xl font-bold text-blue-400">
            {documents.items.filter(d => d.type === 'doc').length}
          </div>
          <div className="text-xs text-robbie-light/60 mt-1">Docs</div>
        </div>
        <div className="p-4 rounded-lg bg-robbie-darker/50 border border-robbie-accent/20 text-center">
          <div className="text-2xl font-bold text-green-400">
            {documents.items.filter(d => d.type === 'sheet').length}
          </div>
          <div className="text-xs text-robbie-light/60 mt-1">Sheets</div>
        </div>
        <div className="p-4 rounded-lg bg-robbie-darker/50 border border-robbie-accent/20 text-center">
          <div className="text-2xl font-bold text-yellow-400">
            {documents.items.filter(d => d.type === 'slide').length}
          </div>
          <div className="text-xs text-robbie-light/60 mt-1">Slides</div>
        </div>
        <div className="p-4 rounded-lg bg-robbie-darker/50 border border-robbie-accent/20 text-center">
          <div className="text-2xl font-bold text-purple-400">
            {documents.items.filter(d => d.shared).length}
          </div>
          <div className="text-xs text-robbie-light/60 mt-1">Shared</div>
        </div>
      </div>
    </div>
  )
}

export default GoogleDocBrowser


