
import React, { useRef, useEffect, useCallback } from 'react';
import { 
  GameState, 
  Player, 
  Obstacle, 
  ObstacleType, 
  Particle,
  GameSettings 
} from '../types';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  GROUND_Y, 
  PLAYER_START_X, 
  INITIAL_SETTINGS, 
  COLORS,
  DISTANCE_PER_LEVEL,
  SPEED_INCREASE_PER_LEVEL
} from '../constants';

// Simple Audio Engine for rhythm feedback
class SoundEngine {
  ctx: AudioContext | null = null;

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  playNote(freq: number, type: OscillatorType = 'sine', duration: number = 0.1) {
    if (!this.ctx || this.ctx.state === 'suspended') {
      this.ctx?.resume();
    }
    if (!this.ctx) return;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playJump() { this.playNote(400, 'square', 0.15); }
  playOrb() { this.playNote(800, 'sine', 0.2); }
  playLevelUp() {
    this.playNote(440, 'sawtooth', 0.1);
    setTimeout(() => this.playNote(554.37, 'sawtooth', 0.1), 100);
    setTimeout(() => this.playNote(659.25, 'sawtooth', 0.2), 200);
  }
  playDeath() { this.playNote(100, 'sawtooth', 0.5); }
}

const audio = new SoundEngine();

interface GameCanvasProps {
  gameState: GameState;
  onGameOver: (score: number, orbs: number) => void;
  onScoreUpdate: (score: number) => void;
  onLevelChange: (level: number) => void;
  skinColor: string;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ 
  gameState, 
  onGameOver, 
  onScoreUpdate, 
  onLevelChange, 
  skinColor 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  
  const playerRef = useRef<Player>({
    x: PLAYER_START_X,
    y: GROUND_Y - 40,
    width: 40,
    height: 40,
    vy: 0,
    isGrounded: true,
    isSliding: false,
    isDashing: false,
    dashCooldown: 0,
    dashDuration: 0,
    color: skinColor,
  });

  const obstaclesRef = useRef<Obstacle[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const lastTimeRef = useRef<number>(0);
  const nextObstacleTimeRef = useRef<number>(0);
  const scoreRef = useRef<number>(0);
  const sessionOrbsRef = useRef<number>(0);
  const settingsRef = useRef<GameSettings>({ ...INITIAL_SETTINGS });

  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const touchActive = useRef<boolean>(false);

  const initGame = useCallback(() => {
    audio.init();
    playerRef.current = {
      x: PLAYER_START_X,
      y: GROUND_Y - 40,
      width: 40,
      height: 40,
      vy: 0,
      isGrounded: true,
      isSliding: false,
      isDashing: false,
      dashCooldown: 0,
      dashDuration: 0,
      color: skinColor,
    };
    obstaclesRef.current = [];
    particlesRef.current = [];
    scoreRef.current = 0;
    sessionOrbsRef.current = 0;
    settingsRef.current = { ...INITIAL_SETTINGS };
    nextObstacleTimeRef.current = 0;
  }, [skinColor]);

  const createParticle = (x: number, y: number, color: string, count = 1) => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        id: Math.random().toString(),
        x,
        y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        size: Math.random() * 5 + 2,
        life: 1,
        color,
      });
    }
  };

  const spawnObstacle = (timestamp: number) => {
    const settings = settingsRef.current;
    const adjustedBpm = settings.bpm + (settings.level * 8);
    const beatInterval = (60 / adjustedBpm) * 1000;
    
    if (timestamp > nextObstacleTimeRef.current) {
      const typeRand = Math.random();
      let type: ObstacleType = ObstacleType.SPIKE;
      let width = 40;
      let height = 40;
      let y = GROUND_Y - height;

      if (typeRand > 0.82) {
        type = ObstacleType.BLOCK;
        width = 60;
        height = 60;
        y = GROUND_Y - height - (Math.random() > 0.45 ? 90 : 0);
      } else if (typeRand > 0.65) {
        type = ObstacleType.ORB;
        width = 24;
        height = 24;
        y = GROUND_Y - height - 150;
      }

      const color = type === ObstacleType.SPIKE ? COLORS.SPIKE : 
                    type === ObstacleType.BLOCK ? COLORS.BLOCK : COLORS.ORB;

      obstaclesRef.current.push({
        id: Math.random().toString(),
        x: CANVAS_WIDTH + 100,
        y,
        width,
        height,
        type,
        color,
        speedMultiplier: 1,
      });

      const beatsToWait = Math.random() > 0.75 ? 2 : (Math.random() > 0.35 ? 1 : 0.5);
      nextObstacleTimeRef.current = timestamp + beatInterval * (beatsToWait / (1 + (settings.level * 0.08)));
    }
  };

  const update = (timestamp: number) => {
    if (gameState !== GameState.PLAYING) return;
    
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    lastTimeRef.current = timestamp;

    const player = playerRef.current;
    const settings = settingsRef.current;

    scoreRef.current += settings.speed / 10;
    onScoreUpdate(scoreRef.current);
    
    const expectedLevel = Math.floor(scoreRef.current / DISTANCE_PER_LEVEL) + 1;
    if (expectedLevel > settings.level) {
      settings.level = expectedLevel;
      settings.speed += SPEED_INCREASE_PER_LEVEL;
      onLevelChange(settings.level);
      audio.playLevelUp();
      createParticle(CANVAS_WIDTH/2, CANVAS_HEIGHT/2, '#fff', 60);
    }

    settings.speed += 0.0006;

    // Unified Input Logic (Keys or Touch)
    const isJumping = keysPressed.current[' '] || keysPressed.current['ArrowUp'] || touchActive.current;

    if (isJumping) {
      if (player.isGrounded) {
        player.vy = settings.jumpForce;
        player.isGrounded = false;
        audio.playJump();
        createParticle(player.x + player.width / 2, player.y + player.height, skinColor, 8);
      }
    }

    if (keysPressed.current['ArrowDown']) {
      if (!player.isSliding) {
        player.isSliding = true;
        player.height = 20;
        player.y += 20;
      }
    } else {
      if (player.isSliding) {
        player.isSliding = false;
        player.height = 40;
        player.y -= 20;
      }
    }

    if (keysPressed.current['Shift'] && player.dashCooldown <= 0) {
      player.isDashing = true;
      player.dashDuration = 12;
      player.dashCooldown = 50;
      audio.playNote(1200, 'sine', 0.1);
      createParticle(player.x, player.y + player.height / 2, COLORS.DASH, 12);
    }

    if (!player.isDashing) {
      player.vy += settings.gravity;
      player.y += player.vy;
    }

    if (player.isDashing) {
      player.dashDuration--;
      if (player.dashDuration <= 0) player.isDashing = false;
    }
    if (player.dashCooldown > 0) player.dashCooldown--;

    const currentGroundY = GROUND_Y - player.height;
    if (player.y >= currentGroundY) {
      player.y = currentGroundY;
      player.vy = 0;
      player.isGrounded = true;
    }

    spawnObstacle(timestamp);

    obstaclesRef.current = obstaclesRef.current.filter((obs) => {
      obs.x -= settings.speed * obs.speedMultiplier;
      
      const playerBox = {
        left: player.x + 6,
        right: player.x + player.width - 6,
        top: player.y + 6,
        bottom: player.y + player.height - 6
      };
      
      const obsBox = {
        left: obs.x,
        right: obs.x + obs.width,
        top: obs.y,
        bottom: obs.y + obs.height
      };

      const isColliding = 
        playerBox.left < obsBox.right &&
        playerBox.right > obsBox.left &&
        playerBox.top < obsBox.bottom &&
        playerBox.bottom > obsBox.top;

      if (isColliding) {
        if (obs.type === ObstacleType.ORB) {
          sessionOrbsRef.current++;
          audio.playOrb();
          createParticle(obs.x + obs.width/2, obs.y + obs.height/2, COLORS.ORB, 20);
          return false;
        } else if (!player.isDashing) {
          audio.playDeath();
          onGameOver(scoreRef.current, sessionOrbsRef.current);
        }
      }

      return obs.x > -100;
    });

    particlesRef.current = particlesRef.current.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.025;
      return p.life > 0;
    });

    draw();
    requestRef.current = requestAnimationFrame(update);
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'rgba(5, 5, 5, 0.45)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Parallax background grid effect
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 1;
    const bgOffset = (scoreRef.current * 0.5) % 200;
    for (let x = -bgOffset; x < CANVAS_WIDTH; x += 200) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }

    // Ground
    ctx.strokeStyle = COLORS.GROUND;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(CANVAS_WIDTH, GROUND_Y);
    ctx.stroke();

    // Floor Parallax Grid
    ctx.globalAlpha = 0.2;
    const gridOffset = (scoreRef.current * 2.5) % 100;
    for (let i = 0; i < CANVAS_WIDTH + 300; i += 100) {
      ctx.beginPath();
      ctx.moveTo(i - gridOffset, GROUND_Y);
      ctx.lineTo(i - gridOffset - 400, CANVAS_HEIGHT);
      ctx.stroke();
    }
    ctx.globalAlpha = 1.0;

    // Obstacles
    obstaclesRef.current.forEach(obs => {
      ctx.shadowBlur = 20;
      ctx.shadowColor = obs.color;
      ctx.fillStyle = obs.color;

      if (obs.type === ObstacleType.SPIKE) {
        ctx.beginPath();
        ctx.moveTo(obs.x, obs.y + obs.height);
        ctx.lineTo(obs.x + obs.width / 2, obs.y);
        ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
        ctx.fill();
      } else if (obs.type === ObstacleType.BLOCK) {
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(obs.x + 10, obs.y + 10, obs.width - 20, obs.height - 20);
      } else if (obs.type === ObstacleType.ORB) {
        ctx.beginPath();
        ctx.arc(obs.x + obs.width/2, obs.y + obs.height/2, obs.width/2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.stroke();
      }
    });

    // Particles
    ctx.shadowBlur = 0;
    particlesRef.current.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    ctx.globalAlpha = 1.0;

    // Player
    const p = playerRef.current;
    p.color = skinColor;
    ctx.shadowBlur = p.isDashing ? 40 : 30;
    ctx.shadowColor = p.isDashing ? COLORS.DASH : skinColor;
    ctx.fillStyle = p.isDashing ? COLORS.DASH : skinColor;
    
    if (p.isDashing) {
      ctx.globalAlpha = 0.4;
      ctx.fillRect(p.x - 30, p.y, p.width, p.height);
      ctx.fillRect(p.x - 60, p.y, p.width, p.height);
      ctx.globalAlpha = 1.0;
    }

    const rhythmPulse = Math.sin(Date.now() / 70) * 4;
    ctx.fillRect(p.x - rhythmPulse/2, p.y - rhythmPulse/2, p.width + rhythmPulse, p.height + rhythmPulse);

    // Face / Eye
    ctx.fillStyle = '#000';
    ctx.shadowBlur = 0;
    const eyeSize = 7;
    ctx.fillRect(p.x + p.width - 16, p.y + (p.isSliding ? 7 : 12), eyeSize, eyeSize);

    // Level Text Overlay
    if (scoreRef.current % DISTANCE_PER_LEVEL < 100) {
      ctx.globalAlpha = 1 - (scoreRef.current % DISTANCE_PER_LEVEL) / 100;
      ctx.fillStyle = 'white';
      ctx.font = '900 60px Orbitron';
      ctx.textAlign = 'center';
      ctx.fillText(`LEVEL ${settingsRef.current.level}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 50);
      ctx.globalAlpha = 1.0;
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { keysPressed.current[e.key] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keysPressed.current[e.key] = false; };
    const handleTouchStart = (e: TouchEvent) => {
        e.preventDefault();
        touchActive.current = true;
        audio.init(); // Initialize audio on first touch for mobile browser compliance
    };
    const handleTouchEnd = (e: TouchEvent) => {
        e.preventDefault();
        touchActive.current = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  useEffect(() => {
    if (gameState === GameState.PLAYING) {
      initGame();
      lastTimeRef.current = 0;
      requestRef.current = requestAnimationFrame(update);
    } else {
      cancelAnimationFrame(requestRef.current);
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [gameState, initGame]);

  return (
    <div className="relative border-4 border-white/20 rounded-2xl overflow-hidden shadow-[0_0_150px_rgba(0,0,0,0.9)] bg-black">
       <canvas 
        ref={canvasRef} 
        width={CANVAS_WIDTH} 
        height={CANVAS_HEIGHT}
        className="max-w-full h-auto"
      />
      {/* HUD borders */}
      <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-cyan-500/40"></div>
      <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-cyan-500/40"></div>
      <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-cyan-500/40"></div>
      <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-cyan-500/40"></div>
    </div>
  );
};

export default GameCanvas;
