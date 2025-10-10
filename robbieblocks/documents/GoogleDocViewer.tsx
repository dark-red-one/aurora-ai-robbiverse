/**
 * GoogleDocViewer - Embedded Google Docs Viewer
 * Watch your docs load, baby! 📄💋
 */

import React, { useState } from 'react'

interface GoogleDocViewerProps {
  docId?: string
  docUrl?: string
  title?: string
  mode?: 'embed' | 'fullscreen'
  onClose?: () => void
}

export const GoogleDocViewer: React.FC<GoogleDocViewerProps> = ({
  docId,
  docUrl,
  title = 'Document',
  mode = 'embed',
  onClose,
}) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Construct iframe URL
  const getIframeUrl = () => {
    if (docUrl) return docUrl
    if (docId) return `https://docs.google.com/document/d/${docId}/preview`
    return null
  }

  const iframeUrl = getIframeUrl()

  const handleLoad = () => {
    setLoading(false)
    setError(null)
  }

  const handleError = () => {
    setLoading(false)
    setError('Failed to load document. Check permissions.')
  }

  const handleOpenInNewTab = () => {
    if (iframeUrl) {
      window.open(iframeUrl.replace('/preview', '/edit'), '_blank')
    }
  }

  if (!iframeUrl) {
    return (
      <div className="flex items-center justify-center p-12 bg-robbie-darker/50 rounded-xl border border-robbie-accent/20">
        <div className="text-center text-robbie-light/60">
          No document specified
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${mode === 'fullscreen' ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-robbie-darker/90 backdrop-blur-md border-b border-robbie-accent/20">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📄</span>
          <div>
            <div className="font-semibold text-robbie-light">{title}</div>
            <div className="text-xs text-robbie-light/60">Google Docs</div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleOpenInNewTab}
            className="px-3 py-1.5 rounded-lg bg-robbie-accent/20 text-robbie-accent text-sm hover:bg-robbie-accent/30 transition-colors"
            title="Open in new tab"
          >
            ↗️
          </button>
          {mode === 'fullscreen' && onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-robbie-light/10 text-robbie-light text-sm hover:bg-robbie-light/20 transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Document Iframe */}
      <div className={`relative bg-robbie-dark ${
        mode === 'fullscreen' ? 'h-[calc(100vh-64px)]' : 'h-[600px]'
      }`}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-robbie-darker/90 backdrop-blur-sm">
            <div className="text-center">
              <div className="mb-4">
                <div className="w-16 h-16 border-4 border-robbie-accent/20 border-t-robbie-accent rounded-full animate-spin mx-auto" />
              </div>
              <div className="text-robbie-light/80">
                Loading document... 💋
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-robbie-darker/90">
            <div className="text-center p-8">
              <div className="text-4xl mb-4">⚠️</div>
              <div className="text-robbie-light mb-2">{error}</div>
              <button
                onClick={handleOpenInNewTab}
                className="mt-4 px-4 py-2 rounded-lg bg-robbie-accent/20 text-robbie-accent hover:bg-robbie-accent/30"
              >
                Open in Google Docs
              </button>
            </div>
          </div>
        )}

        <iframe
          src={iframeUrl}
          className="w-full h-full"
          onLoad={handleLoad}
          onError={handleError}
          title={title}
        />
      </div>
    </div>
  )
}

export default GoogleDocViewer


