import { useEffect, useRef } from 'react'

const MatrixRain = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const columns = Math.floor(canvas.width / 20)
    const drops: number[] = Array(columns).fill(1)
    const colors = ['#ff6b35', '#4ecdc4', '#ff6b9d']
    const chars = 'ROBBIE01アイウエオカキクケコサシスセソタチツテト★☆♥♦'

    const draw = () => {
      ctx.fillStyle = 'rgba(10, 10, 24, 0.05)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.font = '14px Courier New'

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)]
        const color = colors[i % colors.length]
        ctx.fillStyle = color
        ctx.fillText(text, i * 20, drops[i] * 20)

        if (drops[i] * 20 > canvas.height && Math.random() > 0.975) {
          drops[i] = 0
        }
        drops[i]++
      }
    }

    const interval = setInterval(draw, 33)

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    return () => {
      clearInterval(interval)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 opacity-15 pointer-events-none z-0"
    />
  )
}

export default MatrixRain
