import { World } from '../../core/ecs/World';
import { TileGrid } from '../map/TileGrid';
import { GameStateMachine, GameState } from './GameStateMachine';
import { WaveManager } from './WaveManager';
import { WaveSpawnerSystem } from '../systems/WaveSpawnerSystem';
import { GameStateSystem } from '../systems/GameStateSystem';
import { EconomyManager } from '../economy/EconomyManager';
import { ScoreManager } from '../scoring/ScoreManager';
import { EventBus, engineEvents } from '../../core/events/EngineEvents';
import { TimeControls } from '../../core/loop/TimeControls';
import { TOWER_COMPONENT } from '../towers/TowerComponents';
import { CREEP_COMPONENT } from '../creeps/CreepComponents';
import { PROJECTILE_COMPONENT } from '../projectiles/ProjectileComponents';

export interface LevelResetOptions {
  world: World;
  tileGrid: TileGrid;
  stateMachine: GameStateMachine;
  waveManager: WaveManager;
  gameStateSystem: GameStateSystem;
  waveSpawnerSystem?: WaveSpawnerSystem;
  economyManager?: EconomyManager;
  scoreManager?: ScoreManager;
  eventBus?: EventBus;
  timeControls?: TimeControls;
  initialLives?: number;
  initialGold?: number;
}

/**
 * Handles complete and clean resetting of an active level:
 * - Resets core lives, player gold balance, and score
 * - Despawns all tower entities and frees occupied tiles in TileGrid
 * - Despawns all active creeps and in-flight projectiles
 * - Resets WaveManager and WaveSpawnerSystem back to Wave 1 / Index 0
 * - Transitions state machine cleanly to PREPARATION
 */
export class LevelResetHandler {
  private world: World;
  private tileGrid: TileGrid;
  private stateMachine: GameStateMachine;
  private waveManager: WaveManager;
  private gameStateSystem: GameStateSystem;
  private waveSpawnerSystem?: WaveSpawnerSystem;
  private economyManager?: EconomyManager;
  private scoreManager?: ScoreManager;
  private eventBus: EventBus;
  private timeControls?: TimeControls;
  private initialLives: number;
  private initialGold: number;

  constructor(options: LevelResetOptions) {
    this.world = options.world;
    this.tileGrid = options.tileGrid;
    this.stateMachine = options.stateMachine;
    this.waveManager = options.waveManager;
    this.gameStateSystem = options.gameStateSystem;
    this.waveSpawnerSystem = options.waveSpawnerSystem ?? options.waveManager.getSpawnerSystem();
    this.economyManager = options.economyManager;
    this.scoreManager = options.scoreManager;
    this.eventBus = options.eventBus ?? engineEvents;
    this.timeControls = options.timeControls;
    this.initialLives = options.initialLives ?? 20;
    this.initialGold = options.initialGold ?? 300;
  }

  /**
   * Performs the level reset procedure.
   */
  public resetLevel(overrides?: { initialLives?: number; initialGold?: number }): void {
    const livesToSet = overrides?.initialLives ?? this.initialLives;
    const goldToSet = overrides?.initialGold ?? this.initialGold;

    // 1. Despawn all towers
    const towers = this.world.query([TOWER_COMPONENT]);
    for (const entity of towers) {
      this.world.destroyEntity(entity);
    }

    // 2. Free all occupied tiles in TileGrid
    for (let y = 0; y < this.tileGrid.height; y++) {
      for (let x = 0; x < this.tileGrid.width; x++) {
        if (this.tileGrid.isOccupied(x, y)) {
          this.tileGrid.freeTile(x, y);
        }
      }
    }

    // 3. Despawn all active creeps
    const creeps = this.world.query([CREEP_COMPONENT]);
    for (const entity of creeps) {
      this.world.destroyEntity(entity);
    }

    // 4. Despawn all in-flight projectiles
    const projectiles = this.world.query([PROJECTILE_COMPONENT]);
    for (const entity of projectiles) {
      this.world.destroyEntity(entity);
    }

    // 5. Reset economy, score, and lives
    if (this.economyManager) {
      this.economyManager.reset(goldToSet);
    }
    if (this.scoreManager) {
      this.scoreManager.reset(0);
    }
    this.gameStateSystem.resetLives(livesToSet);

    // 6. Reset wave spawner and wave manager
    if (this.waveSpawnerSystem) {
      this.waveSpawnerSystem.reset();
    }
    this.waveManager.reset();

    // 7. Ensure state machine is in PREPARATION state and the simulation clock is running
    this.stateMachine.reset(GameState.PREPARATION);
    this.timeControls?.resume();

    // 8. Emit LEVEL_RESET event
    this.eventBus.emit('LEVEL_RESET', {
      initialLives: livesToSet,
      initialGold: goldToSet,
    });
  }

  /**
   * Static utility for resetting a level with provided options.
   */
  public static executeReset(options: LevelResetOptions, overrides?: { initialLives?: number; initialGold?: number }): void {
    const handler = new LevelResetHandler(options);
    handler.resetLevel(overrides);
  }
}
