import { useEffect, useRef } from 'react';

interface MatrixRainProps {
  className?: string;
}

export const MatrixRain: React.FC<MatrixRainProps> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Matrix characters (binary + katakana)
    const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
    const charArray = chars.split('');

    const fontSize = 16;
    const columns = Math.floor(canvas.width / fontSize);
    
    // Track each column's position
    const drops: number[] = [];
    for (let i = 0; i < columns; i++) {
      drops[i] = Math.random() * -100; // Start at random heights
    }

    // Colors
    const colors = {
      head: '#00ff41',      // Bright green
      trail: '#008f11',     // Dark green
      background: 'rgba(13, 2, 8, 0.05)', // Fade effect
    };

    let animationId: number;
    let lastTime = 0;
    const fps = 30; // Target FPS
    const interval = 1000 / fps;

    const draw = (currentTime: number) => {
      // Throttle to target FPS
      const deltaTime = currentTime - lastTime;
      
      if (deltaTime > interval) {
        lastTime = currentTime - (deltaTime % interval);

        // Fade effect (creates trails)
        ctx.fillStyle = colors.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw characters
        ctx.font = `${fontSize}px monospace`;
        
        for (let i = 0; i < drops.length; i++) {
          // Random character
          const char = charArray[Math.floor(Math.random() * charArray.length)];
          
          // Position
          const x = i * fontSize;
          const y = drops[i] * fontSize;

          // Color (bright at head, dim in trail)
          const isHead = Math.random() > 0.975;
          ctx.fillStyle = isHead ? colors.head : colors.trail;
          
          // Draw character
          ctx.fillText(char, x, y);

          // Move drop down
          if (y > canvas.height && Math.random() > 0.975) {
            drops[i] = 0; // Reset to top
          }
          drops[i]++;
        }
      }

      animationId = requestAnimationFrame(draw);
    };

    // Start animation
    animationId = requestAnimationFrame(draw);

    // Handle resize
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none ${className}`}
      style={{ zIndex: 0 }}
    />
  );
};
