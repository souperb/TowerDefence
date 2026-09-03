import { World } from '../../core/ecs/World';
import { Entity } from '../../core/ecs/Component';
import { IVector2 } from '../../core/math/Vector2';
import { TowerType } from '../towers/TowerComponents';
import { getTowerDefinition } from '../towers/TowerCatalog';
import {
  PROJECTILE_COMPONENT,
  POSITION_COMPONENT,
  SPRITE_COMPONENT,
  ProjectileComponent,
  PositionComponent,
  SpriteComponent,
} from './ProjectileComponents';

export interface ProjectileSpawnConfig {
  towerType: TowerType | string;
  startPosition: IVector2;
  targetPosition: IVector2;
  targetEntityId?: Entity | null;
  damage: number;
  speed: number;
  splashRadius?: number;
  isHoming?: boolean;
  spriteId?: string;
  color?: string;
  width?: number;
  height?: number;
}

export class ProjectileFactory {
  /**
   * Spawns a projectile entity with Position, Projectile, and Sprite components.
   */
  public static createProjectile(
    world: World,
    config: ProjectileSpawnConfig
  ): Entity {
    const entity = world.createEntity();

    const dx = config.targetPosition.x - config.startPosition.x;
    const dy = config.targetPosition.y - config.startPosition.y;
    const rotation = Math.atan2(dy, dx);

    const posComp: PositionComponent = {
      x: config.startPosition.x,
      y: config.startPosition.y,
    };

    const targetEntityId = config.targetEntityId ?? null;
    const projectileComp: ProjectileComponent = {
      damage: config.damage,
      speed: config.speed,
      targetEntityId,
      targetGeneration: targetEntityId !== null ? world.getGeneration(targetEntityId) : undefined,
      targetPosition: { x: config.targetPosition.x, y: config.targetPosition.y },
      splashRadius: config.splashRadius ?? 0,
      towerType: config.towerType,
      isHoming: config.isHoming ?? true,
    };

    const spriteComp: SpriteComponent = {
      spriteId: config.spriteId ?? `projectile_${config.towerType}`,
      width: config.width ?? 10,
      height: config.height ?? 10,
      rotation,
      visible: true,
      color: config.color ?? '#ffffff',
    };

    world.addComponent(entity, POSITION_COMPONENT, posComp);
    world.addComponent(entity, PROJECTILE_COMPONENT, projectileComp);
    world.addComponent(entity, SPRITE_COMPONENT, spriteComp);

    return entity;
  }

  /**
   * Spawns a projectile configured for a specific tower type.
   */
  public static createForTower(
    world: World,
    towerType: TowerType,
    startPos: IVector2,
    targetPos: IVector2,
    targetEntityId?: Entity | null,
    damageOverride?: number,
    splashRadiusOverride?: number
  ): Entity {
    const def = getTowerDefinition(towerType);
    const damage = damageOverride ?? def.damage;
    const splashRadius = splashRadiusOverride ?? def.splashRadius;

    switch (towerType) {
      case 'archer':
        return this.createArcherArrow(
          world,
          startPos,
          targetPos,
          targetEntityId,
          damage,
          def.projectileSpeed
        );
      case 'cannon':
        return this.createCannonball(
          world,
          startPos,
          targetPos,
          targetEntityId,
          damage,
          splashRadius,
          def.projectileSpeed
        );
      case 'mage':
        return this.createMageBolt(
          world,
          startPos,
          targetPos,
          targetEntityId,
          damage,
          def.projectileSpeed
        );
      default:
        return this.createProjectile(world, {
          towerType,
          startPosition: startPos,
          targetPosition: targetPos,
          targetEntityId,
          damage,
          speed: def.projectileSpeed,
          splashRadius,
          isHoming: true,
          color: def.color,
        });
    }
  }

  /**
   * Spawns an archer arrow: high speed, direct single-target homing.
   */
  public static createArcherArrow(
    world: World,
    startPos: IVector2,
    targetPos: IVector2,
    targetEntityId?: Entity | null,
    damage: number = 15,
    speed: number = 320
  ): Entity {
    return this.createProjectile(world, {
      towerType: 'archer',
      startPosition: startPos,
      targetPosition: targetPos,
      targetEntityId: targetEntityId ?? null,
      damage,
      speed,
      splashRadius: 0,
      isHoming: true,
      spriteId: 'projectile_arrow',
      color: '#38bdf8',
      width: 14,
      height: 4,
    });
  }

  /**
   * Spawns a cannonball: ballistic area-of-effect explosive, non-homing / ground-targeted.
   */
  public static createCannonball(
    world: World,
    startPos: IVector2,
    targetPos: IVector2,
    targetEntityId?: Entity | null,
    damage: number = 45,
    splashRadius: number = 48,
    speed: number = 200
  ): Entity {
    return this.createProjectile(world, {
      towerType: 'cannon',
      startPosition: startPos,
      targetPosition: targetPos,
      targetEntityId: targetEntityId ?? null,
      damage,
      speed,
      splashRadius,
      isHoming: false,
      spriteId: 'projectile_cannonball',
      color: '#f97316',
      width: 10,
      height: 10,
    });
  }

  /**
   * Spawns a mage arcane bolt: high damage, homing energy missile.
   */
  public static createMageBolt(
    world: World,
    startPos: IVector2,
    targetPos: IVector2,
    targetEntityId?: Entity | null,
    damage: number = 60,
    speed: number = 260
  ): Entity {
    return this.createProjectile(world, {
      towerType: 'mage',
      startPosition: startPos,
      targetPosition: targetPos,
      targetEntityId: targetEntityId ?? null,
      damage,
      speed,
      splashRadius: 0,
      isHoming: true,
      spriteId: 'projectile_mage',
      color: '#a855f7',
      width: 12,
      height: 12,
    });
  }
}
