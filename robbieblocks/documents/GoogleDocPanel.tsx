/**
 * GoogleDocPanel - Side Panel Document Preview
 * Quick peek without leaving, baby! 😘
 */

import React, { useState } from 'react'
import GoogleDocViewer from './GoogleDocViewer'

interface GoogleDoc {
  id: string
  title: string
  url: string
  type: 'doc' | 'sheet' | 'slide'
  lastModified: string
}

interface GoogleDocPanelProps {
  isOpen: boolean
  onClose: () => void
  initialDoc?: GoogleDoc
}

export const GoogleDocPanel: React.FC<GoogleDocPanelProps> = ({
  isOpen,
  onClose,
  initialDoc,
}) => {
  const [currentDoc, setCurrentDoc] = useState<GoogleDoc | null>(initialDoc || null)
  const [width, setWidth] = useState(400)
  const [isResizing, setIsResizing] = useState(false)

  const handleMouseDown = () => {
    setIsResizing(true)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return
    const newWidth = window.innerWidth - e.clientX
    setWidth(Math.max(300, Math.min(800, newWidth)))
  }

  const handleMouseUp = () => {
    setIsResizing(false)
  }

  React.useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove as any)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove as any)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isResizing])

  if (!isOpen) return null

  return (
    <div
      className="fixed top-0 right-0 bottom-0 bg-robbie-dark/95 backdrop-blur-xl border-l border-robbie-accent/30 shadow-2xl z-40"
      style={{ width: `${width}px` }}
    >
      {/* Resize Handle */}
      <div
        className="absolute top-0 left-0 w-1 h-full cursor-ew-resize hover:bg-robbie-accent/50 transition-colors"
        onMouseDown={handleMouseDown}
      />

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-robbie-accent/20">
        <div className="flex items-center gap-2">
          <span className="text-xl">📄</span>
          <h3 className="font-semibold text-robbie-light">Document Preview</h3>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-robbie-light/10 text-robbie-light transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="h-[calc(100vh-64px)]">
        {currentDoc ? (
          <GoogleDocViewer
            docUrl={currentDoc.url}
            title={currentDoc.title}
            mode="embed"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-robbie-light/60">
            No document selected
          </div>
        )}
      </div>
    </div>
  )
}

export default GoogleDocPanel


