import { describe, it, expect, beforeEach } from 'vitest';
import { World } from '../../src/core/ecs/World';
import { EventBus } from '../../src/core/events/EngineEvents';
import { TileGrid } from '../../src/game/map/TileGrid';
import { EconomyManager } from '../../src/game/economy/EconomyManager';
import { ScoreManager } from '../../src/game/scoring/ScoreManager';
import { GameStateMachine } from '../../src/game/state/GameStateMachine';
import { WaveManager } from '../../src/game/state/WaveManager';
import { WaveSpawnerSystem } from '../../src/game/systems/WaveSpawnerSystem';
import { GameStateSystem } from '../../src/game/systems/GameStateSystem';
import { ProgressionManager } from '../../src/game/state/ProgressionManager';
import { StorageService } from '../../src/storage/StorageService';
import { MemoryStorageProvider } from '../../src/storage/MemoryStorageProvider';
import { MapRenderer } from '../../src/rendering/MapRenderer';
import { HudPresenter } from '../../src/ui/HudPresenter';
import {
  LEVEL_1,
  LEVEL_2,
  LEVEL_3,
  LEVEL_4,
  LEVEL_5,
  LevelManager,
} from '../../src/game/levels';
import { TowerFactory } from '../../src/game/towers/TowerFactory';
import { CreepFactory } from '../../src/game/creeps/CreepFactory';
import { TOWER_COMPONENT } from '../../src/game/towers/TowerComponents';
import { CREEP_COMPONENT } from '../../src/game/creeps/CreepComponents';

describe('LevelManager & Adventure Mode Progression', () => {
  let world: World;
  let eventBus: EventBus;
  let tileGrid: TileGrid;
  let mapRenderer: MapRenderer;
  let economy: EconomyManager;
  let scoreManager: ScoreManager;
  let progressionManager: ProgressionManager;
  let stateMachine: GameStateMachine;
  let waveSpawnerSystem: WaveSpawnerSystem;
  let waveManager: WaveManager;
  let gameStateSystem: GameStateSystem;
  let hudPresenter: HudPresenter;
  let levelManager: LevelManager;

  beforeEach(() => {
    world = new World();
    eventBus = new EventBus();
    tileGrid = TileGrid.fromLevelConfig(LEVEL_1.mapConfig);
    mapRenderer = new MapRenderer(tileGrid, LEVEL_1.theme);
    economy = new EconomyManager(LEVEL_1.initialGold);
    scoreManager = new ScoreManager(0, { eventBus });

    const storage = new StorageService(new MemoryStorageProvider());
    progressionManager = new ProgressionManager(storage);

    stateMachine = new GameStateMachine({ eventBus });
    waveSpawnerSystem = new WaveSpawnerSystem(
      [...LEVEL_1.waves],
      LEVEL_1.worldWaypoints,
      eventBus
    );
    waveManager = new WaveManager({
      sequence: LEVEL_1.waves,
      spawnerSystem: waveSpawnerSystem,
      stateMachine,
      economyManager: economy,
      scoreManager,
      eventBus,
    });
    gameStateSystem = new GameStateSystem({
      stateMachine,
      waveManager,
      scoreManager,
      economyManager: economy,
      eventBus,
      initialLives: LEVEL_1.initialLives,
    });
    hudPresenter = new HudPresenter(eventBus, {
      initialGold: LEVEL_1.initialGold,
      initialScore: 0,
      initialLives: LEVEL_1.initialLives,
      initialWave: 1,
      totalWaves: LEVEL_1.waves.length,
    });

    levelManager = new LevelManager({
      world,
      tileGrid,
      mapRenderer,
      waveSpawnerSystem,
      waveManager,
      gameStateSystem,
      economyManager: economy,
      scoreManager,
      progressionManager,
      stateMachine,
      eventBus,
      hudPresenter,
      initialLevel: LEVEL_1,
      initialMode: 'adventure',
    });
  });

  it('initializes with Level 1 in Adventure Mode by default', () => {
    expect(levelManager.getCurrentLevel().id).toBe('level-1');
    expect(levelManager.getCurrentLevel().name).toBe('Emerald Plains');
    expect(levelManager.getGameMode()).toBe('adventure');
    expect(levelManager.isAdventureMode()).toBe(true);
    expect(levelManager.hasNextLevel()).toBe(true);
    expect(levelManager.getNextLevel()?.id).toBe('level-2');
  });

  it('loads a specific level and reconfigures grid, economy, waves, and lives', () => {
    // Place a tower and spawn a creep
    TowerFactory.createTower(world, 'archer', 3, 3);
    CreepFactory.createBasicCreep(world, LEVEL_1.worldWaypoints);
    expect(world.query([TOWER_COMPONENT]).length).toBe(1);
    expect(world.query([CREEP_COMPONENT]).length).toBe(1);

    // Load Level 3
    levelManager.loadLevel(LEVEL_3, 'custom');

    expect(levelManager.getCurrentLevel().id).toBe('level-3');
    expect(levelManager.getCurrentLevel().name).toBe('Crag Canyon');
    expect(levelManager.getGameMode()).toBe('custom');
    expect(levelManager.isAdventureMode()).toBe(false);

    // Towers and creeps should be despawned
    expect(world.query([TOWER_COMPONENT]).length).toBe(0);
    expect(world.query([CREEP_COMPONENT]).length).toBe(0);

    // Economy and lives reset to Level 3 defaults
    expect(economy.getGold()).toBe(LEVEL_3.initialGold);
    expect(gameStateSystem.getLives()).toBe(LEVEL_3.initialLives);
    expect(scoreManager.getScore()).toBe(0);

    // Wave Manager configured with Level 3 waves
    expect(waveManager.getTotalWaves()).toBe(LEVEL_3.waves.length);
    expect(waveSpawnerSystem.getWaypoints().length).toBe(LEVEL_3.worldWaypoints.length);
  });

  it('preserves cumulative score when advancing through levels in Adventure Mode', () => {
    levelManager.startAdventure();
    expect(levelManager.getCurrentLevel().id).toBe('level-1');
    expect(scoreManager.getScore()).toBe(0);

    // Earn score on Level 1
    scoreManager.addScore(1500);
    expect(scoreManager.getScore()).toBe(1500);

    // Advance to Level 2
    const next1 = levelManager.advanceToNextLevel();
    expect(next1?.id).toBe('level-2');
    expect(levelManager.getCurrentLevel().id).toBe('level-2');
    expect(scoreManager.getScore()).toBe(1500); // Carried over!
    expect(economy.getGold()).toBe(LEVEL_2.initialGold);

    // Earn more score on Level 2
    scoreManager.addScore(2200);
    expect(scoreManager.getScore()).toBe(3700);

    // Advance to Level 3
    const next2 = levelManager.advanceToNextLevel();
    expect(next2?.id).toBe('level-3');
    expect(scoreManager.getScore()).toBe(3700);

    // Advance to Level 4
    levelManager.advanceToNextLevel();
    expect(levelManager.getCurrentLevel().id).toBe('level-4');

    // Advance to Level 5
    levelManager.advanceToNextLevel();
    expect(levelManager.getCurrentLevel().id).toBe('level-5');
    expect(levelManager.hasNextLevel()).toBe(false);
  });

  it('handles victory recording and detects adventure completion on Level 5', () => {
    // Play Level 1 in adventure mode
    levelManager.startAdventure();
    scoreManager.addScore(2000);

    const v1 = levelManager.handleVictory(3);
    expect(v1.isAdventureComplete).toBe(false);
    expect(v1.nextLevel?.id).toBe('level-2');
    expect(progressionManager.isLevelCompleted('level-1')).toBe(true);
    expect(progressionManager.isLevelUnlocked('level-2')).toBe(true);
    expect(progressionManager.getHighScore('level-1')).toBe(2000);
    expect(progressionManager.getHighScore('adventure')).toBe(2000);

    // Advance to Level 2 in Adventure Mode (score carries over as 2000)
    levelManager.advanceToNextLevel();
    scoreManager.addScore(3500); // Total accumulated: 5500, Level 2 points: 3500

    const v2 = levelManager.handleVictory(3);
    expect(v2.finalScore).toBe(5500);
    expect(v2.levelScore).toBe(3500);
    // Level 2 individual high score should ONLY be 3500 (points scored on level 2)
    expect(progressionManager.getHighScore('level-2')).toBe(3500);
    // Adventure mode high score should be the accumulated 5500
    expect(progressionManager.getHighScore('adventure')).toBe(5500);

    // Load Level 5 and win with accumulated score
    levelManager.loadLevel(LEVEL_5, 'adventure', { initialScore: 8000 });
    scoreManager.addScore(3000); // Total: 11000, Level 5 points: 3000

    const v5 = levelManager.handleVictory(3);
    expect(v5.isAdventureComplete).toBe(true);
    expect(v5.nextLevel).toBeUndefined();
    expect(v5.finalScore).toBe(11000);
    expect(v5.levelScore).toBe(3000);
    // Level 5 individual high score should be 3000
    expect(progressionManager.getHighScore('level-5')).toBe(3000);
    expect(progressionManager.isLevelCompleted('level-5')).toBe(true);
    // Adventure mode high score should be 11000
    expect(progressionManager.getHighScore('adventure')).toBe(11000);
  });

  it('handles game over recording: records level-specific points for level and accumulated score for adventure mode', () => {
    levelManager.startAdventure();
    scoreManager.addScore(1500);
    levelManager.handleVictory(2);

    // Advance to Level 2 (starts with 1500)
    levelManager.advanceToNextLevel();
    scoreManager.addScore(800); // Total 2300, Level 2 points: 800

    const goResult = levelManager.handleGameOver();
    expect(goResult.finalScore).toBe(2300);
    expect(goResult.levelScore).toBe(800);
    expect(progressionManager.getHighScore('level-2')).toBe(800);
    expect(progressionManager.getHighScore('adventure')).toBe(2300);
  });

  it('resets score to 0 on custom level select play', () => {
    levelManager.loadLevel(LEVEL_4, 'custom');
    scoreManager.addScore(4000);

    // Loading another custom level starts with fresh score
    levelManager.loadLevel(LEVEL_2, 'custom');
    expect(scoreManager.getScore()).toBe(0);
    expect(levelManager.getGameMode()).toBe('custom');
  });

  it('restarts current level cleanly', () => {
    levelManager.loadLevel(LEVEL_2, 'custom');
    TowerFactory.createTower(world, 'cannon', 5, 5);
    scoreManager.addScore(500);

    levelManager.restartCurrentLevel();

    expect(world.query([TOWER_COMPONENT]).length).toBe(0);
    expect(scoreManager.getScore()).toBe(0);
    expect(economy.getGold()).toBe(LEVEL_2.initialGold);
    expect(gameStateSystem.getLives()).toBe(LEVEL_2.initialLives);
  });
});
