import React from 'react';

interface Props {
  children: React.ReactNode;
  className?: string;
  glowColor?: 'blue' | 'cyan' | 'purple';
}

const HolographicCard: React.FC<Props> = ({ children, className = '', glowColor = 'cyan' }) => {
  const borderColors = {
    blue: 'border-blue-500/30',
    cyan: 'border-cyan-400/30',
    purple: 'border-purple-500/30'
  };

  const glowShadows = {
    blue: 'shadow-[0_0_15px_rgba(59,130,246,0.2)]',
    cyan: 'shadow-[0_0_15px_rgba(34,211,238,0.2)]',
    purple: 'shadow-[0_0_15px_rgba(168,85,247,0.2)]'
  };

  return (
    <div className={`
      relative backdrop-blur-md bg-opacity-10 bg-black 
      border ${borderColors[glowColor]} rounded-xl 
      ${glowShadows[glowColor]}
      before:content-[''] before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/5 before:to-transparent before:pointer-events-none before:rounded-xl
      overflow-hidden
      ${className}
    `}>
      {/* Scanline effect */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] z-0 bg-[length:100%_2px,3px_100%] opacity-20" />
      
      <div className="relative z-10 h-full w-full">
        {children}
      </div>
    </div>
  );
};

export default HolographicCard;
