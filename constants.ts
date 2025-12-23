
import { Skin } from './types';

export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 600;
export const GROUND_Y = 500;
export const PLAYER_START_X = 150;

export const INITIAL_SETTINGS = {
  speed: 8,
  gravity: 0.8,
  jumpForce: -15,
  bpm: 128,
  level: 1,
};

export const COLORS = {
  PLAYER: '#00f2ff',
  DASH: '#ff00ff',
  GROUND: '#1a1a1a',
  SPIKE: '#ff3131',
  BLOCK: '#39ff14',
  ORB: '#fffb00',
  BACKGROUND: '#050505',
};

export const SKINS: Skin[] = [
  { id: 'default', name: 'CYAN NEON', color: '#00f2ff', price: 0, description: 'The original prototype.' },
  { id: 'emerald', name: 'EMERALD', color: '#39ff14', price: 50, description: 'Highly optimized green light.' },
  { id: 'ruby', name: 'RUBY FLARE', color: '#ff3131', price: 100, description: 'Aggressive heat-resistant shell.' },
  { id: 'gold', name: 'MIDAS TOUCH', color: '#fffb00', price: 250, description: 'For the high rollers.' },
  { id: 'void', name: 'VOID STALKER', color: '#bc13fe', price: 500, description: 'Absorbs all visible spectrums.' },
  { id: 'ember', name: 'EMBER CORE', color: '#ff8c00', price: 1000, description: 'Warning: High temperature.' },
];

export const DISTANCE_PER_LEVEL = 1000;
export const SPEED_INCREASE_PER_LEVEL = 1.5;
