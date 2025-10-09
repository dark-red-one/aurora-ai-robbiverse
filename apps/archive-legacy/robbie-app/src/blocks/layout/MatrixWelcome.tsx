import { useRobbieStore } from "../../stores/robbieStore"

interface MatrixWelcomeProps {
  onComplete: () => void
}

const flyingEmojis = ['💜', '🚀', '✨', '💰', '🔥', '⚡', '🎯', '💪', '🎉', '💎']

const MatrixWelcome = ({ onComplete }: MatrixWelcomeProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [showText, setShowText] = useState(false)
  const [emojis, setEmojis] = useState<Array<{id: number, emoji: string, x: number, y: number, delay: number}>>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    // Matrix rain configuration
    const columns = Math.floor(canvas.width / 20)
    const drops: number[] = Array(columns).fill(1)
    const colors = ['#ff6b35', '#4ecdc4', '#ff6b9d', '#a855f7', '#06b6d4'] // Robbie's colors + purple/cyan
    
    const chars = 'ROBBIE01アイウエオカキクケコサシスセソタチツテト💜🚀✨'

    const draw = () => {
      // Fade effect for trailing
      ctx.fillStyle = 'rgba(10, 10, 24, 0.05)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.font = '16px Courier New'

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)]
        const color = colors[i % colors.length]
        const x = i * 20
        const y = drops[i] * 20

        // Add glow effect
        ctx.shadowBlur = 10
        ctx.shadowColor = color
        ctx.fillStyle = color
        ctx.fillText(text, x, y)

        // Reset drop randomly
        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0
        }
        drops[i]++
      }
    }

    const interval = setInterval(draw, 33) // ~30fps

    // Generate flying emojis
    const emojiArray = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      emoji: flyingEmojis[Math.floor(Math.random() * flyingEmojis.length)],
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2
    }))
    setEmojis(emojiArray)

    // Show welcome text after 0.5 seconds
    setTimeout(() => setShowText(true), 500)

    // Auto-complete after 4 seconds
    const timeout = setTimeout(onComplete, 4000)

    // Allow skip on any key or click
    const handleSkip = () => {
      clearTimeout(timeout)
      onComplete()
    }
    window.addEventListener('keydown', handleSkip)
    canvas.addEventListener('click', handleSkip)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
      window.removeEventListener('keydown', handleSkip)
      canvas.removeEventListener('click', handleSkip)
    }
  }, [onComplete])

  return (
    <div className="fixed inset-0 bg-robbie-bg-primary overflow-hidden cursor-pointer">
      <canvas ref={canvasRef} className="absolute inset-0" />
      
      {/* Flying Emojis */}
      <AnimatePresence>
        {emojis.map((item) => (
          <motion.div
            key={item.id}
            initial={{ 
              x: `${item.x}vw`, 
              y: '100vh',
              opacity: 0,
              scale: 0.5,
              rotate: 0
            }}
            animate={{ 
              x: `${item.x}vw`,
              y: '-20vh',
              opacity: [0, 1, 1, 0],
              scale: [0.5, 1.5, 1.5, 0.5],
              rotate: 360
            }}
            transition={{
              duration: 3,
              delay: item.delay,
              ease: 'easeInOut'
            }}
            className="absolute text-4xl pointer-events-none z-20"
            style={{ left: 0, top: 0 }}
          >
            {item.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
      
      {showText && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, type: 'spring' }}
          className="absolute inset-0 flex flex-col items-center justify-center z-10"
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-center"
          >
            {/* Main Title */}
            <motion.div
              animate={{ 
                scale: [1, 1.05, 1],
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              className="text-7xl font-bold mb-6 bg-gradient-to-r from-robbie-cyan via-robbie-pink to-robbie-teal bg-clip-text text-transparent drop-shadow-2xl"
            >
              aurora.testpilot.ai
            </motion.div>

            {/* Subtitle */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-2xl text-white mb-4 font-light"
            >
              Welcome back, gorgeous! 💜
            </motion.div>

            {/* Tagline */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="text-robbie-cyan text-sm opacity-70 mb-8"
            >
              Your AI-powered business empire awaits...
            </motion.div>

            {/* Skip hint */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ 
                delay: 1.2,
                duration: 2,
                repeat: Infinity
              }}
              className="text-gray-400 text-xs"
            >
              Click anywhere or press any key to continue
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

export default MatrixWelcome