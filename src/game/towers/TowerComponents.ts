/**
 * Tower archetypes available in the game.
 */
export type TowerType = 'archer' | 'cannon' | 'mage';

/**
 * Upgrade paths for branching tower specializations.
 */
export type UpgradePath = 'path1' | 'path2';

/**
 * Targeting priority strategies for towers.
 */
export type TargetStrategy = 'first' | 'lowestHp' | 'closest';

/**
 * 2D spatial coordinate component.
 */
export interface PositionComponent {
  x: number;
  y: number;
}

/**
 * Renderable sprite component.
 */
export interface SpriteComponent {
  spriteId: string;
  width: number;
  height: number;
  rotation: number;
  visible: boolean;
  color?: string;
}

/**
 * Core component for defensive tower entities.
 */
export interface TowerComponent {
  towerType: TowerType;
  tier: number;
  upgradePath?: UpgradePath | null;
  range: number;
  fireRate: number; // Attacks per second
  damage?: number;
  splashRadius?: number;
  cooldownRemaining: number;
  targetStrategy: TargetStrategy;
  targetEntityId: number | null;
  baseCost: number;
  totalInvestedCost: number;
  gridX: number;
  gridY: number;
}

/**
 * Standard ECS component identifiers.
 */
export const POSITION_COMPONENT = 'Position';
export const SPRITE_COMPONENT = 'Sprite';
export const TOWER_COMPONENT = 'Tower';
