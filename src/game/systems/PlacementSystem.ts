import { World, System, Entity } from '../../core/ecs';
import { TileGrid } from '../map/TileGrid';
import { TileType } from '../map/TileType';
import { TowerType } from '../towers/TowerComponents';
import { getTowerDefinition } from '../towers/TowerCatalog';
import { TowerFactory } from '../towers/TowerFactory';
import { EconomyManager } from '../economy/EconomyManager';
import { PlacementController } from '../../input/PlacementController';

export type PlacementRejectReason =
  | 'out_of_bounds'
  | 'not_buildable'
  | 'occupied'
  | 'path'
  | 'blocked'
  | 'insufficient_gold';

export interface PlacementValidationResult {
  valid: boolean;
  reason?: PlacementRejectReason;
}

export type TowerPlacedCallback = (
  entity: Entity,
  towerType: TowerType,
  gridX: number,
  gridY: number
) => void;

export type PlacementRejectedCallback = (
  towerType: TowerType,
  gridX: number,
  gridY: number,
  reason: PlacementRejectReason
) => void;

export interface PlacementSystemConfig {
  grid: TileGrid;
  economy: EconomyManager;
  controller?: PlacementController;
}

export class PlacementSystem implements System {
  public name = 'PlacementSystem';
  public priority = 10;

  private world: World | null = null;
  private grid: TileGrid;
  private economy: EconomyManager;
  private controller?: PlacementController;

  private placedListeners: Set<TowerPlacedCallback> = new Set();
  private rejectedListeners: Set<PlacementRejectedCallback> = new Set();
  private unsubscribeController?: () => void;

  constructor(config: PlacementSystemConfig) {
    this.grid = config.grid;
    this.economy = config.economy;
    this.controller = config.controller;

    if (this.controller) {
      this.bindController(this.controller);
    }
  }

  public init(world: World): void {
    this.world = world;
  }

  public setWorld(world: World): void {
    this.world = world;
  }

  public setGrid(grid: TileGrid): void {
    this.grid = grid;
  }

  public setEconomy(economy: EconomyManager): void {
    this.economy = economy;
  }

  public setController(controller?: PlacementController): void {
    if (this.unsubscribeController) {
      this.unsubscribeController();
      this.unsubscribeController = undefined;
    }
    this.controller = controller;
    if (this.controller) {
      this.bindController(this.controller);
    }
  }

  private bindController(controller: PlacementController): void {
    this.unsubscribeController = controller.onPlaceRequested((towerType, gridPos) => {
      this.tryPlaceTower(towerType, gridPos.x, gridPos.y);
    });
  }

  /**
   * Validates whether a tower can be placed at the target grid position.
   */
  public canPlaceTower(type: TowerType, gridX: number, gridY: number): PlacementValidationResult {
    if (!this.grid.isWithinBounds(gridX, gridY)) {
      return { valid: false, reason: 'out_of_bounds' };
    }

    const tile = this.grid.getTile(gridX, gridY);
    if (tile === TileType.Path) {
      return { valid: false, reason: 'path' };
    }
    if (tile === TileType.Blocked) {
      return { valid: false, reason: 'blocked' };
    }
    if (tile === TileType.Occupied) {
      return { valid: false, reason: 'occupied' };
    }
    if (tile !== TileType.Buildable) {
      return { valid: false, reason: 'not_buildable' };
    }

    const def = getTowerDefinition(type);
    if (!this.economy.canAfford(def.baseCost)) {
      return { valid: false, reason: 'insufficient_gold' };
    }

    return { valid: true };
  }

  /**
   * Attempts to build a tower at the given grid coordinates.
   * If valid:
   *  - Deducts gold from EconomyManager
   *  - Marks tile occupied in TileGrid
   *  - Instantiates tower entity in ECS World
   *  - Cancels / exits active placement mode on controller
   *  - Notifies listeners
   * If invalid:
   *  - Rejects placement without deducting gold or altering tile state
   *  - Notifies rejected listeners
   *
   * @returns The created entity ID on success, or null on rejection.
   */
  public tryPlaceTower(type: TowerType, gridX: number, gridY: number): Entity | null {
    if (!this.world) {
      throw new Error('[PlacementSystem] ECS World is not initialized. Call init(world) first.');
    }

    const validation = this.canPlaceTower(type, gridX, gridY);
    if (!validation.valid) {
      this.notifyRejected(type, gridX, gridY, validation.reason ?? 'not_buildable');
      return null;
    }

    const def = getTowerDefinition(type);

    // Deduct economy gold
    const deducted = this.economy.deductGold(def.baseCost);
    if (!deducted) {
      this.notifyRejected(type, gridX, gridY, 'insufficient_gold');
      return null;
    }

    // Mark tile occupied in grid
    const occupied = this.grid.occupyTile(gridX, gridY);
    if (!occupied) {
      // Refund gold if tile occupation fails unexpectedly
      this.economy.addGold(def.baseCost);
      this.notifyRejected(type, gridX, gridY, 'not_buildable');
      return null;
    }

    // Spawn tower entity in ECS World
    const entity = TowerFactory.createTower(
      this.world,
      type,
      gridX,
      gridY,
      this.grid.tileSize
    );

    // Exit active placement mode
    if (this.controller) {
      this.controller.cancelPlacement();
    }

    this.notifyPlaced(entity, type, gridX, gridY);
    return entity;
  }

  public update(_world: World, _dt: number): void {
    // Placement actions are event-driven, no per-tick work needed in base placement system
  }

  public destroy(_world: World): void {
    if (this.unsubscribeController) {
      this.unsubscribeController();
      this.unsubscribeController = undefined;
    }
    this.placedListeners.clear();
    this.rejectedListeners.clear();
    this.world = null;
  }

  public onTowerPlaced(callback: TowerPlacedCallback): () => void {
    this.placedListeners.add(callback);
    return () => this.placedListeners.delete(callback);
  }

  public onPlacementRejected(callback: PlacementRejectedCallback): () => void {
    this.rejectedListeners.add(callback);
    return () => this.rejectedListeners.delete(callback);
  }

  private notifyPlaced(entity: Entity, type: TowerType, gridX: number, gridY: number): void {
    for (const listener of this.placedListeners) {
      try {
        listener(entity, type, gridX, gridY);
      } catch (err) {
        console.error('[PlacementSystem] Listener error:', err);
      }
    }
  }

  private notifyRejected(
    type: TowerType,
    gridX: number,
    gridY: number,
    reason: PlacementRejectReason
  ): void {
    for (const listener of this.rejectedListeners) {
      try {
        listener(type, gridX, gridY, reason);
      } catch (err) {
        console.error('[PlacementSystem] Rejected listener error:', err);
      }
    }
  }
}
