import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { motion } from 'framer-motion'
import MatrixRain from '../../components/MatrixRain'
import Sidebar from '../../components/Sidebar'
import SyncIndicator from '../../components/SyncIndicator'
import MoodIndicator from '../personality/MoodIndicator'
import ChatInterface from '../communication/ChatInterface'
import StickyNotes from '../memory/StickyNotes'
import TaskBoard from '../productivity/TaskBoard'
import CommsCenter from '../communication/CommsCenter'
import MoneyDashboard from '../business/MoneyDashboard'
import SetupPanel from '../control/SetupPanel'
import { useSyncStore } from '../../stores/syncStore'
import { useRobbieStore } from '../../stores/robbieStore'

interface MainAppProps {
  user: any
  onLogout: () => void
}

type ActiveTab = 'chat' | 'notes' | 'tasks' | 'comms' | 'money' | 'setup'

const MainApp = ({ user, onLogout }: MainAppProps) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat')
  const { currentExpression, setExpression } = useRobbieStore()
  const { lastSync, syncStatus, pendingChanges } = useSyncStore()
  const [robbieExpression, setRobbieExpression] = useState(currentExpression)

  const renderContent = () => {
    switch (activeTab) {
      case 'chat':
        return <ChatInterface user={user} />
      case 'notes':
        return <StickyNotes user={user} />
      case 'tasks':
        return <TaskBoard user={user} />
      case 'comms':
        return <CommsCenter user={user} />
      case 'money':
        return <MoneyDashboard user={user} />
      case 'setup':
        return <SetupPanel user={user} onLogout={onLogout} />
      default:
        return <ChatInterface user={user} />
    }
  }

  return (
    <div className="flex h-screen bg-robbie-bg-primary overflow-hidden">
      <MatrixRain />
      
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        robbieExpression={robbieExpression}
        onExpressionChange={setRobbieExpression}
        user={user}
      />

      <main className="flex-1 relative">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="h-full"
        >
          {renderContent()}
        </motion.div>
      </main>
      
      {/* Universal mood indicator */}
      <MoodIndicator />
      
      {/* Sync status indicator */}
      <SyncIndicator 
        lastSync={lastSync} 
        status={syncStatus} 
        pendingChanges={pendingChanges} 
      />
    </div>
  )
}

export default MainApp
