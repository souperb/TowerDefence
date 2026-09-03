export * from './map';
export * from './towers';
export * from './economy';
export * from './scoring';
export * from './systems';
export * from './state';
export * from './waves';
export * from './levels';
export {
  PROJECTILE_COMPONENT,
  type ProjectileComponent,
  type ProjectileSpawnConfig,
  ProjectileFactory,
} from './projectiles';
export * from './combat';
export * from './creeps/CreepFactory';

export {
  type CreepType,
  CREEP_COMPONENT,
  PATH_FOLLOWER_COMPONENT,
  HEALTH_COMPONENT,
  VELOCITY_COMPONENT,
  type CreepComponent,
  type PathFollowerComponent,
  type HealthComponent,
  type VelocityComponent,
  type PositionComponent as CreepPositionComponent,
  type SpriteComponent as CreepSpriteComponent,
} from './creeps/CreepComponents';

export interface GameStateSnapshot {
  lives: number;
  gold: number;
  score: number;
  wave: number;
}





