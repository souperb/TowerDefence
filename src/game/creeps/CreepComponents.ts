import { IVector2 } from '../../core/math/Vector2';

export type CreepType = 'basic' | 'fast' | 'tank' | 'boss';

export const CREEP_COMPONENT = 'CreepComponent';
export const PATH_FOLLOWER_COMPONENT = 'PathFollowerComponent';
export const HEALTH_COMPONENT = 'HealthComponent';
export const POSITION_COMPONENT = 'PositionComponent';
export const VELOCITY_COMPONENT = 'VelocityComponent';
export const SPRITE_COMPONENT = 'SpriteComponent';

export interface CreepComponent {
  creepType: CreepType;
  bountyGold: number;
  damageToBase: number;
  scoreValue: number;
}

export interface PathFollowerComponent {
  waypoints: IVector2[];
  currentWaypointIndex: number;
  distanceTraveled: number;
  reachedEnd: boolean;
  totalPathLength?: number;
}

export interface HealthComponent {
  current: number;
  max: number;
}

export interface PositionComponent {
  x: number;
  y: number;
}

export interface VelocityComponent {
  vx: number;
  vy: number;
  speed: number;
}

export interface SpriteComponent {
  spriteId?: string;
  width: number;
  height: number;
  rotation: number;
  visible: boolean;
  color?: string;
  shape?: 'circle' | 'square' | 'diamond' | 'hexagon';
}
