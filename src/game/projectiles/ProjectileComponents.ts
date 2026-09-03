import { Entity } from '../../core/ecs/Component';
import { IVector2 } from '../../core/math/Vector2';
import { TowerType } from '../towers/TowerComponents';

export const PROJECTILE_COMPONENT = 'ProjectileComponent';
export const POSITION_COMPONENT = 'PositionComponent';
export const SPRITE_COMPONENT = 'SpriteComponent';

export interface ProjectileComponent {
  damage: number;
  speed: number;
  targetEntityId: Entity | null;
  /** Generation of targetEntityId at fire time; mismatch means the ID was recycled. */
  targetGeneration?: number;
  targetPosition: IVector2;
  splashRadius: number;
  towerType: TowerType | string;
  isHoming: boolean;
}

export interface PositionComponent {
  x: number;
  y: number;
}

export interface SpriteComponent {
  spriteId: string;
  width: number;
  height: number;
  rotation: number;
  visible: boolean;
  color?: string;
}

