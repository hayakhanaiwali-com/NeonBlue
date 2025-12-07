import React, { useEffect, useRef } from 'react';

const WarpBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    // --- CONFIGURATION ---
    const GLOBE_RADIUS = Math.min(width, height) * 0.35;
    const DOT_DENSITY = 1000;
    const ROTATION_SPEED = 0.0005;
    const BEAM_INTERVAL = 20; // Frames between beams

    // --- STATE ---
    interface Point3D { x: number; y: number; z: number; lat: number; lon: number; isCity: boolean }
    interface Beam { x: number; y: number; targetId: number; progress: number; speed: number }
    
    const points: Point3D[] = [];
    const beams: Beam[] = [];
    let rotation = 0;
    
    // Initialize Sphere Points (Fibonacci Sphere for even distribution)
    const phi = Math.PI * (3 - Math.sqrt(5)); 
    for (let i = 0; i < DOT_DENSITY; i++) {
        const y = 1 - (i / (DOT_DENSITY - 1)) * 2; // y goes from 1 to -1
        const radius = Math.sqrt(1 - y * y);
        const theta = phi * i; 

        const x = Math.cos(theta) * radius;
        const z = Math.sin(theta) * radius;

        // Randomly assign some points as "Cities" (brighter)
        const isCity = Math.random() > 0.85;

        points.push({ x, y, z, lat: 0, lon: 0, isCity });
    }

    // Stars background
    const stars: {x: number, y: number, size: number, alpha: number}[] = [];
    for(let i=0; i<300; i++) {
        stars.push({
            x: Math.random() * width,
            y: Math.random() * height,
            size: Math.random() * 2,
            alpha: Math.random()
        });
    }

    let frame = 0;
    let animationFrameId: number;

    const render = () => {
      // 1. Clear & Background (Deep Space Blue)
      const bgGradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width);
      bgGradient.addColorStop(0, '#020617'); // Dark Slate 950
      bgGradient.addColorStop(1, '#000000');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // 2. Draw Stars
      ctx.fillStyle = 'white';
      stars.forEach(star => {
          ctx.globalAlpha = star.alpha * 0.5 + Math.sin(frame * 0.05 + star.x) * 0.3;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
          ctx.fill();
      });
      ctx.globalAlpha = 1.0;

      // 3. Globe Calculation
      const cx = width / 2;
      const cy = height / 2 + (height * 0.1); // Slightly lower to look "out" at it

      rotation += ROTATION_SPEED;

      // visible points buffer for beams
      const visiblePoints: {px: number, py: number, index: number}[] = [];

      // Sort points by Z so we draw back-to-front (though for dots it matters less, for lines it does)
      // Actually, we only draw if z > 0 (front hemisphere) for solid look, 
      // or draw all for "holographic wireframe" look. Let's do Front Hemisphere mostly.
      
      points.forEach((p, idx) => {
          // Rotate around Y axis
          const rx = p.x * Math.cos(rotation) - p.z * Math.sin(rotation);
          const rz = p.x * Math.sin(rotation) + p.z * Math.cos(rotation);
          const ry = p.y; // Tilt axis slightly?
          
          // Apply Tilt (rotate around X slightly)
          const tilt = 0.2;
          const rry = ry * Math.cos(tilt) - rz * Math.sin(tilt);
          const rrz = ry * Math.sin(tilt) + rz * Math.cos(tilt);

          // Project
          const scale = GLOBE_RADIUS / (2 - rrz/2); // Perspective division
          const px = cx + rx * scale;
          const py = cy + rry * scale;

          // Draw Atmosphere Glow behind globe (only once)
          if (idx === 0) {
              ctx.save();
              ctx.translate(cx, cy);
              const glow = ctx.createRadialGradient(0, 0, GLOBE_RADIUS * 0.8, 0, 0, GLOBE_RADIUS * 1.5);
              glow.addColorStop(0, 'rgba(6, 182, 212, 0)');
              glow.addColorStop(0.5, 'rgba(6, 182, 212, 0.2)');
              glow.addColorStop(1, 'rgba(6, 182, 212, 0)');
              ctx.fillStyle = glow;
              ctx.beginPath();
              ctx.arc(0, 0, GLOBE_RADIUS * 1.5, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
          }

          // Visibility check (Backface culling approx)
          const isFront = rrz > -0.5; 

          if (isFront) {
              const alpha = (rrz + 1) / 2; // Fade on edges
              ctx.fillStyle = p.isCity ? `rgba(200, 255, 255, ${alpha})` : `rgba(6, 182, 212, ${alpha * 0.3})`;
              
              const size = p.isCity ? 1.5 * scale/GLOBE_RADIUS * 100 : 1 * scale/GLOBE_RADIUS * 100;
              
              ctx.beginPath();
              ctx.arc(px, py, Math.max(0.5, size), 0, Math.PI * 2);
              ctx.fill();

              if (p.isCity && Math.random() > 0.99) {
                  // City sparkle
                  ctx.fillStyle = 'white';
                  ctx.beginPath();
                  ctx.arc(px, py, size * 2, 0, Math.PI*2);
                  ctx.fill();
              }

              visiblePoints.push({px, py, index: idx});
          }
      });

      // 4. Broadcast Beams
      // Spawn new beam
      if (frame % BEAM_INTERVAL === 0 && visiblePoints.length > 0) {
          const target = visiblePoints[Math.floor(Math.random() * visiblePoints.length)];
          beams.push({
              x: cx, // Start from center (behind station)
              y: height + 100, // Start from bottom off screen
              targetId: target.index,
              progress: 0,
              speed: 0.02 + Math.random() * 0.03
          });
      }

      // Update & Draw Beams
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#22d3ee'; // Cyan 400
      
      // We need to re-calculate target positions because the earth rotated!
      // This is a bit expensive but necessary for correct tracking.
      // Optimization: We know the math.
      
      for (let i = beams.length - 1; i >= 0; i--) {
          const b = beams[i];
          b.progress += b.speed;
          
          if (b.progress >= 1) {
              // Impact effect
              beams.splice(i, 1);
              continue;
          }

          // Recalculate target position
          const p = points[b.targetId];
          const rx = p.x * Math.cos(rotation) - p.z * Math.sin(rotation);
          const rz = p.x * Math.sin(rotation) + p.z * Math.cos(rotation);
          // Apply Tilt
          const tilt = 0.2;
          const rry = p.y * Math.cos(tilt) - rz * Math.sin(tilt);
          const rrz = p.y * Math.sin(tilt) + rz * Math.cos(tilt);
          const scale = GLOBE_RADIUS / (2 - rrz/2);
          const tx = cx + rx * scale;
          const ty = cy + rry * scale;

          // Draw Curved Beam
          // Start: Bottom Center. End: Target. Control Point: Mid height but pushed out.
          const startX = width / 2;
          const startY = height;
          
          const currentX = startX + (tx - startX) * b.progress;
          const currentY = startY + (ty - startY) * b.progress;

          // Simple line for high speed look
          const tailLength = 0.2;
          const tailProgress = Math.max(0, b.progress - tailLength);
          const tailX = startX + (tx - startX) * tailProgress;
          const tailY = startY + (ty - startY) * tailProgress;

          const gradient = ctx.createLinearGradient(tailX, tailY, currentX, currentY);
          gradient.addColorStop(0, 'rgba(6, 182, 212, 0)');
          gradient.addColorStop(1, 'rgba(255, 255, 255, 1)');

          ctx.beginPath();
          ctx.moveTo(tailX, tailY);
          ctx.lineTo(currentX, currentY);
          ctx.strokeStyle = gradient;
          ctx.stroke();
          
          // Head Glow
          ctx.fillStyle = 'white';
          ctx.beginPath();
          ctx.arc(currentX, currentY, 2, 0, Math.PI * 2);
          ctx.fill();
      }

      // 5. Space Fog / Vignette
      // A soft blue glow at the bottom to blend the station platform
      const fog = ctx.createLinearGradient(0, height - 200, 0, height);
      fog.addColorStop(0, 'rgba(0,0,0,0)');
      fog.addColorStop(1, 'rgba(8, 51, 68, 0.8)'); // Dark cyan fog
      ctx.fillStyle = fog;
      ctx.fillRect(0, height-200, width, 200);

      frame++;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full -z-10"
    />
  );
};

export default WarpBackground;