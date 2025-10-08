import { useRobbieStore } from "../../stores/robbieStore"
import { useRobbieStore } from "../../stores/robbieStore"

interface MatrixWelcomeProps {
  onComplete: () => void
}

const MatrixWelcome = ({ onComplete }: MatrixWelcomeProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [showText, setShowText] = useState(false)

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
    const colors = ['#ff6b35', '#4ecdc4', '#ff6b9d'] // Robbie's colors
    
    const chars = 'ROBBIE01アイウエオカキクケコサシスセソタチツテト'

    const draw = () => {
      // Fade effect
      ctx.fillStyle = 'rgba(10, 10, 24, 0.05)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.font = '16px Courier New'

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)]
        const color = colors[i % colors.length]
        const x = i * 20
        const y = drops[i] * 20

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

    // Show welcome text after 1 second
    setTimeout(() => setShowText(true), 1000)

    // Auto-complete after 3 seconds
    const timeout = setTimeout(onComplete, 3000)

    // Allow skip on any key
    const handleKeyPress = () => {
      clearTimeout(timeout)
      onComplete()
    }
    window.addEventListener('keydown', handleKeyPress)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [onComplete])

  return (
    <div className="fixed inset-0 bg-robbie-bg-primary overflow-hidden cursor-pointer" onClick={onComplete}>
      <canvas ref={canvasRef} className="absolute inset-0" />
      
      {showText && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 flex flex-col items-center justify-center z-10"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <div className="text-6xl font-bold mb-4 bg-gradient-to-r from-robbie-cyan via-robbie-pink to-robbie-teal bg-clip-text text-transparent">
              aurora.testpilot.ai
            </div>
            <div className="text-robbie-cyan text-sm opacity-60">
              Press any key to continue...
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

export default MatrixWelcome
