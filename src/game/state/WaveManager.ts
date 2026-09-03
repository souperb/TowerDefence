import { World } from '../../core/ecs/World';
import { EventBus, engineEvents } from '../../core/events/EngineEvents';
import { WaveDefinition } from '../waves/WaveDefinition';
import { WaveSequence } from '../waves/WaveSequence';
import { WaveSpawnerSystem } from '../systems/WaveSpawnerSystem';
import { GameStateMachine, GameState } from './GameStateMachine';
import { CREEP_COMPONENT } from '../creeps/CreepComponents';
import { EconomyManager } from '../economy/EconomyManager';
import { ScoreManager } from '../scoring/ScoreManager';

export interface WaveManagerOptions {
  sequence?: WaveSequence | WaveDefinition[];
  spawnerSystem?: WaveSpawnerSystem;
  stateMachine?: GameStateMachine;
  economyManager?: EconomyManager;
  scoreManager?: ScoreManager;
  eventBus?: EventBus;
  autoStartDelaySeconds?: number;
  autoStartEnabled?: boolean;
  requireManualFirstWave?: boolean;
}

export type CountdownTickListener = (remainingSeconds: number, totalDuration: number) => void;

/**
 * Manages wave sequence progression, auto-start countdown timers, manual wave triggers,
 * and wave completion evaluation (requiring all creeps to be spawned and defeated).
 */
export class WaveManager {
  private sequence: WaveSequence;
  private spawnerSystem: WaveSpawnerSystem;
  private stateMachine: GameStateMachine;
  private economyManager?: EconomyManager;
  private scoreManager?: ScoreManager;
  private eventBus: EventBus;

  private currentWaveIndex: number = 0;
  private autoStartDelaySeconds: number;
  private autoStartEnabled: boolean;
  private requireManualFirstWave: boolean;
  private countdownTimer: number = 0;
  private isPreparationActive: boolean = false;
  private allWavesCleared: boolean = false;

  private countdownListeners: Set<CountdownTickListener> = new Set();

  constructor(options: WaveManagerOptions = {}) {
    if (options.sequence instanceof WaveSequence) {
      this.sequence = options.sequence;
    } else if (Array.isArray(options.sequence)) {
      this.sequence = new WaveSequence(options.sequence);
    } else {
      this.sequence = WaveSequence.fromDefaultWaves();
    }

    this.eventBus = options.eventBus ?? engineEvents;
    this.stateMachine = options.stateMachine ?? new GameStateMachine({ eventBus: this.eventBus });
    this.economyManager = options.economyManager;
    this.scoreManager = options.scoreManager;

    this.autoStartDelaySeconds = options.autoStartDelaySeconds ?? 10.0;
    this.autoStartEnabled = options.autoStartEnabled ?? false;
    this.requireManualFirstWave = options.requireManualFirstWave ?? true;

    this.spawnerSystem = options.spawnerSystem ?? new WaveSpawnerSystem(
      [...this.sequence.getWaves()],
      [],
      this.eventBus
    );
    this.spawnerSystem.setWaves([...this.sequence.getWaves()]);

    this.startPreparation();
  }

  public getStateMachine(): GameStateMachine {
    return this.stateMachine;
  }

  public getSpawnerSystem(): WaveSpawnerSystem {
    return this.spawnerSystem;
  }

  public getSequence(): WaveSequence {
    return this.sequence;
  }

  public setSequence(sequence: WaveSequence | WaveDefinition[]): void {
    if (sequence instanceof WaveSequence) {
      this.sequence = sequence;
    } else {
      this.sequence = new WaveSequence(sequence);
    }
    this.spawnerSystem.setWaves([...this.sequence.getWaves()]);
    this.reset();
  }

  public getCurrentWaveIndex(): number {
    return this.currentWaveIndex;
  }

  public getCurrentWaveNumber(): number {
    return this.currentWaveIndex + 1;
  }

  public getTotalWaves(): number {
    return this.sequence.getTotalWaves();
  }

  public getCurrentWave(): WaveDefinition | null {
    return this.sequence.getWave(this.currentWaveIndex);
  }

  public getCountdownRemaining(): number {
    return this.isPreparationActive ? Math.max(0, this.countdownTimer) : 0;
  }

  public getCountdownDuration(): number {
    return this.autoStartDelaySeconds;
  }

  public isAutoStartEnabled(): boolean {
    return this.autoStartEnabled;
  }

  public isRequireManualFirstWave(): boolean {
    return this.requireManualFirstWave;
  }

  public setRequireManualFirstWave(required: boolean): void {
    this.requireManualFirstWave = required;
  }

  public setAutoStartEnabled(enabled: boolean): void {
    const changed = this.autoStartEnabled !== enabled;
    this.autoStartEnabled = enabled;
    if (changed) {
      if (enabled) {
        if (
          this.stateMachine.getState() === GameState.PREPARATION &&
          !this.isPreparationActive &&
          (this.currentWaveIndex > 0 || !this.requireManualFirstWave)
        ) {
          this.startPreparation(this.autoStartDelaySeconds, true);
        }
      } else {
        if (this.stateMachine.getState() === GameState.PREPARATION && this.isPreparationActive) {
          this.isPreparationActive = false;
          this.countdownTimer = 0;
          this.notifyCountdownTick();
        }
      }
      this.eventBus.emit('AUTO_WAVE_CHANGED', { enabled: this.autoStartEnabled });
    }
  }

  public toggleAutoStart(): boolean {
    this.setAutoStartEnabled(!this.autoStartEnabled);
    return this.autoStartEnabled;
  }

  public setAutoStartDelay(delaySeconds: number): void {
    if (delaySeconds < 0) {
      throw new Error('Countdown delay cannot be negative');
    }
    this.autoStartDelaySeconds = delaySeconds;
  }

  public isAllWavesCleared(): boolean {
    return this.allWavesCleared;
  }

  public isWaveActive(): boolean {
    return this.stateMachine.isWaveActive();
  }

  /**
   * Starts the inter-wave preparation countdown phase.
   */
  public startPreparation(durationSeconds: number = this.autoStartDelaySeconds, forceCountdown: boolean = false): void {
    if (this.currentWaveIndex >= this.sequence.getTotalWaves()) {
      return;
    }

    if (this.stateMachine.getState() !== GameState.PREPARATION) {
      this.stateMachine.transitionTo(GameState.PREPARATION);
    }

    // At level start on wave 1, require manual start unless explicitly forced
    if (this.currentWaveIndex === 0 && this.requireManualFirstWave && !forceCountdown) {
      this.countdownTimer = 0;
      this.isPreparationActive = false;
      this.notifyCountdownTick();
      return;
    }

    this.countdownTimer = durationSeconds;
    this.isPreparationActive = true;
    this.notifyCountdownTick();
  }

  /**
   * Manually triggers immediate start of the current wave, skipping any countdown.
   * Returns true if wave started successfully.
   */
  public startWaveNow(): boolean {
    if (this.currentWaveIndex >= this.sequence.getTotalWaves()) {
      return false;
    }
    if (this.stateMachine.isTerminal() || this.stateMachine.isPaused()) {
      return false;
    }
    if (this.stateMachine.isWaveActive()) {
      return false;
    }

    this.isPreparationActive = false;
    this.countdownTimer = 0;

    const started = this.spawnerSystem.startWave(this.currentWaveIndex);
    if (!started) {
      return false;
    }

    this.stateMachine.transitionTo(GameState.SPAWNING, {
      waveIndex: this.currentWaveIndex,
      waveNumber: this.getCurrentWaveNumber(),
      totalWaves: this.getTotalWaves(),
    });

    return true;
  }

  /**
   * Resets wave manager to initial state (Wave 1 / Index 0, initial preparation).
   */
  public reset(): void {
    this.currentWaveIndex = 0;
    this.allWavesCleared = false;
    this.spawnerSystem.reset();
    this.stateMachine.reset(GameState.PREPARATION);
    this.startPreparation();
  }

  /**
   * Evaluates wave progression, countdown ticks, and wave completion.
   */
  public update(world: World, dt: number): void {
    const currentState = this.stateMachine.getState();

    if (currentState === GameState.PAUSED || currentState === GameState.GAME_OVER || currentState === GameState.VICTORY) {
      return;
    }

    if (currentState === GameState.PREPARATION) {
      if (this.isPreparationActive && dt > 0) {
        this.countdownTimer -= dt;
        this.notifyCountdownTick();

        if (this.countdownTimer <= 0) {
          this.countdownTimer = 0;
          if (this.autoStartEnabled) {
            this.startWaveNow();
          }
        }
      }
      return;
    }

    if (currentState === GameState.SPAWNING) {
      if (this.spawnerSystem.isWaveSpawningComplete()) {
        const activeCreeps = world.query([CREEP_COMPONENT]);
        if (activeCreeps.length > 0) {
          this.stateMachine.transitionTo(GameState.IN_PROGRESS, {
            waveIndex: this.currentWaveIndex,
            activeCreeps: activeCreeps.length,
          });
        } else {
          this.handleWaveCompletion(world);
        }
      }
      return;
    }

    if (currentState === GameState.IN_PROGRESS) {
      const activeCreeps = world.query([CREEP_COMPONENT]);
      if (activeCreeps.length === 0) {
        this.handleWaveCompletion(world);
      }
      return;
    }
  }

  /**
   * Handles wave completion when all creeps of the wave are dead/cleared.
   */
  private handleWaveCompletion(_world: World): void {
    const completedIndex = this.currentWaveIndex;
    const currentWave = this.getCurrentWave();

    // Award gold / score rewards if defined in wave
    if (currentWave?.rewardGold && this.economyManager) {
      this.economyManager.addGold(currentWave.rewardGold, 'wave_clear');
    }
    if (currentWave?.rewardScore && this.scoreManager) {
      this.scoreManager.addWaveClearScore(completedIndex + 1, {
        baseWavePoints: currentWave.rewardScore,
      });
    }

    this.stateMachine.transitionTo(GameState.WAVE_COMPLETED, {
      waveIndex: completedIndex,
      waveNumber: completedIndex + 1,
    });

    this.eventBus.emit('WAVE_COMPLETED', {
      waveIndex: completedIndex,
      waveNumber: completedIndex + 1,
    });

    if (this.sequence.isLastWave(completedIndex)) {
      this.allWavesCleared = true;
      // Do not start next preparation; GameStateSystem will transition to VICTORY
    } else {
      // Advance to next wave
      this.currentWaveIndex++;
      if (this.autoStartEnabled) {
        this.startPreparation(this.autoStartDelaySeconds, true);
      } else {
        this.isPreparationActive = false;
        this.countdownTimer = 0;
        if (this.stateMachine.getState() !== GameState.PREPARATION) {
          this.stateMachine.transitionTo(GameState.PREPARATION);
        }
        this.notifyCountdownTick();
      }
    }
  }

  /**
   * Subscribes to countdown timer ticks.
   */
  public onCountdownTick(listener: CountdownTickListener): () => void {
    this.countdownListeners.add(listener);
    return () => {
      this.countdownListeners.delete(listener);
    };
  }

  private notifyCountdownTick(): void {
    const remaining = this.getCountdownRemaining();
    const duration = this.autoStartDelaySeconds;

    for (const listener of this.countdownListeners) {
      try {
        listener(remaining, duration);
      } catch (err) {
        console.error('[WaveManager] Error in countdown listener:', err);
      }
    }

    if (this.eventBus) {
      this.eventBus.emit('WAVE_COUNTDOWN_TICK', {
        remainingSeconds: remaining,
        totalDuration: duration,
        waveIndex: this.currentWaveIndex,
      });
    }
  }
}
