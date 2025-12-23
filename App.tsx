
import React, { useState, useEffect, useCallback } from 'react';
import GameCanvas from './components/GameCanvas';
import { GameState, Skin } from './types';
import { COLORS, SKINS, DISTANCE_PER_LEVEL } from './constants';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [orbCount, setOrbCount] = useState(() => {
    const saved = localStorage.getItem('neon_orbs');
    return saved ? parseInt(saved) : 0;
  });
  const [unlockedSkins, setUnlockedSkins] = useState<string[]>(() => {
    const saved = localStorage.getItem('neon_skins');
    return saved ? JSON.parse(saved) : ['default'];
  });
  const [activeSkinId, setActiveSkinId] = useState(() => {
    return localStorage.getItem('neon_active_skin') || 'default';
  });
  const [currentLevel, setCurrentLevel] = useState(1);

  // Persistence
  useEffect(() => {
    localStorage.setItem('neon_orbs', orbCount.toString());
  }, [orbCount]);

  useEffect(() => {
    localStorage.setItem('neon_skins', JSON.stringify(unlockedSkins));
  }, [unlockedSkins]);

  useEffect(() => {
    localStorage.setItem('neon_active_skin', activeSkinId);
  }, [activeSkinId]);

  const activeSkin = SKINS.find(s => s.id === activeSkinId) || SKINS[0];

  const handleGameOver = useCallback((finalScore: number, sessionOrbs: number) => {
    setGameState(GameState.GAMEOVER);
    setScore(finalScore);
    setHighScore(prev => Math.max(prev, finalScore));
    setOrbCount(prev => prev + sessionOrbs);
  }, []);

  const handleLevelChange = useCallback((level: number) => {
    setCurrentLevel(level);
  }, []);

  const startGame = () => {
    setGameState(GameState.PLAYING);
    setScore(0);
    setCurrentLevel(1);
  };

  const buySkin = (skin: Skin) => {
    if (orbCount >= skin.price && !unlockedSkins.includes(skin.id)) {
      setOrbCount(prev => prev - skin.price);
      setUnlockedSkins(prev => [...prev, skin.id]);
      setActiveSkinId(skin.id);
    } else if (unlockedSkins.includes(skin.id)) {
      setActiveSkinId(skin.id);
    }
  };

  return (
    <div className="relative w-screen h-screen bg-[#050505] flex items-center justify-center overflow-hidden font-inter select-none">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[radial-gradient(circle,rgba(0,242,255,0.05)_0%,transparent_70%)]"></div>
      </div>

      <GameCanvas 
        gameState={gameState} 
        onGameOver={handleGameOver} 
        onScoreUpdate={setScore}
        onLevelChange={handleLevelChange}
        skinColor={activeSkin.color}
      />

      {/* HUD Overlay */}
      {gameState === GameState.PLAYING && (
        <div className="absolute top-8 left-0 right-0 px-12 flex justify-between items-start pointer-events-none">
          <div className="flex gap-12">
            <div className="flex flex-col">
              <span className="text-cyan-400 text-xs font-orbitron tracking-widest uppercase opacity-70">Distance</span>
              <span className="text-white text-4xl font-black font-orbitron">{Math.floor(score)}m</span>
            </div>
            <div className="flex flex-col">
              <span className="text-fuchsia-400 text-xs font-orbitron tracking-widest uppercase opacity-70">Tier</span>
              <span className="text-white text-4xl font-black font-orbitron">LVL {currentLevel}</span>
            </div>
          </div>
          <div className="flex flex-col items-end">
             <span className="text-yellow-400 text-xs font-orbitron tracking-widest uppercase opacity-70">Neon Orbs</span>
             <span className="text-white text-3xl font-black font-orbitron">{orbCount}</span>
          </div>
        </div>
      )}

      {/* Start Screen */}
      {gameState === GameState.START && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center backdrop-blur-sm z-10">
          <h1 className="text-7xl font-black font-orbitron mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500 animate-pulse">
            NEON DASH
          </h1>
          <p className="text-cyan-100/50 font-orbitron tracking-[0.3em] mb-12 uppercase">Endless Rhythm Runner</p>
          
          <div className="flex gap-4">
            <button 
              onClick={startGame}
              className="group relative px-12 py-4 bg-cyan-500 hover:bg-cyan-400 transition-all duration-300 rounded-sm font-bold text-black uppercase tracking-widest transform hover:scale-110 active:scale-95 shadow-[0_0_30px_rgba(6,182,212,0.5)]"
            >
              Initiate Sequence
            </button>
            <button 
              onClick={() => setGameState(GameState.SHOP)}
              className="px-12 py-4 bg-white/10 hover:bg-white/20 transition-all duration-300 rounded-sm font-bold text-white uppercase tracking-widest transform hover:scale-105"
            >
              Skin Vault
            </button>
          </div>

          <div className="mt-16 text-center text-white/40 text-sm font-orbitron uppercase tracking-widest">
            Best Run: {Math.floor(highScore)}M • Orbs: <span className="text-yellow-400">{orbCount}</span>
          </div>
        </div>
      )}

      {/* Shop Screen */}
      {gameState === GameState.SHOP && (
        <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center p-8 z-20">
          <div className="w-full max-w-4xl">
            <div className="flex justify-between items-center mb-12">
              <h2 className="text-4xl font-black font-orbitron text-white">SKIN VAULT</h2>
              <div className="text-right">
                <p className="text-xs text-white/50 font-orbitron uppercase">Available Orbs</p>
                <p className="text-2xl font-black text-yellow-400 font-orbitron">{orbCount}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {SKINS.map((skin) => {
                const isUnlocked = unlockedSkins.includes(skin.id);
                const isActive = activeSkinId === skin.id;
                
                return (
                  <div 
                    key={skin.id}
                    className={`relative p-6 bg-white/5 border-2 transition-all duration-300 ${isActive ? 'border-cyan-400 bg-cyan-400/5' : 'border-white/10 hover:border-white/30'}`}
                  >
                    <div 
                      className="w-12 h-12 mb-4 shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                      style={{ backgroundColor: skin.color, boxShadow: `0 0 20px ${skin.color}66` }}
                    ></div>
                    <h3 className="text-lg font-bold text-white font-orbitron mb-1">{skin.name}</h3>
                    <p className="text-xs text-white/40 mb-4 h-8">{skin.description}</p>
                    
                    <button
                      onClick={() => buySkin(skin)}
                      disabled={!isUnlocked && orbCount < skin.price}
                      className={`w-full py-2 font-bold uppercase text-xs tracking-widest transition-all ${
                        isActive ? 'bg-cyan-500 text-black cursor-default' : 
                        isUnlocked ? 'bg-white/10 text-white hover:bg-white/20' :
                        orbCount >= skin.price ? 'bg-yellow-400 text-black hover:bg-yellow-300' : 'bg-red-500/20 text-red-500/50 cursor-not-allowed'
                      }`}
                    >
                      {isActive ? 'Active' : isUnlocked ? 'Select' : `Buy: ${skin.price}`}
                    </button>
                  </div>
                );
              })}
            </div>

            <button 
              onClick={() => setGameState(GameState.START)}
              className="mt-12 px-10 py-3 border-2 border-white/30 text-white font-black uppercase tracking-widest hover:border-white transition-colors"
            >
              Back to Menu
            </button>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {gameState === GameState.GAMEOVER && (
        <div className="absolute inset-0 bg-red-950/40 backdrop-blur-xl flex flex-col items-center justify-center z-10">
          <h2 className="text-6xl font-black font-orbitron text-red-500 mb-2 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">
            CRITICAL FAILURE
          </h2>
          <div className="text-white font-orbitron mb-12 space-y-2 text-center">
            <p className="text-lg">DISTANCE REACHED: <span className="text-cyan-400">{Math.floor(score)}M</span></p>
            <p className="text-lg opacity-60">BEST ATTEMPT: {Math.floor(highScore)}M</p>
          </div>

          <div className="flex gap-4">
            <button 
              onClick={startGame}
              className="px-10 py-3 bg-white text-black font-black uppercase tracking-widest hover:bg-cyan-400 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            >
              Retry
            </button>
            <button 
              onClick={() => setGameState(GameState.START)}
              className="px-10 py-3 border-2 border-white/30 text-white font-black uppercase tracking-widest hover:border-white transition-colors"
            >
              Menu
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
