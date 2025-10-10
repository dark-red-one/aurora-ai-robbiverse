/**
 * MemorySearch - Semantic Search with Vector Results
 * Find what you need, baby! 🔍💋
 */

import React, { useState } from 'react'
import { useCrud } from '../hooks/useCrud'

interface SearchResult {
  id: string
  content: string
  relevanceScore: number
  source: 'email' | 'slack' | 'meeting' | 'note' | 'doc'
  timestamp: string
  metadata?: {
    title?: string
    author?: string
    tags?: string[]
  }
}

interface SavedQuery {
  id: string
  query: string
  name: string
  createdAt: string
}

export const MemorySearch: React.FC = () => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)

  const savedQueries = useCrud<SavedQuery>({
    endpoint: 'memory/queries',
    autoLoad: true,
  })

  const handleSearch = async () => {
    if (!query.trim()) return

    setLoading(true)
    try {
      const response = await fetch(`/api/memory/search?q=${encodeURIComponent(query)}`)
      const data = await response.json()
      setResults(data.results || [])
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveQuery = async () => {
    if (!query.trim()) return

    await savedQueries.create({
      query,
      name: query.substring(0, 50),
      createdAt: new Date().toISOString(),
    })
  }

  const handleLoadQuery = (savedQuery: SavedQuery) => {
    setQuery(savedQuery.query)
    handleSearch()
  }

  const getSourceIcon = (source: SearchResult['source']) => {
    switch (source) {
      case 'email': return '📧'
      case 'slack': return '💬'
      case 'meeting': return '📅'
      case 'note': return '📝'
      case 'doc': return '📄'
      default: return '📌'
    }
  }

  const getRelevanceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-400'
    if (score >= 0.6) return 'text-yellow-400'
    return 'text-robbie-light/60'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-robbie-accent">
          🔍 Memory Search
        </h2>
        <p className="text-sm text-robbie-light/60">
          Semantic search across all your data, baby! 🧠
        </p>
      </div>

      {/* Search Bar */}
      <div className="flex gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search for anything..."
          className="flex-1 px-6 py-4 bg-robbie-darker/50 border border-robbie-accent/30 rounded-xl text-robbie-light placeholder:text-robbie-light/40 text-lg focus:border-robbie-accent focus:ring-2 focus:ring-robbie-accent/20"
        />
        <button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="px-8 py-4 rounded-xl bg-gradient-to-r from-robbie-accent to-pink-500 text-white font-semibold hover:shadow-lg hover:shadow-robbie-accent/50 transition-all disabled:opacity-50"
        >
          {loading ? '⏳ Searching...' : '🔍 Search'}
        </button>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleSaveQuery}
          disabled={!query.trim()}
          className="px-4 py-2 rounded-lg bg-robbie-darker/50 text-robbie-light/80 hover:bg-robbie-darker text-sm disabled:opacity-50"
        >
          💾 Save Query
        </button>
        <button
          onClick={() => setQuery('')}
          className="px-4 py-2 rounded-lg bg-robbie-darker/50 text-robbie-light/80 hover:bg-robbie-darker text-sm"
        >
          🗑️ Clear
        </button>
      </div>

      {/* Results */}
      <div className="grid grid-cols-3 gap-6">
        {/* Results List - Left 2/3 */}
        <div className="col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-robbie-light">
              Results {results.length > 0 && `(${results.length})`}
            </h3>
            {results.length > 0 && (
              <span className="text-xs text-robbie-light/60">
                Sorted by relevance
              </span>
            )}
          </div>

          {results.length === 0 ? (
            <div className="text-center py-12 text-robbie-light/60">
              {query ? 'No results found' : 'Enter a search query to find memories'}
            </div>
          ) : (
            <div className="space-y-3">
              {results.map(result => (
                <div
                  key={result.id}
                  className="p-4 rounded-lg bg-robbie-darker/70 border border-robbie-accent/20 hover:border-robbie-accent/40 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {/* Source Icon */}
                    <div className="text-2xl">{getSourceIcon(result.source)}</div>

                    {/* Content */}
                    <div className="flex-1">
                      {result.metadata?.title && (
                        <div className="font-semibold text-robbie-light mb-1">
                          {result.metadata.title}
                        </div>
                      )}
                      <div className="text-sm text-robbie-light/80 mb-2 line-clamp-3">
                        {result.content}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-robbie-light/60">
                        <span>{new Date(result.timestamp).toLocaleDateString()}</span>
                        {result.metadata?.author && <span>by {result.metadata.author}</span>}
                        <span className="capitalize">{result.source}</span>
                      </div>
                    </div>

                    {/* Relevance Score */}
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getRelevanceColor(result.relevanceScore)}`}>
                        {Math.round(result.relevanceScore * 100)}
                      </div>
                      <div className="text-xs text-robbie-light/40">
                        relevance
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Saved Queries - Right 1/3 */}
        <div className="space-y-4">
          <h3 className="font-semibold text-robbie-light">
            💾 Saved Queries
          </h3>

          {savedQueries.loading ? (
            <div className="text-center py-4 text-robbie-light/60">
              Loading...
            </div>
          ) : savedQueries.items.length === 0 ? (
            <div className="text-center py-4 text-xs text-robbie-light/60">
              No saved queries yet
            </div>
          ) : (
            <div className="space-y-2">
              {savedQueries.items.map(sq => (
                <div
                  key={sq.id}
                  className="p-3 rounded-lg bg-robbie-darker/70 border border-robbie-accent/20 hover:border-robbie-accent/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => handleLoadQuery(sq)}
                    >
                      <div className="text-sm text-robbie-light font-medium mb-1">
                        {sq.name}
                      </div>
                      <div className="text-xs text-robbie-light/60">
                        {new Date(sq.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      onClick={() => savedQueries.deleteItem(sq.id)}
                      className="text-red-400/60 hover:text-red-400 text-sm"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MemorySearch


