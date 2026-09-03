import { World, System, Entity } from '../../core/ecs';
import { EventBus, engineEvents } from '../../core/events/EngineEvents';
import { EconomyManager } from '../economy/EconomyManager';
import {
  TOWER_COMPONENT,
  TowerComponent,
} from '../towers/TowerComponents';
import {
  MAX_TOWER_TIER,
  TowerTierStats,
  getTowerTierStats,
  getUpgradeCost,
  getNextTierStats,
} from '../towers/TowerUpgradeDefinitions';

export type UpgradeRejectReason =
  | 'entity_dead'
  | 'not_a_tower'
  | 'max_tier'
  | 'insufficient_gold';

export interface UpgradeValidationResult {
  valid: boolean;
  reason?: UpgradeRejectReason;
  cost?: number;
  nextTier?: number;
}

export type TowerUpgradedCallback = (
  entity: Entity,
  tower: TowerComponent,
  upgradeCost: number
) => void;

export type UpgradeRejectedCallback = (
  entity: Entity,
  reason: UpgradeRejectReason
) => void;

export interface TowerUpgradeSystemConfig {
  world?: World;
  economy: EconomyManager;
  eventBus?: EventBus;
}

/**
 * System handling tower upgrades, verifying eligibility, deducting upgrade gold,
 * incrementing tier, recalculating combat stats, and publishing engine events.
 */
export class TowerUpgradeSystem implements System {
  public name = 'TowerUpgradeSystem';
  public priority = 11;

  private world: World | null = null;
  private economy: EconomyManager;
  private eventBus: EventBus;

  private upgradedListeners: Set<TowerUpgradedCallback> = new Set();
  private rejectedListeners: Set<UpgradeRejectedCallback> = new Set();

  constructor(config: TowerUpgradeSystemConfig) {
    this.world = config.world ?? null;
    this.economy = config.economy;
    this.eventBus = config.eventBus ?? engineEvents;
  }

  public init(world: World): void {
    this.world = world;
  }

  public setWorld(world: World): void {
    this.world = world;
  }

  public getWorld(): World | null {
    return this.world;
  }

  public setEconomy(economy: EconomyManager): void {
    this.economy = economy;
  }

  public setEventBus(eventBus: EventBus): void {
    this.eventBus = eventBus;
  }

  /**
   * Validates whether the given tower entity can be upgraded.
   */
  public canUpgradeTower(world: World, entity: Entity): UpgradeValidationResult {
    if (!world.isAlive(entity)) {
      return { valid: false, reason: 'entity_dead' };
    }

    const tower = world.getComponent<TowerComponent>(entity, TOWER_COMPONENT);
    if (!tower) {
      return { valid: false, reason: 'not_a_tower' };
    }

    if (tower.tier >= MAX_TOWER_TIER) {
      return { valid: false, reason: 'max_tier' };
    }

    const cost = getUpgradeCost(tower.towerType, tower.tier);
    if (cost === null || cost <= 0) {
      return { valid: false, reason: 'max_tier' };
    }

    if (!this.economy.canAfford(cost)) {
      return { valid: false, reason: 'insufficient_gold', cost, nextTier: tower.tier + 1 };
    }

    return { valid: true, cost, nextTier: tower.tier + 1 };
  }

  /**
   * Returns the upgrade cost for the next tier of a tower entity, or null if ineligible.
   */
  public getUpgradeCost(world: World, entity: Entity): number | null {
    if (!world.isAlive(entity)) return null;
    const tower = world.getComponent<TowerComponent>(entity, TOWER_COMPONENT);
    if (!tower) return null;
    return getUpgradeCost(tower.towerType, tower.tier);
  }

  /**
   * Returns the next tier's stats for a tower entity, or null if at max tier.
   */
  public getNextTierStats(world: World, entity: Entity): TowerTierStats | null {
    if (!world.isAlive(entity)) return null;
    const tower = world.getComponent<TowerComponent>(entity, TOWER_COMPONENT);
    if (!tower) return null;
    return getNextTierStats(tower.towerType, tower.tier);
  }

  /**
   * Attempts to upgrade the specified tower entity to its next tier.
   *
   * @param world The ECS World instance.
   * @param entity The tower Entity to upgrade.
   * @returns true if upgrade succeeded, false if rejected.
   */
  public upgradeTower(world: World, entity: Entity): boolean {
    const validation = this.canUpgradeTower(world, entity);
    if (!validation.valid || validation.cost === undefined) {
      this.notifyRejected(entity, validation.reason ?? 'not_a_tower');
      return false;
    }

    const tower = world.getComponent<TowerComponent>(entity, TOWER_COMPONENT)!;
    const cost = validation.cost;

    // Deduct gold
    const deducted = this.economy.deductGold(cost, 'tower_upgrade');
    if (!deducted) {
      this.notifyRejected(entity, 'insufficient_gold');
      return false;
    }

    const previousTier = tower.tier;
    const newTier = previousTier + 1;
    const newStats = getTowerTierStats(tower.towerType, newTier);

    // Apply upgraded stats
    tower.tier = newTier;
    tower.damage = newStats.damage;
    tower.range = newStats.range;
    tower.fireRate = newStats.fireRate;
    tower.splashRadius = newStats.splashRadius;
    tower.totalInvestedCost += cost;

    // Emit event bus notification
    this.eventBus.emit('TOWER_UPGRADED', {
      entity,
      towerType: tower.towerType,
      newTier: tower.tier,
      previousTier,
      upgradeCost: cost,
      totalInvestedCost: tower.totalInvestedCost,
      damage: tower.damage,
      range: tower.range,
      fireRate: tower.fireRate,
      splashRadius: tower.splashRadius,
      gridX: tower.gridX,
      gridY: tower.gridY,
    });

    // Notify local subscribers
    this.notifyUpgraded(entity, tower, cost);
    return true;
  }

  public update(_world: World, _dt: number): void {
    // Upgrades are interaction-driven
  }

  public destroy(_world: World): void {
    this.upgradedListeners.clear();
    this.rejectedListeners.clear();
    this.world = null;
  }

  public onTowerUpgraded(callback: TowerUpgradedCallback): () => void {
    this.upgradedListeners.add(callback);
    return () => this.upgradedListeners.delete(callback);
  }

  public onUpgradeRejected(callback: UpgradeRejectedCallback): () => void {
    this.rejectedListeners.add(callback);
    return () => this.rejectedListeners.delete(callback);
  }

  private notifyUpgraded(entity: Entity, tower: TowerComponent, cost: number): void {
    for (const listener of this.upgradedListeners) {
      try {
        listener(entity, tower, cost);
      } catch (err) {
        console.error('[TowerUpgradeSystem] Upgraded listener error:', err);
      }
    }
  }

  private notifyRejected(entity: Entity, reason: UpgradeRejectReason): void {
    for (const listener of this.rejectedListeners) {
      try {
        listener(entity, reason);
      } catch (err) {
        console.error('[TowerUpgradeSystem] Rejected listener error:', err);
      }
    }
  }
}
