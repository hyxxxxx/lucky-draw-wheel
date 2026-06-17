import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  rotation: number;
  rotationSpeed: number;
  type: 'confetti' | 'spark' | 'trail';
  gravity: number;
  drag: number;
}

export interface ParticleCelebrationRef {
  burst: (isMega?: boolean) => void;
}

const COLORS = [
  '#FF5733', '#FFC300', '#DAF7A6', '#33FF57', '#33FFDA', 
  '#3380FF', '#8033FF', '#E333FF', '#FF3380', '#FFD700',
  '#00FFCC', '#FF4500', '#7CFC00', '#00EEEE'
];

export const ParticleCelebration = forwardRef<ParticleCelebrationRef, {}>((_, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animRef = useRef<number | null>(null);

  // Resize canvas to full window
  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
  };

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const spawnConfetti = (x: number, y: number, count: number) => {
    const particles = particlesRef.current;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 12;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (5 + Math.random() * 5), // dynamic upward boost
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 6 + Math.random() * 8,
        alpha: 1,
        rotation: Math.random() * Math.PI,
        rotationSpeed: (Math.random() - 0.5) * 0.3,
        type: 'confetti',
        gravity: 0.15,
        drag: 0.96
      });
    }
  };

  const spawnFirework = (targetX: number, targetY: number) => {
    const particles = particlesRef.current;
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    // Explode particles
    const sparks = 80 + Math.floor(Math.random() * 50);
    for (let i = 0; i < sparks; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 8;
      particles.push({
        x: targetX,
        y: targetY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 2 + Math.random() * 3,
        alpha: 1,
        rotation: 0,
        rotationSpeed: 0,
        type: 'spark',
        gravity: 0.1,
        drag: 0.94
      });
    }
  };

  const burst = (isMega = true) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const w = canvas.width;
    const h = canvas.height;

    // Trigger full blast confetti from multiple corners
    spawnConfetti(w * 0.1, h * 0.9, 100);
    spawnConfetti(w * 0.9, h * 0.9, 100);
    spawnConfetti(w * 0.5, h * 0.4, 150);

    // Rocket effect
    if (isMega) {
      setTimeout(() => spawnFirework(w * 0.3, h * 0.3), 100);
      setTimeout(() => spawnFirework(w * 0.7, h * 0.25), 300);
      setTimeout(() => spawnFirework(w * 0.5, h * 0.2), 500);
    }

    // Start loop if not already running
    if (!animRef.current) {
      loop();
    }
  };

  // Expose triggers
  useImperativeHandle(ref, () => ({
    burst
  }));

  const loop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const particles = particlesRef.current;

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.vx *= p.drag;
      p.vy *= p.drag;
      p.vy += p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;
      p.alpha -= 0.008; // gradual fade out

      if (p.alpha <= 0) {
        particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;

      if (p.type === 'confetti') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        // Draw rectangle bits
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      } else {
        // Draw firework spark with soft glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        // subtle secondary ring for extra glow
        ctx.globalAlpha = p.alpha * 0.4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    if (particles.length > 0) {
      animRef.current = requestAnimationFrame(loop);
    } else {
      animRef.current = null;
    }
  };

  return (
    <canvas
      ref={canvasRef}
      id="celebration-canvas"
      className="fixed inset-0 pointer-events-none z-50 w-full h-full"
    />
  );
});

ParticleCelebration.displayName = 'ParticleCelebration';
