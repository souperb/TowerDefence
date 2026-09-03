import { World } from '../../core/ecs/World';
import { Entity } from '../../core/ecs/Component';
import { IVector2 } from '../../core/math/Vector2';
import { EventBus, engineEvents } from '../../core/events/EngineEvents';
import {
  CREEP_COMPONENT,
  HEALTH_COMPONENT,
  POSITION_COMPONENT,
  HealthComponent,
  PositionComponent,
} from '../creeps/CreepComponents';

export interface DirectDamageResult {
  entity: Entity;
  damageDealt: number;
  remainingHp: number;
  maxHp: number;
  isKilled: boolean;
}

export interface SplashDamageTargetResult {
  entity: Entity;
  distance: number;
  damageDealt: number;
  remainingHp: number;
  isKilled: boolean;
}

export interface SplashDamageResult {
  impactPosition: IVector2;
  splashRadius: number;
  baseDamage: number;
  targetsHit: SplashDamageTargetResult[];
  totalDamageDealt: number;
  totalKills: number;
}

export type DamageFalloffType = 'none' | 'linear';

export interface SplashDamageOptions {
  falloff?: DamageFalloffType;
  minDamagePercent?: number; // e.g. 0.25 for 25% minimum damage at edge
  eventBus?: EventBus;
}

export class DamageCalculator {
  /**
   * Applies single-target direct damage to an entity.
   * Decrements health, clamps to zero, and fires CREEP_DAMAGED.
   * CREEP_DEATH is emitted by CreepDeathSystem when it processes the dead entity.
   */
  public static applyDirectDamage(
    world: World,
    targetEntity: Entity,
    damage: number,
    bus: EventBus = engineEvents
  ): DirectDamageResult | null {
    if (!world.isAlive(targetEntity)) {
      return null;
    }

    const health = world.getComponent<HealthComponent>(targetEntity, HEALTH_COMPONENT);
    if (!health || health.current <= 0) {
      return null;
    }

    const prevHp = health.current;
    const actualDamage = Math.max(0, Math.min(prevHp, damage));
    const remainingHp = Math.max(0, prevHp - actualDamage);

    health.current = remainingHp;
    const isKilled = remainingHp <= 0;

    // Dispatch CREEP_DAMAGED event
    bus.emit('CREEP_DAMAGED', {
      entity: targetEntity,
      damage: actualDamage,
      remainingHp,
      maxHp: health.max,
    });

    return {
      entity: targetEntity,
      damageDealt: actualDamage,
      remainingHp,
      maxHp: health.max,
      isKilled,
    };
  }

  /**
   * Applies area-of-effect splash damage to all creeps within splashRadius of impactPosition.
   */
  public static applySplashDamage(
    world: World,
    impactPosition: IVector2,
    splashRadius: number,
    baseDamage: number,
    options: SplashDamageOptions = {}
  ): SplashDamageResult {
    const falloff = options.falloff ?? 'linear';
    const minDamagePct = options.minDamagePercent ?? 0.25;
    const bus = options.eventBus ?? engineEvents;

    const creepEntities = world.query([CREEP_COMPONENT, HEALTH_COMPONENT, POSITION_COMPONENT]);
    const targetsHit: SplashDamageTargetResult[] = [];
    let totalDamageDealt = 0;
    let totalKills = 0;

    for (const entity of creepEntities) {
      if (!world.isAlive(entity)) continue;

      const health = world.getComponent<HealthComponent>(entity, HEALTH_COMPONENT);
      if (!health || health.current <= 0) continue;

      const pos = world.getComponent<PositionComponent>(entity, POSITION_COMPONENT);
      if (!pos) continue;

      const dx = pos.x - impactPosition.x;
      const dy = pos.y - impactPosition.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= splashRadius) {
        let finalDamage = baseDamage;

        if (falloff === 'linear' && splashRadius > 0) {
          // Distance falloff from 1.0 (center) down to minDamagePct (edge)
          const factor = 1 - (dist / splashRadius) * (1 - minDamagePct);
          finalDamage = Math.round(baseDamage * Math.max(minDamagePct, factor));
        }

        const res = this.applyDirectDamage(world, entity, finalDamage, bus);
        if (res) {
          targetsHit.push({
            entity,
            distance: dist,
            damageDealt: res.damageDealt,
            remainingHp: res.remainingHp,
            isKilled: res.isKilled,
          });
          totalDamageDealt += res.damageDealt;
          if (res.isKilled) {
            totalKills++;
          }
        }
      }
    }

    return {
      impactPosition: { ...impactPosition },
      splashRadius,
      baseDamage,
      targetsHit,
      totalDamageDealt,
      totalKills,
    };
  }
}
