
export enum GameState {
  START = 'START',
  PLAYING = 'PLAYING',
  GAMEOVER = 'GAMEOVER',
  SHOP = 'SHOP'
}

export interface Skin {
  id: string;
  name: string;
  color: string;
  price: number;
  description: string;
}

export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  vy: number;
  isGrounded: boolean;
  isSliding: boolean;
  isDashing: boolean;
  dashCooldown: number;
  dashDuration: number;
  color: string;
}

export enum ObstacleType {
  SPIKE = 'SPIKE',
  BLOCK = 'BLOCK',
  LASER = 'LASER',
  ORB = 'ORB'
}

export interface Obstacle {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: ObstacleType;
  color: string;
  speedMultiplier: number;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  color: string;
}

export interface GameSettings {
  speed: number;
  gravity: number;
  jumpForce: number;
  bpm: number;
  level: number;
}
