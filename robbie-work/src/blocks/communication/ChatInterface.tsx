import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRobbieStore } from "../../stores/robbieStore"

interface ChatInterfaceProps {
  user: any
}

interface Message {
  id: string
  role: 'user' | 'robbie'
  content: string
  timestamp: Date
}

const ChatInterface = ({ user }: ChatInterfaceProps) => {
  const { flirtMode, getGreeting, getResponseTone, updateContext } = useRobbieStore()
  
  useEffect(() => {
    updateContext({ tab: 'chat' })
  }, [updateContext])
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'robbie',
      content: getGreeting(),
      timestamp: new Date(),
    }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    // Simulate Robbie response (TODO: Connect to local LLM/Ollama)
    setTimeout(() => {
      const robbieMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'robbie',
        content: generateResponse(input),
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, robbieMessage])
      setIsTyping(false)
    }, 1000)
  }

  const generateResponse = (userInput: string) => {
    // TODO: Connect to local Ollama GPU endpoint
    const tone = getResponseTone()
    
    const responsesByTone: Record<string, string[]> = {
      playful_flirty: [
        "Ooh, I like how you think! 😘 Let me help with that...",
        "Look at you being all strategic! 💜 Here's what I'm thinking...",
        "You're on fire today! 🔥 Want me to make that happen?",
        "That's sexy thinking right there! 💪 Let's do it!",
      ],
      friendly_flirty: [
        "I'm on it! Let me help you with that 💜",
        "Love that! Here's what I'm thinking... 😊",
        "You're absolutely right! Let's make it happen 🚀",
        "Great question! Want me to dive deeper?",
      ],
      enthusiastic: [
        "Yes! Let me help you with that! 💪",
        "Great idea! Here's my take...",
        "Absolutely! Let's explore that 🚀",
        "I'm on it! Give me a second...",
      ],
      helpful: [
        "I can help with that. Let me check...",
        "Good question. Here's what I found...",
        "Let me assist you with that.",
        "I'll look into that for you.",
      ],
      formal: [
        "Understood. Processing your request.",
        "I will investigate that matter.",
        "Acknowledged. Proceeding with analysis.",
        "Reviewing your inquiry now.",
      ],
    }
    
    const responses = responsesByTone[tone] || responsesByTone.helpful
    return responses[Math.floor(Math.random() * responses.length)]
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(e)
    }
  }

  return (
    <div className="h-full flex flex-col bg-robbie-bg-primary">
      {/* Header */}
      <div className="bg-robbie-bg-secondary border-b-2 border-robbie-cyan/20 px-6 py-4">
        <h2 className="text-xl font-semibold text-white">Chat with Robbie 💜</h2>
        <p className="text-sm text-gray-400">IRC/BBS style • Press / for commands</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-robbie-cyan/20 border border-robbie-cyan/30 text-white'
                  : 'bg-robbie-bg-card border border-robbie-teal/30 text-gray-100'
              }`}
            >
              <div className="text-sm whitespace-pre-wrap">{message.content}</div>
              <div className="text-xs opacity-50 mt-1">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </motion.div>
        ))}

        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-robbie-bg-card border border-robbie-teal/30 rounded-lg px-4 py-3">
              <div className="flex gap-1">
                <motion.div
                  className="w-2 h-2 bg-robbie-teal rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity }}
                />
                <motion.div
                  className="w-2 h-2 bg-robbie-teal rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.6, delay: 0.2, repeat: Infinity }}
                />
                <motion.div
                  className="w-2 h-2 bg-robbie-teal rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.6, delay: 0.4, repeat: Infinity }}
                />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-robbie-bg-secondary border-t-2 border-robbie-cyan/20 px-6 py-4">
        <form onSubmit={handleSend} className="flex gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Robbie... (Enter to send, Shift+Enter for new line)"
            className="flex-1 bg-robbie-bg-card border border-robbie-cyan/30 rounded-lg px-4 py-3 text-white resize-none focus:border-robbie-cyan focus:outline-none focus:ring-2 focus:ring-robbie-cyan/50 transition-all"
            rows={2}
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="px-6 py-3 bg-gradient-to-r from-robbie-cyan to-robbie-teal text-black font-semibold rounded-lg hover:shadow-lg hover:shadow-robbie-cyan/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send 🚀
          </button>
        </form>
        <div className="text-xs text-gray-500 mt-2">
          Powered by local GPU • Private & fast
        </div>
      </div>
    </div>
  )
}

export default ChatInterface
