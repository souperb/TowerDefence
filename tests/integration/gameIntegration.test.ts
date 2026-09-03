import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { World } from '../../src/core/ecs/World';
import { GameLoop } from '../../src/core/loop/GameLoop';
import { EventBus } from '../../src/core/events/EngineEvents';
import { TileGrid } from '../../src/game/map/TileGrid';
import { EconomyManager } from '../../src/game/economy/EconomyManager';
import { ScoreManager } from '../../src/game/scoring/ScoreManager';
import { GameStateMachine, GameState } from '../../src/game/state/GameStateMachine';
import { WaveManager } from '../../src/game/state/WaveManager';
import { WaveSequence } from '../../src/game/waves/WaveSequence';
import { LevelResetHandler } from '../../src/game/state/LevelResetHandler';
import { ProgressionManager } from '../../src/game/state/ProgressionManager';
import { StorageService } from '../../src/storage/StorageService';
import { MemoryStorageProvider } from '../../src/storage/MemoryStorageProvider';
import {
  PlacementSystem,
  MovementSystem,
  TargetingSystem,
  TowerCombatSystem,
  ProjectileSystem,
  BaseBreachSystem,
  CreepDeathSystem,
  GameStateSystem,
  TowerUpgradeSystem,
  TowerSellSystem,
  TowerControlSystem,
  WaveSpawnerSystem,
} from '../../src/game/systems';
import {
  TOWER_COMPONENT,
  TowerComponent,
} from '../../src/game/towers/TowerComponents';
import {
  CREEP_COMPONENT,
} from '../../src/game/creeps/CreepComponents';
import {
  PlacementController,
  SelectionController,
  KeyboardShortcuts,
} from '../../src/input';
import {
  HudPresenter,
  HudView,
  BuildToolbar,
  TowerDetailPanel,
  VictoryModal,
  GameOverModal,
} from '../../src/ui';

describe('Game Integration & Lifecycle (US-10 / End-to-End)', () => {
  let container: HTMLElement;
  let canvas: HTMLCanvasElement;
  let world: World;
  let grid: TileGrid;
  let eventBus: EventBus;
  let economy: EconomyManager;
  let scoreManager: ScoreManager;
  let stateMachine: GameStateMachine;
  let waveSequence: WaveSequence;
  let waveSpawnerSystem: WaveSpawnerSystem;
  let waveManager: WaveManager;
  let gameStateSystem: GameStateSystem;
  let placementController: PlacementController;
  let selectionController: SelectionController;
  let placementSystem: PlacementSystem;
  let movementSystem: MovementSystem;
  let targetingSystem: TargetingSystem;
  let towerCombatSystem: TowerCombatSystem;
  let projectileSystem: ProjectileSystem;
  let baseBreachSystem: BaseBreachSystem;
  let creepDeathSystem: CreepDeathSystem;
  let upgradeSystem: TowerUpgradeSystem;
  let sellSystem: TowerSellSystem;
  let controlSystem: TowerControlSystem;
  let resetHandler: LevelResetHandler;
  let progressionManager: ProgressionManager;
  let hudPresenter: HudPresenter;
  let hudView: HudView;
  let buildToolbar: BuildToolbar;
  let towerDetailPanel: TowerDetailPanel;
  let victoryModal: VictoryModal;
  let gameOverModal: GameOverModal;
  let keyboardShortcuts: KeyboardShortcuts;
  let gameLoop: GameLoop;

  const waypoints = [
    { x: 32, y: 32 },
    { x: 280, y: 32 },
    { x: 280, y: 280 },
  ];

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'game-container';
    document.body.appendChild(container);

    canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 320;
    container.appendChild(canvas);

    eventBus = new EventBus();
    world = new World();
    grid = new TileGrid(10, 10, 32);

    // Storage and Progression with in-memory provider
    const storageService = new StorageService(new MemoryStorageProvider());
    progressionManager = new ProgressionManager(storageService);

    // Economy & Scoring
    const initialGold = 300;
    const initialLives = 20;
    economy = new EconomyManager(initialGold, eventBus);
    scoreManager = new ScoreManager(0, { eventBus });

    // Wave Progression
    stateMachine = new GameStateMachine({ eventBus });
    waveSequence = new WaveSequence([
      {
        waveNumber: 1,
        description: 'Wave 1',
        rewardGold: 50,
        rewardScore: 100,
        spawnGroups: [
          {
            creepType: 'basic',
            count: 2,
            intervalSeconds: 0.5,
            startDelaySeconds: 0,
          },
        ],
      },
      {
        waveNumber: 2,
        description: 'Wave 2',
        rewardGold: 100,
        rewardScore: 200,
        spawnGroups: [
          {
            creepType: 'fast',
            count: 1,
            intervalSeconds: 0.5,
            startDelaySeconds: 0,
          },
        ],
      },
    ]);

    waveSpawnerSystem = new WaveSpawnerSystem(
      [...waveSequence.getWaves()],
      waypoints,
      eventBus
    );
    waveManager = new WaveManager({
      sequence: waveSequence,
      spawnerSystem: waveSpawnerSystem,
      stateMachine,
      economyManager: economy,
      scoreManager,
      eventBus,
      autoStartDelaySeconds: 5,
    });

    gameStateSystem = new GameStateSystem({
      stateMachine,
      waveManager,
      scoreManager,
      economyManager: economy,
      eventBus,
      initialLives,
    });

    // Controllers
    placementController = new PlacementController({ canvas, enableKeyboardShortcuts: false });
    selectionController = new SelectionController({ world, grid, canvas, enableKeyboardShortcuts: false });

    // Systems
    placementSystem = new PlacementSystem({ grid, economy, controller: placementController });
    movementSystem = new MovementSystem();
    targetingSystem = new TargetingSystem();
    towerCombatSystem = new TowerCombatSystem();
    projectileSystem = new ProjectileSystem();
    baseBreachSystem = new BaseBreachSystem(eventBus);
    creepDeathSystem = new CreepDeathSystem({ economyManager: economy, scoreManager, eventBus });
    upgradeSystem = new TowerUpgradeSystem({ world, economy, eventBus });
    sellSystem = new TowerSellSystem({ world, grid, economy, selectionController, eventBus });
    controlSystem = new TowerControlSystem();

    world.addSystem(waveSpawnerSystem);
    world.addSystem(movementSystem);
    world.addSystem(targetingSystem);
    world.addSystem(towerCombatSystem);
    world.addSystem(projectileSystem);
    world.addSystem(baseBreachSystem);
    world.addSystem(creepDeathSystem);
    world.addSystem(placementSystem);
    world.addSystem(upgradeSystem);
    world.addSystem(sellSystem);
    world.addSystem(controlSystem);
    world.addSystem(gameStateSystem);

    resetHandler = new LevelResetHandler({
      world,
      tileGrid: grid,
      stateMachine,
      waveManager,
      gameStateSystem,
      waveSpawnerSystem,
      economyManager: economy,
      scoreManager,
      eventBus,
      initialLives,
      initialGold,
    });

    // UI Presenter & Views
    hudPresenter = new HudPresenter(eventBus, {
      initialGold,
      initialScore: 0,
      initialLives,
      initialWave: 1,
      totalWaves: waveSequence.getTotalWaves(),
    });

    hudView = new HudView({
      container,
      presenter: hudPresenter,
      waveManager,
      stateMachine,
      eventBus,
    });

    buildToolbar = new BuildToolbar({
      container,
      economy,
      placementController,
      selectionController,
      eventBus,
    });

    towerDetailPanel = new TowerDetailPanel({
      container,
      world,
      economy,
      selectionController,
      upgradeSystem,
      sellSystem,
      controlSystem,
      eventBus,
    });

    victoryModal = new VictoryModal({
      container,
      onRestart: () => resetHandler.resetLevel(),
    });

    gameOverModal = new GameOverModal({
      container,
      onRetry: () => resetHandler.resetLevel(),
    });

    keyboardShortcuts = new KeyboardShortcuts({
      placementController,
      selectionController,
      waveManager,
      stateMachine,
      target: window,
    });

    eventBus.on('GAME_OVER', (data) => {
      gameOverModal.show(data);
    });

    eventBus.on('VICTORY', (data) => {
      progressionManager.recordVictory('map_test', data.finalScore, data.stars);
      victoryModal.show({
        score: data.finalScore,
        wavesCleared: data.totalWaves,
        totalWaves: data.totalWaves,
        stars: data.stars,
      });
    });

    gameLoop = new GameLoop({
      tickRate: 60,
      onTick: (dt) => {
        waveManager.update(world, dt);
        world.update(dt);
      },
    });
  });

  afterEach(() => {
    gameLoop.stop();
    hudView.destroy();
    buildToolbar.destroy();
    towerDetailPanel.destroy();
    victoryModal.destroy();
    gameOverModal.destroy();
    keyboardShortcuts.destroy();
    hudPresenter.destroy();
    placementController.destroy();
    selectionController.destroy();
    container.remove();
  });

  it('should complete full end-to-end gameplay loop: build tower, start wave, shoot creeps, earn bounty', () => {
    expect(stateMachine.getState()).toBe(GameState.PREPARATION);
    expect(economy.getGold()).toBe(300);

    // 1. Build a Mage tower at (3, 2)
    placementController.selectTower('mage');
    expect(placementController.isPlacing()).toBe(true);
    placementController.requestPlacement({ x: 3, y: 2 });

    // Step world to process placement system
    world.update(0.016);

    expect(economy.getGold()).toBe(100); // 300 - 200
    expect(hudPresenter.getGold()).toBe(100);
    expect(grid.isOccupied(3, 2)).toBe(true);

    const towers = world.query([TOWER_COMPONENT]);
    expect(towers.length).toBe(1);

    // 2. Start Wave 1
    const started = waveManager.startWaveNow();
    expect(started).toBe(true);
    expect(stateMachine.getState()).toBe(GameState.SPAWNING);

    // 3. Step simulation through spawning and combat
    for (let i = 0; i < 400; i++) {
      waveManager.update(world, 0.05);
      world.update(0.05);
    }

    // Creeps should be killed and bounty awarded
    expect(creepDeathSystem.getDeathCount()).toBeGreaterThan(0);
    expect(economy.getGold()).toBeGreaterThan(100);
    expect(scoreManager.getScore()).toBeGreaterThan(0);
  });

  it('should trigger Game Over modal when core lives reach zero', () => {
    expect(gameOverModal.isVisible()).toBe(false);

    // Deduct all lives
    gameStateSystem.setLives(0);
    gameStateSystem.update(world, 0.016);

    expect(stateMachine.isGameOver()).toBe(true);
    expect(gameOverModal.isVisible()).toBe(true);
  });

  it('should trigger Victory modal and save progress on all waves cleared', () => {
    expect(victoryModal.isVisible()).toBe(false);

    // Wave 1
    waveManager.startWaveNow();
    // Simulate wave 1 completion
    for (let i = 0; i < 200; i++) {
      const creeps = world.query([CREEP_COMPONENT]);
      for (const c of creeps) {
        world.destroyEntity(c);
      }
      waveManager.update(world, 0.1);
      world.update(0.1);
    }

    // Wave 2
    waveManager.startWaveNow();
    // Simulate wave 2 completion
    for (let i = 0; i < 200; i++) {
      const creeps = world.query([CREEP_COMPONENT]);
      for (const c of creeps) {
        world.destroyEntity(c);
      }
      waveManager.update(world, 0.1);
      world.update(0.1);
    }

    expect(stateMachine.isVictory()).toBe(true);
    expect(victoryModal.isVisible()).toBe(true);
    expect(progressionManager.isLevelCompleted('map_test')).toBe(true);
  });

  it('should cleanly reset level on retry/restart', () => {
    // Place a tower and start wave
    placementController.selectTower('cannon');
    placementController.requestPlacement({ x: 3, y: 3 });
    world.update(0.016);

    expect(world.query([TOWER_COMPONENT]).length).toBe(1);
    expect(grid.isOccupied(3, 3)).toBe(true);

    // Reset level
    resetHandler.resetLevel();

    expect(world.query([TOWER_COMPONENT]).length).toBe(0);
    expect(grid.isOccupied(3, 3)).toBe(false);
    expect(economy.getGold()).toBe(300);
    expect(scoreManager.getScore()).toBe(0);
    expect(gameStateSystem.getLives()).toBe(20);
    expect(stateMachine.getState()).toBe(GameState.PREPARATION);
    expect(waveManager.getCurrentWaveIndex()).toBe(0);
  });

  it('should upgrade and sell towers through UI panel', () => {
    placementController.selectTower('archer');
    placementController.requestPlacement({ x: 4, y: 4 });
    world.update(0.016);

    const tower = world.query([TOWER_COMPONENT])[0];
    selectionController.selectAt({ x: 4, y: 4 });

    expect(towerDetailPanel.getIsVisible()).toBe(true);

    // Upgrade tower
    const upgraded = towerDetailPanel.handleUpgradeClick();
    expect(upgraded).toBe(true);

    const towerComp = world.getComponent<TowerComponent>(tower, TOWER_COMPONENT);
    expect(towerComp?.tier).toBe(2);

    // Sell tower
    const sold = towerDetailPanel.handleSellClick();
    expect(sold).toBe(true);
    expect(towerDetailPanel.getIsVisible()).toBe(false);
    expect(grid.isOccupied(4, 4)).toBe(false);
    expect(world.isAlive(tower)).toBe(false);
  });
});
