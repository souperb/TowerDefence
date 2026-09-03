import { World } from '../../core/ecs/World';
import { System } from '../../core/ecs/System';
import { Entity } from '../../core/ecs/Component';
import { IVector2 } from '../../core/math/Vector2';
import { EventBus, engineEvents } from '../../core/events/EngineEvents';
import {
  CREEP_COMPONENT,
  HEALTH_COMPONENT,
  POSITION_COMPONENT,
  CreepComponent,
  HealthComponent,
  PositionComponent,
} from '../creeps/CreepComponents';
import { EconomyManager } from '../economy/EconomyManager';
import { ScoreManager } from '../scoring/ScoreManager';

export type CreepKilledCallback = (
  entity: Entity,
  creep: CreepComponent,
  position: IVector2,
  scoreAwarded: number
) => void;

export interface CreepDeathSystemOptions {
  economyManager?: EconomyManager;
  scoreManager?: ScoreManager;
  eventBus?: EventBus;
}

/**
 * ECS System monitoring creep entities with health <= 0.
 * Awards bounty gold to EconomyManager, records kill points in ScoreManager,
 * dispatches CREEP_KILLED/CREEP_DEATH events, and cleans up the entity from the World.
 */
export class CreepDeathSystem implements System {
  public name = 'CreepDeathSystem';
  public priority = 28;

  private economyManager?: EconomyManager;
  private scoreManager?: ScoreManager;
  private eventBus: EventBus;

  private totalDeaths: number = 0;
  private totalGoldAwarded: number = 0;
  private totalScoreAwarded: number = 0;
  private deathListeners: Set<CreepKilledCallback> = new Set();

  constructor(
    economyOrOptions?: EconomyManager | CreepDeathSystemOptions,
    scoreManager?: ScoreManager,
    eventBus: EventBus = engineEvents
  ) {
    if (economyOrOptions && typeof (economyOrOptions as any).getGold === 'function') {
      this.economyManager = economyOrOptions as EconomyManager;
      this.scoreManager = scoreManager;
      this.eventBus = eventBus;
    } else if (economyOrOptions) {
      const opts = economyOrOptions as CreepDeathSystemOptions;
      this.economyManager = opts.economyManager;
      this.scoreManager = opts.scoreManager;
      this.eventBus = opts.eventBus ?? engineEvents;
    } else {
      this.eventBus = eventBus;
    }
  }

  public setEconomyManager(economy: EconomyManager): void {
    this.economyManager = economy;
  }

  public getEconomyManager(): EconomyManager | undefined {
    return this.economyManager;
  }

  public setScoreManager(scoreManager: ScoreManager): void {
    this.scoreManager = scoreManager;
  }

  public getScoreManager(): ScoreManager | undefined {
    return this.scoreManager;
  }

  public setEventBus(bus: EventBus): void {
    this.eventBus = bus;
  }

  public getEventBus(): EventBus {
    return this.eventBus;
  }

  public getDeathCount(): number {
    return this.totalDeaths;
  }

  public getTotalGoldAwarded(): number {
    return this.totalGoldAwarded;
  }

  public getTotalScoreAwarded(): number {
    return this.totalScoreAwarded;
  }

  public resetStats(): void {
    this.totalDeaths = 0;
    this.totalGoldAwarded = 0;
    this.totalScoreAwarded = 0;
  }

  /**
   * Registers a callback invoked whenever a creep is processed by this system.
   */
  public onCreepKilled(callback: CreepKilledCallback): () => void {
    this.deathListeners.add(callback);
    return () => this.deathListeners.delete(callback);
  }

  public update(world: World, _dt: number): void {
    const creepEntities = world.query([CREEP_COMPONENT, HEALTH_COMPONENT]);

    for (const entity of creepEntities) {
      if (!world.isAlive(entity)) continue;

      const health = world.getComponent<HealthComponent>(entity, HEALTH_COMPONENT);
      if (!health || health.current > 0) continue;

      const creep = world.getComponent<CreepComponent>(entity, CREEP_COMPONENT);
      const pos = world.getComponent<PositionComponent>(entity, POSITION_COMPONENT);

      const bountyGold = creep?.bountyGold ?? 0;
      const baseScore = creep?.scoreValue ?? 0;
      const position: IVector2 = pos ? { x: pos.x, y: pos.y } : { x: 0, y: 0 };
      const creepType = creep?.creepType ?? 'basic';

      // 1. Credit bounty gold
      if (this.economyManager && bountyGold > 0) {
        this.economyManager.addGold(bountyGold, 'creep_bounty');
      }

      // 2. Add score points
      let scoreAwarded = baseScore;
      if (this.scoreManager) {
        scoreAwarded = this.scoreManager.addCreepKillScore(baseScore);
      }

      // Update system metrics
      this.totalDeaths++;
      this.totalGoldAwarded += bountyGold;
      this.totalScoreAwarded += scoreAwarded;

      // 3. Dispatch events
      this.eventBus.emit('CREEP_KILLED', {
        entity,
        creepType,
        bountyGold,
        scoreValue: baseScore,
        position,
        totalScoreAwarded: scoreAwarded,
      });

      this.eventBus.emit('CREEP_DEATH', {
        entity,
        creepType,
        bountyGold,
        scoreValue: baseScore,
        position,
      });

      // 4. Notify listeners
      if (creep) {
        this.notifyDeath(entity, creep, position, scoreAwarded);
      }

      // 5. Safely recycle / destroy dead entity from ECS World
      world.destroyEntity(entity);
    }
  }

  public destroy(_world: World): void {
    this.deathListeners.clear();
  }

  private notifyDeath(
    entity: Entity,
    creep: CreepComponent,
    position: IVector2,
    scoreAwarded: number
  ): void {
    for (const listener of this.deathListeners) {
      try {
        listener(entity, creep, position, scoreAwarded);
      } catch (err) {
        console.error('[CreepDeathSystem] Listener error:', err);
      }
    }
  }
}
