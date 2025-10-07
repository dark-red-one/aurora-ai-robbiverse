import { useState } from 'react'
import { motion } from 'framer-motion'
import MatrixRain from '../components/MatrixRain'
import Sidebar from '../components/Sidebar'
import ChatInterface from './ChatInterface'
import StickyNotes from './StickyNotes'
import TaskBoard from './TaskBoard'
import CommsCenter from './CommsCenter'
import MoneyDashboard from './MoneyDashboard'
import SetupPanel from './SetupPanel'

interface MainAppProps {
  user: any
  onLogout: () => void
}

type ActiveTab = 'chat' | 'notes' | 'tasks' | 'comms' | 'money' | 'setup'

const MainApp = ({ user, onLogout }: MainAppProps) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat')
  const [robbieExpression, setRobbieExpression] = useState('friendly')

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
    </div>
  )
}

export default MainApp
