import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface SyncIndicatorProps {
  lastSync: Date | null
  status: 'idle' | 'syncing' | 'error'
  pendingChanges: number
}

const SyncIndicator = ({ lastSync, status, pendingChanges }: SyncIndicatorProps) => {
  const [showTooltip, setShowTooltip] = useState(false)

  const getStatusColor = () => {
    switch (status) {
      case 'syncing': return 'text-robbie-cyan'
      case 'error': return 'text-red-400'
      default: return 'text-robbie-green'
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'syncing': return '🔄'
      case 'error': return '⚠️'
      default: return '✅'
    }
  }

  const formatLastSync = () => {
    if (!lastSync) return 'Never'
    const seconds = Math.floor((Date.now() - lastSync.getTime()) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    return `${Math.floor(minutes / 60)}h ago`
  }

  return (
    <div 
      className="fixed bottom-4 right-4 z-50"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <motion.div
        className={`flex items-center gap-2 bg-robbie-bg-card border border-robbie-cyan/30 rounded-full px-4 py-2 ${getStatusColor()} cursor-pointer`}
        whileHover={{ scale: 1.05 }}
      >
        <span className="text-sm">{getStatusIcon()}</span>
        {pendingChanges > 0 && (
          <span className="bg-robbie-pink text-white text-xs font-bold px-2 py-0.5 rounded-full">
            {pendingChanges}
          </span>
        )}
      </motion.div>

      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full right-0 mb-2 bg-robbie-bg-secondary border border-robbie-cyan/30 rounded-lg px-3 py-2 text-xs text-white whitespace-nowrap shadow-lg"
          >
            <div>Status: <span className={getStatusColor()}>{status}</span></div>
            <div>Last sync: {formatLastSync()}</div>
            {pendingChanges > 0 && <div>Pending: {pendingChanges} changes</div>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default SyncIndicator
