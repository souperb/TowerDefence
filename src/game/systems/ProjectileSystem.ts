import { World } from '../../core/ecs/World';
import { System } from '../../core/ecs/System';
import { Entity } from '../../core/ecs/Component';
import { IVector2 } from '../../core/math/Vector2';
import {
  PROJECTILE_COMPONENT,
  POSITION_COMPONENT,
  SPRITE_COMPONENT,
  ProjectileComponent,
  PositionComponent,
  SpriteComponent,
} from '../projectiles/ProjectileComponents';
import {
  CREEP_COMPONENT,
  POSITION_COMPONENT as CREEP_POS_COMP,
  PositionComponent as CreepPositionComponent,
} from '../creeps/CreepComponents';
import { DamageCalculator } from '../combat/DamageCalculator';

export type ProjectileHitCallback = (
  projectileEntity: Entity,
  impactPosition: IVector2,
  damage: number,
  splashRadius: number,
  towerType: string
) => void;

export class ProjectileSystem implements System {
  public name = 'ProjectileSystem';
  public priority = 25;

  private hitListeners: Set<ProjectileHitCallback> = new Set();

  public update(world: World, dt: number): void {
    if (dt <= 0) return;

    const projectileEntities = world.query([PROJECTILE_COMPONENT, POSITION_COMPONENT]);

    for (const entity of projectileEntities) {
      if (!world.isAlive(entity)) continue;

      const proj = world.getComponent<ProjectileComponent>(entity, PROJECTILE_COMPONENT);
      const pos = world.getComponent<PositionComponent>(entity, POSITION_COMPONENT);
      const sprite = world.getComponent<SpriteComponent>(entity, SPRITE_COMPONENT);

      if (!proj || !pos) continue;

      const targetValid = this.isTargetValid(world, proj);

      // If homing, track live target entity's position
      if (proj.isHoming && targetValid) {
        const targetPos = world.getComponent<CreepPositionComponent>(
          proj.targetEntityId!,
          CREEP_POS_COMP
        );
        if (targetPos) {
          proj.targetPosition.x = targetPos.x;
          proj.targetPosition.y = targetPos.y;
        }
      }

      const dx = proj.targetPosition.x - pos.x;
      const dy = proj.targetPosition.y - pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const moveDist = proj.speed * dt;

      // Check for impact (reached target)
      if (dist <= moveDist || dist < 1e-4) {
        pos.x = proj.targetPosition.x;
        pos.y = proj.targetPosition.y;

        const impactPos: IVector2 = { x: pos.x, y: pos.y };

        // Apply damage
        if (proj.splashRadius > 0) {
          DamageCalculator.applySplashDamage(
            world,
            impactPos,
            proj.splashRadius,
            proj.damage
          );
        } else if (targetValid) {
          DamageCalculator.applyDirectDamage(
            world,
            proj.targetEntityId!,
            proj.damage
          );
        }

        this.notifyHit(entity, impactPos, proj.damage, proj.splashRadius, String(proj.towerType));

        // Despawn projectile entity
        world.destroyEntity(entity);
      } else {
        // Advance projectile towards target
        const dirX = dx / dist;
        const dirY = dy / dist;

        pos.x += dirX * moveDist;
        pos.y += dirY * moveDist;

        if (sprite) {
          sprite.rotation = Math.atan2(dirY, dirX);
        }
      }
    }
  }

  public onProjectileHit(callback: ProjectileHitCallback): () => void {
    this.hitListeners.add(callback);
    return () => this.hitListeners.delete(callback);
  }

  public destroy(_world: World): void {
    this.hitListeners.clear();
  }

  /** True if the target ID still refers to the same live creep it was fired at. */
  private isTargetValid(world: World, proj: ProjectileComponent): boolean {
    const id = proj.targetEntityId;
    if (id === null || !world.isAlive(id)) return false;
    if (proj.targetGeneration !== undefined && world.getGeneration(id) !== proj.targetGeneration) {
      return false;
    }
    return world.hasComponent(id, CREEP_COMPONENT);
  }

  private notifyHit(
    projectileEntity: Entity,
    impactPosition: IVector2,
    damage: number,
    splashRadius: number,
    towerType: string
  ): void {
    for (const listener of this.hitListeners) {
      try {
        listener(projectileEntity, impactPosition, damage, splashRadius, towerType);
      } catch (err) {
        console.error('[ProjectileSystem] Hit listener error:', err);
      }
    }
  }
}
