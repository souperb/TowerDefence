import { describe, it, expect, beforeEach } from 'vitest';
import { World } from '../../src/core/ecs/World';
import { TileGrid } from '../../src/game/map/TileGrid';
import { TileType } from '../../src/game/map/TileType';
import { EventBus } from '../../src/core/events/EngineEvents';
import { EconomyManager } from '../../src/game/economy/EconomyManager';
import {
  TOWER_COMPONENT,
  TowerComponent,
} from '../../src/game/towers/TowerComponents';
import { TowerFactory } from '../../src/game/towers/TowerFactory';
import { TowerUpgradeSystem } from '../../src/game/systems/TowerUpgradeSystem';
import { TowerSellSystem } from '../../src/game/systems/TowerSellSystem';
import { SelectionController } from '../../src/input/SelectionController';

describe('TowerSellSystem (TASK-07-03)', () => {
  let world: World;
  let grid: TileGrid;
  let economy: EconomyManager;
  let eventBus: EventBus;
  let selectionController: SelectionController;
  let upgradeSystem: TowerUpgradeSystem;
  let sellSystem: TowerSellSystem;

  beforeEach(() => {
    world = new World();
    grid = new TileGrid(10, 10, 32);
    eventBus = new EventBus();
    economy = new EconomyManager(300, eventBus);
    selectionController = new SelectionController({
      world,
      grid,
      enableKeyboardShortcuts: false,
    });
    upgradeSystem = new TowerUpgradeSystem({ world, economy, eventBus });
    sellSystem = new TowerSellSystem({
      world,
      grid,
      economy,
      selectionController,
      eventBus,
      refundRate: 0.7,
    });

    world.addSystem(upgradeSystem);
    world.addSystem(sellSystem);
  });

  it('should calculate 70% refund of cumulative invested gold correctly', () => {
    // Archer baseCost = 100 -> 70% of 100 = 70
    const archerEntity = TowerFactory.createTower(world, 'archer', 2, 2);
    expect(sellSystem.calculateRefund(world, archerEntity)).toBe(70);

    // Cannon baseCost = 150 -> 70% of 150 = 105
    const cannonEntity = TowerFactory.createTower(world, 'cannon', 3, 3);
    expect(sellSystem.calculateRefund(world, cannonEntity)).toBe(105);

    // Mage baseCost = 200 -> 70% of 200 = 140
    const mageEntity = TowerFactory.createTower(world, 'mage', 4, 4);
    expect(sellSystem.calculateRefund(world, mageEntity)).toBe(140);
  });

  it('should successfully sell a Tier 1 tower: credit refund, free tile, destroy entity, emit TOWER_SOLD event', () => {
    const gridX = 3;
    const gridY = 5;

    // Occupy tile and create tower
    grid.occupyTile(gridX, gridY);
    expect(grid.isOccupied(gridX, gridY)).toBe(true);

    const towerEntity = TowerFactory.createTower(world, 'archer', gridX, gridY);
    const initialGold = economy.getGold(); // 300
    const expectedRefund = Math.floor(100 * 0.7); // 70

    let eventFired = false;
    eventBus.on('TOWER_SOLD', (data) => {
      eventFired = true;
      expect(data.entity).toBe(towerEntity);
      expect(data.towerType).toBe('archer');
      expect(data.tier).toBe(1);
      expect(data.refundGold).toBe(expectedRefund);
      expect(data.totalInvestedCost).toBe(100);
      expect(data.gridX).toBe(gridX);
      expect(data.gridY).toBe(gridY);
    });

    const success = sellSystem.sellTower(world, towerEntity);
    expect(success).toBe(true);
    expect(eventFired).toBe(true);

    // Gold credited
    expect(economy.getGold()).toBe(initialGold + expectedRefund);

    // Grid tile freed back to Buildable
    expect(grid.isOccupied(gridX, gridY)).toBe(false);
    expect(grid.isBuildable(gridX, gridY)).toBe(true);
    expect(grid.getTile(gridX, gridY)).toBe(TileType.Buildable);

    // Entity removed from ECS World
    expect(world.isAlive(towerEntity)).toBe(false);
    expect(world.getComponent(towerEntity, TOWER_COMPONENT)).toBeUndefined();
  });

  it('should calculate refund on cumulative invested gold for upgraded towers', () => {
    const gridX = 1;
    const gridY = 1;
    grid.occupyTile(gridX, gridY);

    const towerEntity = TowerFactory.createTower(world, 'cannon', gridX, gridY);
    // Base cost: 150
    // Upgrade 1 -> 2: 120 (totalInvested: 270)
    // Upgrade 2 -> 3: 200 (totalInvested: 470)

    economy.setGold(1000); // Plenty of gold
    upgradeSystem.upgradeTower(world, towerEntity);
    upgradeSystem.upgradeTower(world, towerEntity);

    const tower = world.getComponent<TowerComponent>(towerEntity, TOWER_COMPONENT)!;
    expect(tower.tier).toBe(3);
    expect(tower.totalInvestedCost).toBe(470);

    const expectedRefund = Math.floor(470 * 0.7); // 329
    expect(sellSystem.calculateRefund(world, towerEntity)).toBe(expectedRefund);

    const goldBeforeSell = economy.getGold();
    sellSystem.sellTower(world, towerEntity);

    expect(economy.getGold()).toBe(goldBeforeSell + expectedRefund);
    expect(world.isAlive(towerEntity)).toBe(false);
    expect(grid.isBuildable(gridX, gridY)).toBe(true);
  });

  it('should automatically clear selection when the selected tower is sold', () => {
    grid.occupyTile(2, 2);
    const towerEntity = TowerFactory.createTower(world, 'archer', 2, 2);

    selectionController.selectEntity(towerEntity, { x: 2, y: 2 });
    expect(selectionController.getSelectedEntity()).toBe(towerEntity);
    expect(selectionController.hasSelection()).toBe(true);

    sellSystem.sellTower(world, towerEntity);

    expect(selectionController.getSelectedEntity()).toBeNull();
    expect(selectionController.hasSelection()).toBe(false);
  });

  it('should not clear selection if a different tower is sold', () => {
    grid.occupyTile(1, 1);
    grid.occupyTile(2, 2);
    const tower1 = TowerFactory.createTower(world, 'archer', 1, 1);
    const tower2 = TowerFactory.createTower(world, 'cannon', 2, 2);

    selectionController.selectEntity(tower1, { x: 1, y: 1 });

    sellSystem.sellTower(world, tower2);

    expect(selectionController.getSelectedEntity()).toBe(tower1);
  });

  it('should reject selling non-existent or dead entities', () => {
    const deadEntity = 8888 as any;
    expect(sellSystem.canSellTower(world, deadEntity).valid).toBe(false);
    expect(sellSystem.sellTower(world, deadEntity)).toBe(false);

    const emptyEntity = world.createEntity();
    expect(sellSystem.canSellTower(world, emptyEntity).valid).toBe(false);
    expect(sellSystem.sellTower(world, emptyEntity)).toBe(false);
  });

  it('should notify local callbacks on sold tower', () => {
    grid.occupyTile(0, 0);
    const towerEntity = TowerFactory.createTower(world, 'mage', 0, 0);

    let notifiedEntity: any = null;
    let notifiedRefund = 0;
    let notifiedX = -1;
    let notifiedY = -1;

    sellSystem.onTowerSold((entity, refund, x, y) => {
      notifiedEntity = entity;
      notifiedRefund = refund;
      notifiedX = x;
      notifiedY = y;
    });

    sellSystem.sellTower(world, towerEntity);

    expect(notifiedEntity).toBe(towerEntity);
    expect(notifiedRefund).toBe(140);
    expect(notifiedX).toBe(0);
    expect(notifiedY).toBe(0);
  });

  it('should support customized refund rate', () => {
    sellSystem.setRefundRate(0.5); // 50%
    expect(sellSystem.getRefundRate()).toBe(0.5);

    const towerEntity = TowerFactory.createTower(world, 'archer', 0, 0);
    expect(sellSystem.calculateRefund(world, towerEntity)).toBe(50);

    expect(() => sellSystem.setRefundRate(1.5)).toThrow();
    expect(() => sellSystem.setRefundRate(-0.1)).toThrow();
  });
});
