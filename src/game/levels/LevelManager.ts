import { World } from '../../core/ecs/World';
import { TileGrid } from '../map/TileGrid';
import { MapRenderer } from '../../rendering/MapRenderer';
import { WaveSpawnerSystem } from '../systems/WaveSpawnerSystem';
import { WaveManager } from '../state/WaveManager';
import { GameStateSystem } from '../systems/GameStateSystem';
import { EconomyManager } from '../economy/EconomyManager';
import { ScoreManager } from '../scoring/ScoreManager';
import { ProgressionManager } from '../state/ProgressionManager';
import { GameStateMachine, GameState } from '../state/GameStateMachine';
import { TimeControls } from '../../core/loop/TimeControls';
import { EventBus, engineEvents } from '../../core/events/EngineEvents';
import { HudPresenter } from '../../ui/HudPresenter';
import { TOWER_COMPONENT } from '../towers/TowerComponents';
import { CREEP_COMPONENT } from '../creeps/CreepComponents';
import { PROJECTILE_COMPONENT } from '../projectiles/ProjectileComponents';
import {
  LevelDefinition,
  GameMode,
} from './LevelDefinition';
import {
  LEVEL_1,
  getLevel,
  getNextLevel,
  getDefaultLevel,
} from './LevelCatalog';

export interface LevelManagerOptions {
  world: World;
  tileGrid: TileGrid;
  mapRenderer?: MapRenderer;
  waveSpawnerSystem: WaveSpawnerSystem;
  waveManager: WaveManager;
  gameStateSystem: GameStateSystem;
  economyManager: EconomyManager;
  scoreManager: ScoreManager;
  progressionManager: ProgressionManager;
  stateMachine: GameStateMachine;
  timeControls?: TimeControls;
  eventBus?: EventBus;
  hudPresenter?: HudPresenter;
  initialLevel?: LevelDefinition | string;
  initialMode?: GameMode;
}

export class LevelManager {
  private world: World;
  private tileGrid: TileGrid;
  private mapRenderer?: MapRenderer;
  private waveSpawnerSystem: WaveSpawnerSystem;
  private waveManager: WaveManager;
  private gameStateSystem: GameStateSystem;
  private economyManager: EconomyManager;
  private scoreManager: ScoreManager;
  private progressionManager: ProgressionManager;
  private stateMachine: GameStateMachine;
  private timeControls?: TimeControls;
  private eventBus: EventBus;
  private hudPresenter?: HudPresenter;

  private currentLevel: LevelDefinition;
  private gameMode: GameMode = 'adventure';
  private adventureStartScore: number = 0; // Score when entering current level in adventure mode

  constructor(options: LevelManagerOptions) {
    this.world = options.world;
    this.tileGrid = options.tileGrid;
    this.mapRenderer = options.mapRenderer;
    this.waveSpawnerSystem = options.waveSpawnerSystem;
    this.waveManager = options.waveManager;
    this.gameStateSystem = options.gameStateSystem;
    this.economyManager = options.economyManager;
    this.scoreManager = options.scoreManager;
    this.progressionManager = options.progressionManager;
    this.stateMachine = options.stateMachine;
    this.timeControls = options.timeControls;
    this.eventBus = options.eventBus ?? engineEvents;
    this.hudPresenter = options.hudPresenter;

    const initial = options.initialLevel
      ? typeof options.initialLevel === 'string'
        ? getLevel(options.initialLevel)
        : options.initialLevel
      : getDefaultLevel();

    this.currentLevel = initial;
    this.gameMode = options.initialMode ?? 'adventure';
  }

  public getCurrentLevel(): LevelDefinition {
    return this.currentLevel;
  }

  public getGameMode(): GameMode {
    return this.gameMode;
  }

  public setGameMode(mode: GameMode): void {
    this.gameMode = mode;
  }

  public isAdventureMode(): boolean {
    return this.gameMode === 'adventure';
  }

  public hasNextLevel(): boolean {
    return getNextLevel(this.currentLevel.id) !== undefined;
  }

  public getNextLevel(): LevelDefinition | undefined {
    return getNextLevel(this.currentLevel.id);
  }

  /**
   * Starts a fresh Adventure Mode campaign starting from Level 1 with 0 score.
   */
  public startAdventure(): LevelDefinition {
    this.gameMode = 'adventure';
    this.adventureStartScore = 0;
    return this.loadLevel(LEVEL_1, 'adventure', { initialScore: 0 });
  }

  /**
   * Loads a specific level and re-initializes all gameplay state.
   */
  public loadLevel(
    levelInput: LevelDefinition | string,
    mode: GameMode = this.gameMode,
    options: { initialScore?: number; retainScore?: boolean } = {}
  ): LevelDefinition {
    const level = typeof levelInput === 'string' ? getLevel(levelInput) : levelInput;
    this.currentLevel = level;
    this.gameMode = mode;

    // 1. Despawn all active tower entities in World
    const towers = this.world.query([TOWER_COMPONENT]);
    for (const entity of towers) {
      this.world.destroyEntity(entity);
    }

    // 2. Free all occupied tiles in TileGrid & load new level map layout
    for (let y = 0; y < this.tileGrid.height; y++) {
      for (let x = 0; x < this.tileGrid.width; x++) {
        if (this.tileGrid.isOccupied(x, y)) {
          this.tileGrid.freeTile(x, y);
        }
      }
    }
    this.tileGrid.loadLevelConfig(level.mapConfig);

    // 3. Update MapRenderer theme
    if (this.mapRenderer) {
      this.mapRenderer.setGrid(this.tileGrid);
      this.mapRenderer.setTheme(level.theme);
    }

    // 4. Despawn all active creeps
    const creeps = this.world.query([CREEP_COMPONENT]);
    for (const entity of creeps) {
      this.world.destroyEntity(entity);
    }

    // 5. Despawn all in-flight projectiles
    const projectiles = this.world.query([PROJECTILE_COMPONENT]);
    for (const entity of projectiles) {
      this.world.destroyEntity(entity);
    }

    // 6. Reset wave spawner system with new waypoints and waves
    this.waveSpawnerSystem.setWaypoints(level.worldWaypoints);
    this.waveSpawnerSystem.setWaves(level.waves);
    this.waveSpawnerSystem.reset();

    // 7. Reset WaveManager with new wave sequence
    this.waveManager.setSequence(level.waves);
    this.waveManager.reset();

    // 8. Determine starting score for this level
    let startingScore = 0;
    if (options.initialScore !== undefined) {
      startingScore = options.initialScore;
    } else if (options.retainScore) {
      startingScore = this.scoreManager.getScore();
    } else if (mode === 'adventure') {
      startingScore = this.adventureStartScore;
    } else {
      startingScore = 0;
    }

    if (mode === 'adventure') {
      this.adventureStartScore = startingScore;
    }

    // 9. Reset score, economy, and lives
    this.scoreManager.reset(startingScore);
    this.economyManager.reset(level.initialGold);
    this.gameStateSystem.resetLives(level.initialLives);

    // 10. Update HUD Presenter
    if (this.hudPresenter) {
      this.hudPresenter.setLevelInfo(level.number, level.name, mode);
      this.hudPresenter.setWave(1, level.waves.length);
      this.hudPresenter.setGold(level.initialGold);
      this.hudPresenter.setLives(level.initialLives);
      this.hudPresenter.setScore(startingScore);
    }

    // 11. Reset State Machine to PREPARATION & resume time controls
    this.stateMachine.reset(GameState.PREPARATION);
    this.timeControls?.resume();

    // 12. Emit LEVEL_RESET and LEVEL_LOADED events
    this.eventBus.emit('LEVEL_RESET', {
      initialLives: level.initialLives,
      initialGold: level.initialGold,
      initialScore: startingScore,
    });

    this.eventBus.emit('LEVEL_LOADED', {
      levelId: level.id,
      levelNumber: level.number,
      levelName: level.name,
      gameMode: mode,
      initialGold: level.initialGold,
      initialLives: level.initialLives,
      totalWaves: level.waves.length,
    });

    return level;
  }

  /**
   * Advances to the next level in sequence.
   * In Adventure Mode, accumulates current total score and carries it forward.
   */
  public advanceToNextLevel(): LevelDefinition | undefined {
    const next = getNextLevel(this.currentLevel.id);
    if (!next) {
      return undefined;
    }

    const currentTotalScore = this.scoreManager.getScore();
    return this.loadLevel(next, this.gameMode, {
      initialScore: this.gameMode === 'adventure' ? currentTotalScore : 0,
    });
  }

  /**
   * Restarts the current level.
   */
  public restartCurrentLevel(): LevelDefinition {
    return this.loadLevel(this.currentLevel, this.gameMode, {
      initialScore: this.gameMode === 'adventure' ? this.adventureStartScore : 0,
    });
  }

  /**
   * Handles level completion victory recording and progression updates.
   */
  public handleVictory(stars: number = 3): {
    nextLevel?: LevelDefinition;
    isAdventureComplete: boolean;
    finalScore: number;
    levelScore: number;
  } {
    const finalScore = this.scoreManager.getScore();
    const levelScore = Math.max(
      0,
      finalScore - (this.gameMode === 'adventure' ? this.adventureStartScore : 0)
    );
    const nextLevel = getNextLevel(this.currentLevel.id);

    // Record victory in persistent progression for this individual level (only points scored on that level)
    this.progressionManager.recordVictory(
      this.currentLevel.id,
      levelScore,
      stars,
      nextLevel?.id
    );

    // If in adventure mode, also record cumulative accumulated adventure score
    if (this.gameMode === 'adventure') {
      this.progressionManager.recordScore('adventure', finalScore);
    }

    const isAdventureComplete = this.gameMode === 'adventure' && !nextLevel;

    return {
      nextLevel,
      isAdventureComplete,
      finalScore,
      levelScore,
    };
  }

  /**
   * Handles game over defeat recording and progression updates.
   */
  public handleGameOver(): {
    levelScore: number;
    finalScore: number;
  } {
    const finalScore = this.scoreManager.getScore();
    const levelScore = Math.max(
      0,
      finalScore - (this.gameMode === 'adventure' ? this.adventureStartScore : 0)
    );

    // Record high score for this level (only points scored on that level)
    this.progressionManager.recordScore(this.currentLevel.id, levelScore);

    // If in adventure mode, also record cumulative accumulated adventure score
    if (this.gameMode === 'adventure') {
      this.progressionManager.recordScore('adventure', finalScore);
    }

    return {
      levelScore,
      finalScore,
    };
  }
}
