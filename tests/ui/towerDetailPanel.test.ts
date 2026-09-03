import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { World } from '../../src/core/ecs/World';
import { TileGrid } from '../../src/game/map/TileGrid';
import { EventBus } from '../../src/core/events/EngineEvents';
import { EconomyManager } from '../../src/game/economy/EconomyManager';
import { TowerFactory } from '../../src/game/towers/TowerFactory';
import { TowerUpgradeSystem } from '../../src/game/systems/TowerUpgradeSystem';
import { TowerSellSystem } from '../../src/game/systems/TowerSellSystem';
import { TowerControlSystem } from '../../src/game/systems/TowerControlSystem';
import { SelectionController } from '../../src/input/SelectionController';
import { TowerDetailPanel } from '../../src/ui/TowerDetailPanel';

describe('SelectionController (TASK-07-01)', () => {
  let world: World;
  let grid: TileGrid;
  let controller: SelectionController;

  beforeEach(() => {
    world = new World();
    grid = new TileGrid(10, 10, 32);
    controller = new SelectionController({
      world,
      grid,
      enableKeyboardShortcuts: false,
    });
  });

  afterEach(() => {
    controller.destroy();
  });

  it('should initialize with no selection', () => {
    expect(controller.hasSelection()).toBe(false);
    expect(controller.getSelectedEntity()).toBeNull();
    expect(controller.getSelectedTile()).toBeNull();
  });

  it('should select placed tower when clicking its tile coordinates', () => {
    const tower = TowerFactory.createTower(world, 'archer', 3, 4);

    let selectedEntity: any = null;
    let selectedTile: any = null;
    controller.onSelectionChanged((entity, tile) => {
      selectedEntity = entity;
      selectedTile = tile;
    });

    const result = controller.selectAt({ x: 3, y: 4 });
    expect(result).toBe(tower);
    expect(controller.hasSelection()).toBe(true);
    expect(controller.getSelectedEntity()).toBe(tower);
    expect(controller.getSelectedTile()).toEqual({ x: 3, y: 4 });
    expect(selectedEntity).toBe(tower);
    expect(selectedTile).toEqual({ x: 3, y: 4 });
  });

  it('should deselect when clicking on an empty tile without a tower', () => {
    TowerFactory.createTower(world, 'cannon', 2, 2);
    controller.selectAt({ x: 2, y: 2 });
    expect(controller.hasSelection()).toBe(true);

    let deselected = false;
    controller.onDeselected(() => {
      deselected = true;
    });

    const result = controller.selectAt({ x: 5, y: 5 }); // Empty tile
    expect(result).toBeNull();
    expect(controller.hasSelection()).toBe(false);
    expect(controller.getSelectedEntity()).toBeNull();
    expect(controller.getSelectedTile()).toBeNull();
    expect(deselected).toBe(true);
  });

  it('should clear selection when Escape key is pressed', () => {
    const keyboardController = new SelectionController({
      world,
      grid,
      enableKeyboardShortcuts: true,
    });

    TowerFactory.createTower(world, 'mage', 1, 1);
    keyboardController.selectAt({ x: 1, y: 1 });
    expect(keyboardController.hasSelection()).toBe(true);

    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    window.dispatchEvent(escapeEvent);

    expect(keyboardController.hasSelection()).toBe(false);
    expect(keyboardController.getSelectedEntity()).toBeNull();
    keyboardController.destroy();
  });

  it('should switch selection when clicking a different tower', () => {
    const tower1 = TowerFactory.createTower(world, 'archer', 1, 1);
    const tower2 = TowerFactory.createTower(world, 'cannon', 2, 2);

    controller.selectAt({ x: 1, y: 1 });
    expect(controller.getSelectedEntity()).toBe(tower1);

    controller.selectAt({ x: 2, y: 2 });
    expect(controller.getSelectedEntity()).toBe(tower2);
    expect(controller.getSelectedTile()).toEqual({ x: 2, y: 2 });
  });
});

describe('TowerDetailPanel (TASK-07-01 & TASK-07-02 & TASK-07-03)', () => {
  let world: World;
  let grid: TileGrid;
  let eventBus: EventBus;
  let economy: EconomyManager;
  let selectionController: SelectionController;
  let upgradeSystem: TowerUpgradeSystem;
  let sellSystem: TowerSellSystem;
  let controlSystem: TowerControlSystem;
  let panel: TowerDetailPanel;

  beforeEach(() => {
    world = new World();
    grid = new TileGrid(10, 10, 32);
    eventBus = new EventBus();
    economy = new EconomyManager(500, eventBus);
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
    controlSystem = new TowerControlSystem();

    world.addSystem(upgradeSystem);
    world.addSystem(sellSystem);
    world.addSystem(controlSystem);

    panel = new TowerDetailPanel({
      world,
      economy,
      selectionController,
      upgradeSystem,
      sellSystem,
      controlSystem,
      eventBus,
    });
  });

  afterEach(() => {
    panel.destroy();
    selectionController.destroy();
  });

  it('should be hidden initially', () => {
    expect(panel.getIsVisible()).toBe(false);
    expect(panel.getSelectedEntity()).toBeNull();
    expect(panel.getElement().style.display).toBe('none');
  });

  it('should open and display stats when a tower is selected', () => {
    const archer = TowerFactory.createTower(world, 'archer', 3, 3);
    selectionController.selectAt({ x: 3, y: 3 });

    expect(panel.getIsVisible()).toBe(true);
    expect(panel.getSelectedEntity()).toBe(archer);
    expect(panel.getElement().style.display).not.toBe('none');

    const vm = panel.getViewModel();
    expect(vm).not.toBeNull();
    expect(vm?.name).toBe('Archer Tower');
    expect(vm?.tier).toBe(1);
    expect(vm?.maxTier).toBe(3);
    expect(vm?.damage).toBe(15);
    expect(vm?.nextDamage).toBe(25);
    expect(vm?.range).toBe(120);
    expect(vm?.nextRange).toBe(140);
    expect(vm?.fireRate).toBe(1.2);
    expect(vm?.targetStrategy).toBe('first');
    expect(vm?.strategyLabel).toBe('First');
    expect(vm?.upgradeCost).toBe(75);
    expect(vm?.canAffordUpgrade).toBe(true);
    expect(vm?.sellRefund).toBe(70);

    // Verify DOM content
    const el = panel.getElement();
    expect(el.querySelector('[data-ref="name"]')?.textContent).toBe('Archer Tower');
    expect(el.querySelector('[data-ref="tier"]')?.textContent).toContain('Tier 1');
    expect(el.querySelector('[data-ref="damage"]')?.textContent).toContain('15');
    expect(el.querySelector('[data-ref="range"]')?.textContent).toContain('120');
    expect(el.querySelector('[data-ref="fireRate"]')?.textContent).toContain('1.2');
    expect(el.querySelector('[data-ref="strategy"]')?.textContent).toBe('First');
    expect(el.querySelector('[data-ref="btnUpgrade"]')?.textContent).toContain('75g');
    expect(el.querySelector('[data-ref="btnSell"]')?.textContent).toContain('70g');
  });

  it('should close/hide when selection is cleared', () => {
    TowerFactory.createTower(world, 'cannon', 2, 2);
    selectionController.selectAt({ x: 2, y: 2 });
    expect(panel.getIsVisible()).toBe(true);

    selectionController.deselect();
    expect(panel.getIsVisible()).toBe(false);
    expect(panel.getSelectedEntity()).toBeNull();
    expect(panel.getElement().style.display).toBe('none');
  });

  it('should update upgrade button state when gold balance changes', () => {
    TowerFactory.createTower(world, 'mage', 0, 0);
    // Mage upgrade 1 -> 2 costs 160g
    economy.setGold(100); // Cannot afford 160g

    selectionController.selectAt({ x: 0, y: 0 });

    const btnUpgrade = panel.getElement().querySelector('[data-ref="btnUpgrade"]') as HTMLButtonElement;
    expect(btnUpgrade.disabled).toBe(true);

    // Add gold to afford it
    economy.addGold(100); // 200g now
    expect(btnUpgrade.disabled).toBe(false);
  });

  it('should execute upgrade and update UI when upgrade button is clicked', () => {
    TowerFactory.createTower(world, 'archer', 1, 1);
    selectionController.selectAt({ x: 1, y: 1 });

    const initialGold = economy.getGold(); // 500
    const upgraded = panel.handleUpgradeClick();
    expect(upgraded).toBe(true);

    // Gold deducted
    expect(economy.getGold()).toBe(initialGold - 75);

    // View model updated
    const vm = panel.getViewModel();
    expect(vm?.tier).toBe(2);
    expect(vm?.damage).toBe(25);
    expect(vm?.nextDamage).toBe(40);
    expect(vm?.upgradeCost).toBe(150);
    expect(vm?.sellRefund).toBe(Math.floor((100 + 75) * 0.7)); // 122

    // DOM updated
    const el = panel.getElement();
    expect(el.querySelector('[data-ref="tier"]')?.textContent).toContain('Tier 2');
    expect(el.querySelector('[data-ref="btnUpgrade"]')?.textContent).toContain('150g');
    expect(el.querySelector('[data-ref="btnSell"]')?.textContent).toContain('122g');
  });

  it('should display "Max Tier" and disable upgrade button at Tier 3', () => {
    TowerFactory.createTower(world, 'archer', 1, 1);
    selectionController.selectAt({ x: 1, y: 1 });

    // Upgrade to Tier 2, then Tier 3
    panel.handleUpgradeClick();
    panel.handleUpgradeClick();

    const vm = panel.getViewModel();
    expect(vm?.tier).toBe(3);
    expect(vm?.isMaxTier).toBe(true);
    expect(vm?.upgradeCost).toBeNull();

    const btnUpgrade = panel.getElement().querySelector('[data-ref="btnUpgrade"]') as HTMLButtonElement;
    expect(btnUpgrade.textContent).toContain('Max Tier');
    expect(btnUpgrade.disabled).toBe(true);
  });

  it('should execute sell and close panel when sell button is clicked', () => {
    grid.occupyTile(4, 4);
    const tower = TowerFactory.createTower(world, 'cannon', 4, 4);
    selectionController.selectAt({ x: 4, y: 4 });

    const initialGold = economy.getGold(); // 500
    const sold = panel.handleSellClick();

    expect(sold).toBe(true);
    expect(panel.getIsVisible()).toBe(false);
    expect(economy.getGold()).toBe(initialGold + 105); // 70% of 150 = 105
    expect(world.isAlive(tower)).toBe(false);
    expect(grid.isBuildable(4, 4)).toBe(true);
  });

  it('should cycle targeting strategy when strategy button is clicked', () => {
    TowerFactory.createTower(world, 'archer', 2, 2);
    selectionController.selectAt({ x: 2, y: 2 });

    expect(panel.getViewModel()?.targetStrategy).toBe('first');
    expect(panel.getElement().querySelector('[data-ref="strategy"]')?.textContent).toBe('First');

    // Cycle: first -> lowestHp
    const s1 = panel.handleCycleStrategyClick();
    expect(s1).toBe('lowestHp');
    expect(panel.getViewModel()?.targetStrategy).toBe('lowestHp');
    expect(panel.getElement().querySelector('[data-ref="strategy"]')?.textContent).toBe('Lowest HP');

    // Cycle: lowestHp -> closest
    const s2 = panel.handleCycleStrategyClick();
    expect(s2).toBe('closest');
    expect(panel.getViewModel()?.targetStrategy).toBe('closest');
    expect(panel.getElement().querySelector('[data-ref="strategy"]')?.textContent).toBe('Closest');

    // Cycle: closest -> first
    const s3 = panel.handleCycleStrategyClick();
    expect(s3).toBe('first');
    expect(panel.getViewModel()?.targetStrategy).toBe('first');
  });

  it('should close panel when close button is clicked', () => {
    TowerFactory.createTower(world, 'archer', 0, 0);
    selectionController.selectAt({ x: 0, y: 0 });
    expect(panel.getIsVisible()).toBe(true);

    panel.handleCloseClick();
    expect(panel.getIsVisible()).toBe(false);
    expect(selectionController.hasSelection()).toBe(false);
  });
});
