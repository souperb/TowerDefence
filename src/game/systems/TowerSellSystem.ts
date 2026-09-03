import { World, System, Entity } from '../../core/ecs';
import { TileGrid } from '../map/TileGrid';
import { EconomyManager } from '../economy/EconomyManager';
import { EventBus, engineEvents } from '../../core/events/EngineEvents';
import { TOWER_COMPONENT, TowerComponent } from '../towers/TowerComponents';
import { SelectionController } from '../../input/SelectionController';

export const DEFAULT_SELL_REFUND_RATE = 0.7; // 70% refund of cumulative invested gold

export type SellRejectReason = 'entity_dead' | 'not_a_tower';

export interface SellValidationResult {
  valid: boolean;
  reason?: SellRejectReason;
  refund?: number;
}

export type TowerSoldCallback = (
  entity: Entity,
  refundGold: number,
  gridX: number,
  gridY: number
) => void;

export interface TowerSellSystemConfig {
  world?: World;
  grid: TileGrid;
  economy: EconomyManager;
  selectionController?: SelectionController;
  eventBus?: EventBus;
  refundRate?: number;
}

/**
 * System handling selling placed towers, calculating partial refund of total cumulative
 * gold invested, depositing refund into the economy, releasing map tile grid cells,
 * removing entities from ECS World, and emitting engine events.
 */
export class TowerSellSystem implements System {
  public name = 'TowerSellSystem';
  public priority = 13;

  private world: World | null = null;
  private grid: TileGrid;
  private economy: EconomyManager;
  private selectionController?: SelectionController;
  private eventBus: EventBus;
  private refundRate: number;

  private soldListeners: Set<TowerSoldCallback> = new Set();

  constructor(config: TowerSellSystemConfig) {
    this.world = config.world ?? null;
    this.grid = config.grid;
    this.economy = config.economy;
    this.selectionController = config.selectionController;
    this.eventBus = config.eventBus ?? engineEvents;
    this.refundRate = config.refundRate ?? DEFAULT_SELL_REFUND_RATE;
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

  public setGrid(grid: TileGrid): void {
    this.grid = grid;
  }

  public setEconomy(economy: EconomyManager): void {
    this.economy = economy;
  }

  public setSelectionController(controller?: SelectionController): void {
    this.selectionController = controller;
  }

  public setEventBus(eventBus: EventBus): void {
    this.eventBus = eventBus;
  }

  public setRefundRate(rate: number): void {
    if (rate < 0 || rate > 1) {
      throw new Error('Refund rate must be between 0.0 and 1.0');
    }
    this.refundRate = rate;
  }

  public getRefundRate(): number {
    return this.refundRate;
  }

  /**
   * Calculates the sell refund value for a given tower entity: Math.floor(totalInvestedCost * refundRate).
   */
  public calculateRefund(world: World, entity: Entity): number {
    if (!world.isAlive(entity)) return 0;
    const tower = world.getComponent<TowerComponent>(entity, TOWER_COMPONENT);
    if (!tower) return 0;
    return Math.floor(tower.totalInvestedCost * this.refundRate);
  }

  /**
   * Validates whether a tower entity is eligible to be sold.
   */
  public canSellTower(world: World, entity: Entity): SellValidationResult {
    if (!world.isAlive(entity)) {
      return { valid: false, reason: 'entity_dead' };
    }

    const tower = world.getComponent<TowerComponent>(entity, TOWER_COMPONENT);
    if (!tower) {
      return { valid: false, reason: 'not_a_tower' };
    }

    const refund = this.calculateRefund(world, entity);
    return { valid: true, refund };
  }

  /**
   * Sells a placed tower:
   * 1. Computes 70% refund of cumulative invested gold.
   * 2. Credits refund gold to EconomyManager.
   * 3. Frees the underlying grid tile in TileGrid.
   * 4. Deselects the tower in SelectionController if selected.
   * 5. Emits TOWER_SOLD event bus notification.
   * 6. Destroys the tower entity in the ECS World.
   *
   * @param world The ECS World instance.
   * @param entity The tower Entity to sell.
   * @returns true if sell succeeded, false if rejected.
   */
  public sellTower(world: World, entity: Entity): boolean {
    const validation = this.canSellTower(world, entity);
    if (!validation.valid || validation.refund === undefined) {
      return false;
    }

    const tower = world.getComponent<TowerComponent>(entity, TOWER_COMPONENT)!;
    const refund = validation.refund;
    const gridX = tower.gridX;
    const gridY = tower.gridY;
    const towerType = tower.towerType;
    const tier = tower.tier;
    const totalInvestedCost = tower.totalInvestedCost;

    // Credit refund to player economy
    this.economy.addGold(refund, 'tower_sell');

    // Free the grid tile
    this.grid.freeTile(gridX, gridY);

    // Deselect if currently selected
    if (this.selectionController && this.selectionController.getSelectedEntity() === entity) {
      this.selectionController.clearSelection();
    }

    // Emit event bus notification
    this.eventBus.emit('TOWER_SOLD', {
      entity,
      towerType,
      tier,
      refundGold: refund,
      totalInvestedCost,
      gridX,
      gridY,
    });

    // Notify local subscribers
    this.notifySold(entity, refund, gridX, gridY);

    // Destroy entity in ECS World
    world.destroyEntity(entity);

    return true;
  }

  public update(_world: World, _dt: number): void {
    // Selling is interaction-driven
  }

  public destroy(_world: World): void {
    this.soldListeners.clear();
    this.world = null;
  }

  public onTowerSold(callback: TowerSoldCallback): () => void {
    this.soldListeners.add(callback);
    return () => this.soldListeners.delete(callback);
  }

  private notifySold(entity: Entity, refundGold: number, gridX: number, gridY: number): void {
    for (const listener of this.soldListeners) {
      try {
        listener(entity, refundGold, gridX, gridY);
      } catch (err) {
        console.error('[TowerSellSystem] Sold listener error:', err);
      }
    }
  }
}
