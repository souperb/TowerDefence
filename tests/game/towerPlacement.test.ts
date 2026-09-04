import { describe, it, expect, beforeEach } from 'vitest';
import { World } from '../../src/core/ecs/World';
import { TileGrid } from '../../src/game/map/TileGrid';
import { TileType } from '../../src/game/map/TileType';
import {
  getTowerDefinition,
  getAllTowerDefinitions,
} from '../../src/game/towers/TowerCatalog';
import {
  POSITION_COMPONENT,
  TOWER_COMPONENT,
  SPRITE_COMPONENT,
  TowerComponent,
  PositionComponent,
  SpriteComponent,
} from '../../src/game/towers/TowerComponents';
import { TowerFactory } from '../../src/game/towers/TowerFactory';
import { EconomyManager } from '../../src/game/economy/EconomyManager';
import { PlacementController } from '../../src/input/PlacementController';
import { PlacementSystem } from '../../src/game/systems/PlacementSystem';

describe('Tower Catalog & Definitions (TASK-04-01)', () => {
  it('should define initial tower archetypes: archer, cannon, mage', () => {
    const definitions = getAllTowerDefinitions();
    expect(definitions.length).toBe(3);

    const archer = getTowerDefinition('archer');
    expect(archer.name).toBe('Archer Tower');
    expect(archer.baseCost).toBe(100);
    expect(archer.range).toBe(125);
    expect(archer.fireRate).toBeGreaterThan(0);
    expect(archer.damage).toBeGreaterThan(0);
    expect(archer.splashRadius).toBe(0);
    expect(archer.projectileSpeed).toBeGreaterThan(0);
    expect(archer.icon).toBeDefined();
    expect(archer.description).toBeDefined();

    const cannon = getTowerDefinition('cannon');
    expect(cannon.name).toBe('Cannon Tower');
    expect(cannon.baseCost).toBe(150);
    expect(cannon.range).toBe(100);
    expect(cannon.splashRadius).toBeGreaterThan(0);
    expect(cannon.damage).toBeGreaterThan(0);

    const mage = getTowerDefinition('mage');
    expect(mage.name).toBe('Mage Tower');
    expect(mage.baseCost).toBe(200);
    expect(mage.range).toBe(140);
    expect(mage.damage).toBeGreaterThan(0);
  });

  it('should throw an error for unknown tower archetype', () => {
    expect(() => getTowerDefinition('sniper' as any)).toThrow();
  });
});

describe('Tower Factory & ECS Instantiation (TASK-04-01)', () => {
  let world: World;

  beforeEach(() => {
    world = new World();
  });

  it('should instantiate a tower entity with Position, Tower, and Sprite components', () => {
    const tileSize = 32;
    const gridX = 4;
    const gridY = 5;

    const entity = TowerFactory.createTower(world, 'archer', gridX, gridY, tileSize);
    expect(world.isAlive(entity)).toBe(true);

    const pos = world.getComponent<PositionComponent>(entity, POSITION_COMPONENT);
    expect(pos).toBeDefined();
    expect(pos?.x).toBe(gridX * tileSize + tileSize / 2);
    expect(pos?.y).toBe(gridY * tileSize + tileSize / 2);

    const tower = world.getComponent<TowerComponent>(entity, TOWER_COMPONENT);
    expect(tower).toBeDefined();
    expect(tower?.towerType).toBe('archer');
    expect(tower?.tier).toBe(1);
    expect(tower?.range).toBe(125);
    expect(tower?.fireRate).toBe(1.35);
    expect(tower?.cooldownRemaining).toBe(0);
    expect(tower?.targetStrategy).toBe('first');
    expect(tower?.targetEntityId).toBeNull();
    expect(tower?.baseCost).toBe(100);
    expect(tower?.totalInvestedCost).toBe(100);
    expect(tower?.gridX).toBe(gridX);
    expect(tower?.gridY).toBe(gridY);

    const sprite = world.getComponent<SpriteComponent>(entity, SPRITE_COMPONENT);
    expect(sprite).toBeDefined();
    expect(sprite?.spriteId).toBe('tower_archer');
    expect(sprite?.width).toBe(tileSize);
    expect(sprite?.height).toBe(tileSize);
    expect(sprite?.visible).toBe(true);
  });

  it('should correctly query created towers through ECS query', () => {
    TowerFactory.createTower(world, 'archer', 1, 1);
    TowerFactory.createTower(world, 'cannon', 2, 2);
    TowerFactory.createTower(world, 'mage', 3, 3);

    const towers = world.query([POSITION_COMPONENT, TOWER_COMPONENT, SPRITE_COMPONENT]);
    expect(towers.length).toBe(3);
  });
});

describe('Economy Manager (TASK-04-03)', () => {
  it('should initialize with default or custom gold balance', () => {
    const economyDefault = new EconomyManager();
    expect(economyDefault.getGold()).toBe(300);

    const economyCustom = new EconomyManager(500);
    expect(economyCustom.getGold()).toBe(500);
  });

  it('should throw when initialized with negative gold', () => {
    expect(() => new EconomyManager(-10)).toThrow();
  });

  it('should validate affordability correctly', () => {
    const economy = new EconomyManager(150);
    expect(economy.canAfford(100)).toBe(true);
    expect(economy.canAfford(150)).toBe(true);
    expect(economy.canAfford(151)).toBe(false);
  });

  it('should deduct gold when funds are sufficient and reject when insufficient', () => {
    const economy = new EconomyManager(200);

    const success = economy.deductGold(150);
    expect(success).toBe(true);
    expect(economy.getGold()).toBe(50);

    const fail = economy.deductGold(100);
    expect(fail).toBe(false);
    expect(economy.getGold()).toBe(50);
  });

  it('should credit gold balance and notify listeners', () => {
    const economy = new EconomyManager(100);
    let notifiedGold = 0;
    let notifiedDelta = 0;

    const unsubscribe = economy.onGoldChanged((gold, delta) => {
      notifiedGold = gold;
      notifiedDelta = delta;
    });

    economy.addGold(50);
    expect(economy.getGold()).toBe(150);
    expect(notifiedGold).toBe(150);
    expect(notifiedDelta).toBe(50);

    economy.deductGold(30);
    expect(economy.getGold()).toBe(120);
    expect(notifiedGold).toBe(120);
    expect(notifiedDelta).toBe(-30);

    unsubscribe();
    economy.addGold(100);
    expect(notifiedGold).toBe(120); // No further notification after unsubscribe
  });
});

describe('Placement Controller (TASK-04-02 & TASK-04-03)', () => {
  it('should handle selecting tower archetype and entering placement mode', () => {
    const controller = new PlacementController({ enableKeyboardShortcuts: false });
    expect(controller.isPlacing()).toBe(false);
    expect(controller.getSelectedTower()).toBeNull();

    let selected: string | null = null;
    controller.onTowerSelected((type) => {
      selected = type;
    });

    controller.selectTower('archer');
    expect(controller.isPlacing()).toBe(true);
    expect(controller.getSelectedTower()).toBe('archer');
    expect(selected).toBe('archer');
  });

  it('should cancel placement mode on cancelPlacement()', () => {
    const controller = new PlacementController({ enableKeyboardShortcuts: false });
    controller.selectTower('cannon');

    let cancelled = false;
    controller.onPlacementCancelled(() => {
      cancelled = true;
    });

    controller.cancelPlacement();
    expect(controller.isPlacing()).toBe(false);
    expect(controller.getSelectedTower()).toBeNull();
    expect(cancelled).toBe(true);
  });

  it('should cancel placement mode when Escape key is pressed', () => {
    const controller = new PlacementController({ enableKeyboardShortcuts: true });
    controller.selectTower('mage');
    expect(controller.isPlacing()).toBe(true);

    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    window.dispatchEvent(escapeEvent);

    expect(controller.isPlacing()).toBe(false);
    expect(controller.getSelectedTower()).toBeNull();
    controller.destroy();
  });

  it('should track hovered grid coordinate', () => {
    const controller = new PlacementController({ enableKeyboardShortcuts: false });
    controller.setHoveredTile({ x: 3, y: 7 });
    expect(controller.getHoveredTile()).toEqual({ x: 3, y: 7 });

    controller.setHoveredTile(null);
    expect(controller.getHoveredTile()).toBeNull();
  });

  it('should request placement at grid coordinate when in placement mode', () => {
    const controller = new PlacementController({ enableKeyboardShortcuts: false });
    let placedType: string | null = null;
    let placedPos: any = null;

    controller.onPlaceRequested((type, pos) => {
      placedType = type;
      placedPos = pos;
    });

    // Requesting when not placing should return false
    expect(controller.requestPlacement({ x: 2, y: 3 })).toBe(false);

    controller.selectTower('archer');
    const requested = controller.requestPlacement({ x: 2, y: 3 });
    expect(requested).toBe(true);
    expect(placedType).toBe('archer');
    expect(placedPos).toEqual({ x: 2, y: 3 });
  });
});

describe('Placement System (TASK-04-03)', () => {
  let world: World;
  let grid: TileGrid;
  let economy: EconomyManager;
  let controller: PlacementController;
  let placementSystem: PlacementSystem;

  beforeEach(() => {
    world = new World();
    grid = new TileGrid(10, 10, 32);
    // Set up some tile types
    // (0,0)-(2,0) = Path
    grid.setTileType(0, 0, TileType.Path);
    grid.setTileType(1, 0, TileType.Path);
    grid.setTileType(2, 0, TileType.Path);
    // (5,5) = Blocked
    grid.setTileType(5, 5, TileType.Blocked);

    economy = new EconomyManager(250);
    controller = new PlacementController({ enableKeyboardShortcuts: false });
    placementSystem = new PlacementSystem({ grid, economy, controller });
    world.addSystem(placementSystem);
  });

  it('should validate placement eligibility on various tile types and gold balances', () => {
    // Buildable tile with sufficient gold
    expect(placementSystem.canPlaceTower('archer', 3, 3)).toEqual({ valid: true });

    // Path tile
    expect(placementSystem.canPlaceTower('archer', 0, 0)).toEqual({
      valid: false,
      reason: 'path',
    });

    // Blocked tile
    expect(placementSystem.canPlaceTower('archer', 5, 5)).toEqual({
      valid: false,
      reason: 'blocked',
    });

    // Out of bounds
    expect(placementSystem.canPlaceTower('archer', 15, 15)).toEqual({
      valid: false,
      reason: 'out_of_bounds',
    });

    // Insufficient gold (Mage costs 200, economy has 50)
    economy.setGold(50);
    expect(placementSystem.canPlaceTower('mage', 3, 3)).toEqual({
      valid: false,
      reason: 'insufficient_gold',
    });
  });

  it('should successfully place tower: deduct gold, mark tile occupied, create entity, exit placement mode', () => {
    let placedEntity: number | null = null;
    let placedType: string | null = null;

    placementSystem.onTowerPlaced((entity, type, x, y) => {
      placedEntity = entity;
      placedType = type;
      expect(x).toBe(4);
      expect(y).toBe(4);
    });

    controller.selectTower('archer');
    expect(controller.isPlacing()).toBe(true);

    const initialGold = economy.getGold(); // 250
    const archerCost = getTowerDefinition('archer').baseCost; // 100

    const entity = placementSystem.tryPlaceTower('archer', 4, 4);

    expect(entity).not.toBeNull();
    expect(placedEntity).toBe(entity);
    expect(placedType).toBe('archer');

    // Gold deducted
    expect(economy.getGold()).toBe(initialGold - archerCost);

    // Tile marked occupied in TileGrid
    expect(grid.isOccupied(4, 4)).toBe(true);
    expect(grid.getTile(4, 4)).toBe(TileType.Occupied);

    // ECS entity exists with tower component
    const towerComp = world.getComponent<TowerComponent>(entity!, TOWER_COMPONENT);
    expect(towerComp).toBeDefined();
    expect(towerComp?.gridX).toBe(4);
    expect(towerComp?.gridY).toBe(4);

    // Controller exited placement mode
    expect(controller.isPlacing()).toBe(false);
  });

  it('should reject placement on already occupied tiles', () => {
    // Place first tower
    placementSystem.tryPlaceTower('archer', 4, 4);
    expect(grid.isOccupied(4, 4)).toBe(true);

    let rejectedReason: string | null = null;
    placementSystem.onPlacementRejected((_type, _x, _y, reason) => {
      rejectedReason = reason;
    });

    const goldBefore = economy.getGold();
    const secondEntity = placementSystem.tryPlaceTower('cannon', 4, 4);

    expect(secondEntity).toBeNull();
    expect(rejectedReason).toBe('occupied');
    expect(economy.getGold()).toBe(goldBefore);
  });

  it('should reject placement on insufficient funds without modifying grid or deducting gold', () => {
    economy.setGold(50); // Archer costs 100

    let rejectedReason: string | null = null;
    placementSystem.onPlacementRejected((_type, _x, _y, reason) => {
      rejectedReason = reason;
    });

    const entity = placementSystem.tryPlaceTower('archer', 3, 3);
    expect(entity).toBeNull();
    expect(rejectedReason).toBe('insufficient_gold');
    expect(economy.getGold()).toBe(50);
    expect(grid.isBuildable(3, 3)).toBe(true);
    expect(grid.isOccupied(3, 3)).toBe(false);
  });

  it('should automatically trigger tryPlaceTower via PlacementController place request', () => {
    controller.selectTower('cannon');
    const cannonCost = getTowerDefinition('cannon').baseCost; // 150
    const initialGold = economy.getGold(); // 250

    controller.requestPlacement({ x: 6, y: 6 });

    expect(grid.isOccupied(6, 6)).toBe(true);
    expect(economy.getGold()).toBe(initialGold - cannonCost);
    expect(controller.isPlacing()).toBe(false);
  });
});
