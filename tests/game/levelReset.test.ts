import { describe, it, expect, beforeEach } from 'vitest';
import { World } from '../../src/core/ecs/World';
import { TileGrid } from '../../src/game/map/TileGrid';
import { EventBus } from '../../src/core/events/EngineEvents';
import { EconomyManager } from '../../src/game/economy/EconomyManager';
import { ScoreManager } from '../../src/game/scoring/ScoreManager';
import { GameStateMachine, GameState } from '../../src/game/state/GameStateMachine';
import { WaveManager } from '../../src/game/state/WaveManager';
import { WaveSpawnerSystem } from '../../src/game/systems/WaveSpawnerSystem';
import { GameStateSystem } from '../../src/game/systems/GameStateSystem';
import { LevelResetHandler } from '../../src/game/state/LevelResetHandler';
import { TowerFactory } from '../../src/game/towers/TowerFactory';
import { TOWER_COMPONENT } from '../../src/game/towers/TowerComponents';
import { CREEP_COMPONENT } from '../../src/game/creeps/CreepComponents';
import { CreepFactory } from '../../src/game/creeps/CreepFactory';
import { ProjectileFactory, PROJECTILE_COMPONENT } from '../../src/game/projectiles';
import { WaveDefinition } from '../../src/game/waves/WaveDefinition';

describe('LevelResetHandler (TASK-08-03)', () => {
  let world: World;
  let grid: TileGrid;
  let eventBus: EventBus;
  let stateMachine: GameStateMachine;
  let economyManager: EconomyManager;
  let scoreManager: ScoreManager;
  let waveManager: WaveManager;
  let spawnerSystem: WaveSpawnerSystem;
  let gameStateSystem: GameStateSystem;
  let resetHandler: LevelResetHandler;

  const testWaves: WaveDefinition[] = [
    {
      waveNumber: 1,
      spawnGroups: [
        {
          creepType: 'basic',
          count: 3,
          intervalSeconds: 0.5,
          startDelaySeconds: 0,
        },
      ],
    },
    {
      waveNumber: 2,
      spawnGroups: [
        {
          creepType: 'fast',
          count: 5,
          intervalSeconds: 0.3,
          startDelaySeconds: 0,
        },
      ],
    },
  ];

  beforeEach(() => {
    world = new World();
    grid = new TileGrid(10, 10, 32);
    eventBus = new EventBus();
    stateMachine = new GameStateMachine({ eventBus });
    economyManager = new EconomyManager(400, eventBus);
    scoreManager = new ScoreManager(0, { eventBus });
    spawnerSystem = new WaveSpawnerSystem(testWaves, [{ x: 0, y: 0 }, { x: 50, y: 50 }], eventBus);
    world.addSystem(spawnerSystem);

    waveManager = new WaveManager({
      sequence: testWaves,
      spawnerSystem,
      stateMachine,
      scoreManager,
      economyManager,
      eventBus,
      autoStartDelaySeconds: 5.0,
      autoStartEnabled: false,
    });

    gameStateSystem = new GameStateSystem({
      stateMachine,
      waveManager,
      scoreManager,
      economyManager,
      eventBus,
      initialLives: 20,
    });
    world.addSystem(gameStateSystem);

    resetHandler = new LevelResetHandler({
      world,
      tileGrid: grid,
      stateMachine,
      waveManager,
      gameStateSystem,
      waveSpawnerSystem: spawnerSystem,
      economyManager,
      scoreManager,
      eventBus,
      initialLives: 20,
      initialGold: 400,
    });
  });

  it('should reset lives, gold, and score to level initial values', () => {
    // Modify values during gameplay
    gameStateSystem.setLives(5);
    economyManager.setGold(120);
    scoreManager.setScore(1500);

    resetHandler.resetLevel();

    expect(gameStateSystem.getLives()).toBe(20);
    expect(economyManager.getGold()).toBe(400);
    expect(scoreManager.getScore()).toBe(0);
  });

  it('should despawn all towers and free their occupied grid tiles', () => {
    // Place towers and mark tiles occupied
    grid.occupyTile(2, 2);
    const tower1 = TowerFactory.createTower(world, 'archer', 2, 2);

    grid.occupyTile(4, 5);
    const tower2 = TowerFactory.createTower(world, 'cannon', 4, 5);

    expect(grid.isOccupied(2, 2)).toBe(true);
    expect(grid.isOccupied(4, 5)).toBe(true);
    expect(world.query([TOWER_COMPONENT]).length).toBe(2);

    resetHandler.resetLevel();

    expect(world.isAlive(tower1)).toBe(false);
    expect(world.isAlive(tower2)).toBe(false);
    expect(world.query([TOWER_COMPONENT]).length).toBe(0);

    expect(grid.isOccupied(2, 2)).toBe(false);
    expect(grid.isBuildable(2, 2)).toBe(true);
    expect(grid.isOccupied(4, 5)).toBe(false);
    expect(grid.isBuildable(4, 5)).toBe(true);
  });

  it('should despawn all active creeps and in-flight projectiles', () => {
    // Spawn creeps
    const creep1 = CreepFactory.createCreep(world, 'basic', [{ x: 0, y: 0 }]);
    const creep2 = CreepFactory.createCreep(world, 'fast', [{ x: 0, y: 0 }]);

    // Spawn projectiles
    const proj1 = ProjectileFactory.createProjectile(world, {
      towerType: 'cannon',
      startPosition: { x: 10, y: 10 },
      targetPosition: { x: 20, y: 20 },
      damage: 10,
      speed: 200,
    });

    expect(world.query([CREEP_COMPONENT]).length).toBe(2);
    expect(world.query([PROJECTILE_COMPONENT]).length).toBe(1);

    resetHandler.resetLevel();

    expect(world.isAlive(creep1)).toBe(false);
    expect(world.isAlive(creep2)).toBe(false);
    expect(world.isAlive(proj1)).toBe(false);
    expect(world.query([CREEP_COMPONENT]).length).toBe(0);
    expect(world.query([PROJECTILE_COMPONENT]).length).toBe(0);
  });

  it('should reset wave manager and spawner to Wave 1 in PREPARATION state', () => {
    // Advance into wave 2
    waveManager.startWaveNow();
    world.update(2.0);
    for (const c of world.query([CREEP_COMPONENT])) world.destroyEntity(c);
    waveManager.update(world, 0.1);

    expect(waveManager.getCurrentWaveIndex()).toBe(1); // Wave 2
    stateMachine.transitionTo(GameState.GAME_OVER);

    resetHandler.resetLevel();

    expect(waveManager.getCurrentWaveIndex()).toBe(0);
    expect(waveManager.getCurrentWaveNumber()).toBe(1);
    expect(waveManager.isAllWavesCleared()).toBe(false);
    expect(waveManager.getCountdownRemaining()).toBe(0);
    expect(stateMachine.getState()).toBe(GameState.PREPARATION);
  });

  it('should emit LEVEL_RESET event on EventBus', () => {
    let resetEventData: any = null;
    eventBus.on('LEVEL_RESET', (data) => {
      resetEventData = data;
    });

    resetHandler.resetLevel({ initialLives: 25, initialGold: 500 });

    expect(resetEventData).toEqual({
      initialLives: 25,
      initialGold: 500,
    });
    expect(gameStateSystem.getLives()).toBe(25);
    expect(economyManager.getGold()).toBe(500);
  });
});
