import { World } from '../../core/ecs/World';
import { System } from '../../core/ecs/System';
import { Entity } from '../../core/ecs/Component';
import { IVector2 } from '../../core/math/Vector2';
import {
  TOWER_COMPONENT,
  POSITION_COMPONENT as TOWER_POS_COMP,
  TowerComponent,
  PositionComponent as TowerPositionComponent,
} from '../towers/TowerComponents';
import {
  HEALTH_COMPONENT,
  POSITION_COMPONENT as CREEP_POS_COMP,
  HealthComponent,
  PositionComponent as CreepPositionComponent,
} from '../creeps/CreepComponents';
import { ProjectileFactory } from '../projectiles/ProjectileFactory';
import { getTowerDefinition } from '../towers/TowerCatalog';

export type TowerFiredCallback = (
  towerEntity: Entity,
  targetEntity: Entity,
  projectileEntity: Entity
) => void;

export class TowerCombatSystem implements System {
  public name = 'TowerCombatSystem';
  public priority = 20;

  private firedListeners: Set<TowerFiredCallback> = new Set();

  public update(world: World, dt: number): void {
    const towerEntities = world.query([TOWER_COMPONENT]);

    for (const towerEntity of towerEntities) {
      const tower = world.getComponent<TowerComponent>(towerEntity, TOWER_COMPONENT);
      if (!tower) continue;

      // Decrement cooldown timer
      if (tower.cooldownRemaining > 0) {
        tower.cooldownRemaining = Math.max(0, tower.cooldownRemaining - dt);
      }

      // Check if ready to attack and has a target
      if (tower.cooldownRemaining <= 0 && tower.targetEntityId !== null) {
        const targetEntity = tower.targetEntityId;

        // Verify target is still valid (alive and in range)
        if (!world.isAlive(targetEntity)) {
          tower.targetEntityId = null;
          continue;
        }

        const targetHealth = world.getComponent<HealthComponent>(targetEntity, HEALTH_COMPONENT);
        if (!targetHealth || targetHealth.current <= 0) {
          tower.targetEntityId = null;
          continue;
        }

        const towerPos = this.getEntityPosition(world, towerEntity);
        const targetPos = this.getEntityPosition(world, targetEntity);
        if (!towerPos || !targetPos) {
          continue;
        }

        const dx = targetPos.x - towerPos.x;
        const dy = targetPos.y - towerPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > tower.range) {
          // Target out of range
          tower.targetEntityId = null;
          continue;
        }

        // Fire projectile
        const def = getTowerDefinition(tower.towerType);
        const damage = tower.damage ?? def.damage;
        const splashRadius = tower.splashRadius ?? def.splashRadius;
        const projectile = ProjectileFactory.createForTower(
          world,
          tower.towerType,
          towerPos,
          targetPos,
          targetEntity,
          damage,
          splashRadius
        );

        // Reset cooldown
        tower.cooldownRemaining = tower.fireRate > 0 ? 1 / tower.fireRate : 1;

        this.notifyFired(towerEntity, targetEntity, projectile);
      }
    }
  }

  public onTowerFired(callback: TowerFiredCallback): () => void {
    this.firedListeners.add(callback);
    return () => this.firedListeners.delete(callback);
  }

  public destroy(_world: World): void {
    this.firedListeners.clear();
  }

  private notifyFired(towerEntity: Entity, targetEntity: Entity, projectileEntity: Entity): void {
    for (const listener of this.firedListeners) {
      try {
        listener(towerEntity, targetEntity, projectileEntity);
      } catch (err) {
        console.error('[TowerCombatSystem] Listener error:', err);
      }
    }
  }

  private getEntityPosition(world: World, entity: Entity): IVector2 | null {
    const pos =
      world.getComponent<CreepPositionComponent>(entity, CREEP_POS_COMP) ??
      world.getComponent<TowerPositionComponent>(entity, TOWER_POS_COMP);

    if (pos) {
      return { x: pos.x, y: pos.y };
    }
    return null;
  }
}
