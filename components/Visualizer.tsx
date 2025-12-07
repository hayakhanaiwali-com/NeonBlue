import React, { useEffect, useRef } from 'react';

interface Props {
  isPlaying: boolean;
  bpm: number;
}

const Visualizer: React.FC<Props> = ({ isPlaying, bpm }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width;
    let height = canvas.height;
    
    const resizeCanvas = () => {
        const parent = canvas.parentElement;
        if(parent) {
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
            width = canvas.width;
            height = canvas.height;
        }
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let frameId: number;
    let t = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      
      if (!isPlaying) {
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
        return;
      }

      // Parameters
      const barCount = 48; // Higher density
      const barWidth = width / barCount;
      const centerY = height / 2;

      for (let i = 0; i < barCount; i++) {
        const speed = (bpm / 60) * 0.15; 
        const wave = Math.sin(t * speed + i * 0.3) * Math.cos(t * speed * 0.5 + i * 0.1);
        const magnitude = Math.abs(wave) * (height * 0.4);

        const x = i * barWidth;
        const hue = 180 + (magnitude / height) * 60; // Cyan base

        // Thin digital lines
        ctx.fillStyle = `rgba(${hue}, 255, 255, 0.8)`;
        
        const w = 2; // Thin lines
        const mx = x + (barWidth - w) / 2;
        
        // Draw bars
        ctx.fillRect(mx, centerY - magnitude, w, magnitude * 2);
        
        // Draw glow tips
        ctx.fillStyle = 'white';
        ctx.fillRect(mx, centerY - magnitude - 2, w, 2);
        ctx.fillRect(mx, centerY + magnitude, w, 2);
      }
      
      t += 0.5;
      frameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(frameId);
    };
  }, [isPlaying, bpm]);

  return (
    <div className="w-full h-24 relative">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};

export default Visualizer;