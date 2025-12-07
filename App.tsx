import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, SkipForward, Radio, Activity, Globe, Disc, Volume2, Wifi } from 'lucide-react';
import WarpBackground from './components/WarpBackground';
import HolographicCard from './components/HolographicCard';
import Visualizer from './components/Visualizer';
import GlobalBroadcast from './components/GlobalBroadcast';
import { generateNextSong, generatePlaylistBatch } from './services/geminiService';
import { Song, RadioState } from './types';

const INITIAL_SONG: Song = {
  id: 'init',
  title: "Orbital Drift",
  artist: "Starlight Systems",
  genre: "Deep Space Ambient",
  duration: "4:20",
  bpm: 100
};

export default function App() {
  const [radioState, setRadioState] = useState<RadioState>({
    currentSong: INITIAL_SONG,
    isPlaying: false,
    volume: 0.7,
    history: [],
    queue: []
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadQueue = async () => {
        const batch = await generatePlaylistBatch(4);
        setRadioState(prev => ({ ...prev, queue: batch }));
    };
    loadQueue();
  }, []);

  const handlePlayPause = () => {
    setRadioState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const playSong = useCallback((song: Song) => {
    setRadioState(prev => {
        const newHistory = prev.currentSong ? [prev.currentSong, ...prev.history].slice(0, 5) : prev.history;
        return {
            ...prev,
            currentSong: song,
            isPlaying: true,
            history: newHistory,
            queue: prev.queue.filter(s => s.id !== song.id)
        }
    });
  }, []);

  const handleNext = async () => {
    setIsLoading(true);
    let nextSong: Song;

    if (radioState.queue.length > 0) {
        nextSong = radioState.queue[0];
        setRadioState(prev => ({
            ...prev,
            queue: prev.queue.slice(1)
        }));
    } else {
        nextSong = await generateNextSong(radioState.currentSong);
    }

    playSong(nextSong);
    setIsLoading(false);

    if (radioState.queue.length < 2) {
        generateNextSong(nextSong).then(suggestion => {
            setRadioState(prev => ({...prev, queue: [...prev.queue, suggestion]}));
        });
    }
  };

  const handleQueueClick = (song: Song) => {
      playSong(song);
      // Instant reaction: User chose a new path, generate new future based on this.
      generateNextSong(song).then(suggestion => {
          setRadioState(prev => ({...prev, queue: [suggestion, ...prev.queue.slice(1)]}));
      });
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden flex flex-col font-sans select-none">
      <WarpBackground />
      
      {/* Cockpit Vignette Overlay */}
      <div className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.6)_100%)]" />
      
      {/* HUD Header */}
      <header className="relative z-10 w-full p-6 flex justify-between items-start">
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
                <div className="relative">
                    <Radio className="w-8 h-8 text-cyan-400" />
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-200 rounded-full animate-ping" />
                </div>
                <h1 className="font-display text-3xl font-bold tracking-widest text-white drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">
                    NEONBLUE FM
                </h1>
            </div>
            <p className="text-[10px] text-cyan-500 tracking-[0.4em] uppercase pl-11">
                Orbital Station Alpha • 400km Altitude
            </p>
        </div>
        
        <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2 px-3 py-1 bg-black/40 border border-cyan-500/30 rounded backdrop-blur-md">
                <Wifi className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span className="text-xs font-mono text-cyan-200">GLOBAL LINK: ONLINE</span>
            </div>
            <div className="text-[10px] font-mono text-cyan-600">
                SYS.VER.2.4.9
            </div>
        </div>
      </header>

      {/* Main Control Interface */}
      <div className="relative z-10 flex-1 p-6 grid grid-cols-1 md:grid-cols-12 gap-6 max-w-7xl mx-auto w-full items-end pb-24">
        
        {/* Left: Systems */}
        <div className="hidden md:flex md:col-span-3 flex-col gap-4 self-center">
             <HolographicCard className="p-4" glowColor="cyan">
                 <Visualizer isPlaying={radioState.isPlaying} bpm={radioState.currentSong?.bpm || 100} />
             </HolographicCard>
             <HolographicCard className="h-48" glowColor="blue">
                 <GlobalBroadcast />
             </HolographicCard>
        </div>

        {/* Center: Playback Core */}
        <div className="md:col-span-6 flex flex-col items-center justify-center relative mb-12">
             {/* Center HUD Circle */}
             <div className="relative group cursor-pointer transition-transform duration-500 hover:scale-105" onClick={handlePlayPause}>
                {/* Decorative Rings */}
                <div className="absolute -inset-10 border border-cyan-500/10 rounded-full animate-[spin_20s_linear_infinite]" />
                <div className="absolute -inset-4 border border-cyan-500/20 rounded-full animate-[spin_10s_linear_infinite_reverse]" />
                <div className="absolute inset-0 bg-cyan-500/5 blur-2xl rounded-full" />
                
                {/* Album Art / Disc */}
                <div className="relative w-64 h-64 md:w-72 md:h-72 rounded-full bg-black/60 backdrop-blur-xl border border-cyan-400/30 flex items-center justify-center overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.2)]">
                    <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0deg,rgba(34,211,238,0.1)_180deg,transparent_360deg)] animate-[spin_4s_linear_infinite]" />
                    <Disc className={`w-32 h-32 text-cyan-500/80 ${radioState.isPlaying ? 'animate-[spin_3s_linear_infinite]' : ''}`} />
                    
                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                         {radioState.isPlaying ? 
                            <Pause className="w-16 h-16 text-white drop-shadow-[0_0_10px_black]" /> : 
                            <Play className="w-16 h-16 text-white drop-shadow-[0_0_10px_black] ml-2" />
                         }
                    </div>
                </div>
             </div>

             <div className="mt-8 text-center relative">
                 <div className="absolute -left-8 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-cyan-500/50 to-transparent" />
                 <div className="absolute -right-8 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-cyan-500/50 to-transparent" />
                 
                 <h2 className="text-4xl md:text-5xl font-display font-bold text-white tracking-widest drop-shadow-[0_0_15px_rgba(34,211,238,0.6)]">
                    {radioState.currentSong?.title}
                 </h2>
                 <p className="text-lg md:text-xl text-cyan-300 font-light tracking-[0.3em] uppercase mt-2">
                    {radioState.currentSong?.artist}
                 </p>
                 <div className="flex justify-center gap-4 mt-4">
                     <span className="text-[10px] uppercase border border-cyan-500/30 px-2 py-1 rounded text-cyan-400 bg-cyan-900/10">
                        {radioState.currentSong?.genre}
                     </span>
                     <span className="text-[10px] uppercase border border-cyan-500/30 px-2 py-1 rounded text-cyan-400 bg-cyan-900/10">
                        {radioState.currentSong?.bpm} BPM
                     </span>
                 </div>
             </div>
        </div>

        {/* Right: Queue System */}
        <div className="md:col-span-3 flex flex-col justify-end h-full">
            <HolographicCard className="flex flex-col max-h-[400px]" glowColor="purple">
                <div className="p-4 border-b border-purple-500/20 bg-purple-900/10">
                    <h3 className="text-purple-200 font-display text-sm tracking-widest flex items-center gap-2">
                        <Activity className="w-3 h-3" /> NEXT WAVEFORM
                    </h3>
                </div>
                
                <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                    {radioState.queue.length === 0 && (
                         <div className="text-center py-8 text-xs text-purple-300/50 font-mono">
                             Wait for uplink...
                         </div>
                    )}
                    {radioState.queue.map((song, idx) => (
                        <div 
                            key={song.id}
                            onClick={() => handleQueueClick(song)}
                            className="group relative p-3 rounded bg-black/40 border border-white/5 hover:border-cyan-400/50 transition-all cursor-pointer overflow-hidden"
                        >
                            <div className="flex justify-between items-center relative z-10">
                                <div className="flex flex-col min-w-0">
                                    <span className="text-cyan-100 font-medium text-sm truncate group-hover:text-cyan-300 transition-colors">
                                        {song.title}
                                    </span>
                                    <span className="text-[10px] text-cyan-500/70 truncate">{song.artist}</span>
                                </div>
                                <Play className="w-3 h-3 text-cyan-400 opacity-0 group-hover:opacity-100" />
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="p-3 text-center text-xs text-cyan-400 animate-pulse font-mono">
                            // GENERATING SEQUENCE...
                        </div>
                    )}
                </div>
            </HolographicCard>
        </div>
      </div>

      {/* Footer Control Deck */}
      <footer className="absolute bottom-0 left-0 w-full z-50">
          {/* Glass Decoration Top */}
          <div className="w-full h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
          
          <div className="bg-black/80 backdrop-blur-xl p-4 md:px-8">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                
                {/* Status Indicators */}
                <div className="flex items-center gap-6 w-full md:w-auto justify-center md:justify-start">
                    <div className="flex flex-col">
                        <span className="text-[9px] text-cyan-600 uppercase tracking-widest">Signal</span>
                        <div className="flex gap-0.5 mt-1">
                            {[1,2,3,4,5].map(i => <div key={i} className={`w-1 h-3 rounded-full ${i<5 ? 'bg-cyan-400' : 'bg-cyan-900'}`} />)}
                        </div>
                    </div>
                    <div className="w-px h-8 bg-cyan-900/50" />
                    <div className="flex flex-col">
                        <span className="text-[9px] text-cyan-600 uppercase tracking-widest">Listeners</span>
                        <span className="text-xs font-mono text-cyan-300">8.2B</span>
                    </div>
                </div>

                {/* Main Controls */}
                <div className="flex items-center gap-6">
                    <button 
                        onClick={handlePlayPause}
                        className="w-12 h-12 rounded-full border border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-black flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(34,211,238,0.2)]"
                    >
                        {radioState.isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
                    </button>
                    <button 
                        onClick={handleNext}
                        disabled={isLoading}
                        className="w-10 h-10 rounded-full border border-cyan-800 text-cyan-600 hover:border-cyan-500 hover:text-cyan-400 flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <SkipForward className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {/* Volume */}
                <div className="flex items-center gap-3 w-32 md:w-48 group">
                    <Volume2 className="text-cyan-600 w-4 h-4 group-hover:text-cyan-400 transition-colors" />
                    <div className="flex-1 h-1 bg-cyan-900/30 rounded-full relative">
                        <div 
                            className="absolute top-0 left-0 h-full bg-cyan-500 rounded-full shadow-[0_0_10px_cyan]" 
                            style={{width: `${radioState.volume * 100}%`}} 
                        />
                        <input 
                            type="range" 
                            min="0" 
                            max="1" 
                            step="0.01" 
                            value={radioState.volume}
                            onChange={(e) => setRadioState(prev => ({ ...prev, volume: parseFloat(e.target.value) }))}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                    </div>
                </div>

            </div>
          </div>
      </footer>
    </main>
  );
}