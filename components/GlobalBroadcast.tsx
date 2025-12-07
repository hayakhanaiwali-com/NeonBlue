import React, { useEffect, useState } from 'react';

const LOCATIONS = [
  'TOKYO, JP', 'NEW YORK, US', 'LONDON, UK', 'BERLIN, DE', 
  'RIO, BR', 'SYDNEY, AU', 'MOSCOW, RU', 'CAIRO, EG',
  'MUMBAI, IN', 'SHANGHAI, CN', 'PARIS, FR', 'LAGOS, NG'
];

const GlobalBroadcast: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const loc = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
      const freq = (88 + Math.random() * 20).toFixed(1);
      const log = `> UPLINK ESTABLISHED: ${loc} [${freq} MHz]`;
      
      setLogs(prev => [log, ...prev].slice(0, 8));
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full relative flex flex-col font-mono text-xs text-cyan-400 p-4">
       <div className="flex items-center justify-between mb-2 border-b border-cyan-500/30 pb-2">
         <span className="uppercase tracking-widest text-cyan-200">Broadcast Log</span>
         <span className="animate-pulse text-green-400">● LIVE</span>
       </div>
       
       <div className="flex-1 overflow-hidden relative">
         {/* Scanline */}
         <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/10 to-transparent h-4 w-full animate-[scan_2s_linear_infinite] pointer-events-none" />
         
         <div className="flex flex-col gap-1.5">
           {logs.map((log, i) => (
             <div key={i} className={`truncate ${i === 0 ? 'text-white' : 'text-cyan-400/70'}`}>
               {log}
             </div>
           ))}
         </div>
       </div>
    </div>
  );
};

export default GlobalBroadcast;