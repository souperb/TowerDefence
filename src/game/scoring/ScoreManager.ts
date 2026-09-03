import { EventBus, engineEvents } from '../../core/events/EngineEvents';
import { ScoreCalculator, CreepScoreOptions, WaveClearScoreOptions } from './ScoreCalculator';

export type ScoreChangeCallback = (currentScore: number, delta: number, source?: string) => void;

export interface ScoreState {
  score: number;
  killCount: number;
  speedMultiplier: number;
  difficultyMultiplier: number;
}

export interface ScoreManagerOptions {
  speedMultiplier?: number;
  difficultyMultiplier?: number;
  eventBus?: EventBus;
}

export class ScoreManager {
  private score: number = 0;
  private killCount: number = 0;
  private speedMultiplier: number = 1.0;
  private difficultyMultiplier: number = 1.0;
  private eventBus: EventBus;
  private listeners: Set<ScoreChangeCallback> = new Set();

  constructor(initialScore: number = 0, options: ScoreManagerOptions = {}) {
    if (initialScore < 0) {
      throw new Error('Initial score cannot be negative');
    }
    this.score = initialScore;
    this.speedMultiplier = options.speedMultiplier ?? 1.0;
    this.difficultyMultiplier = options.difficultyMultiplier ?? 1.0;
    this.eventBus = options.eventBus ?? engineEvents;
  }

  /**
   * Sets or replaces the event bus instance.
   */
  public setEventBus(bus: EventBus): void {
    this.eventBus = bus;
  }

  /**
   * Returns current event bus instance.
   */
  public getEventBus(): EventBus {
    return this.eventBus;
  }

  /**
   * Returns current accumulated score.
   */
  public getScore(): number {
    return this.score;
  }

  /**
   * Returns total number of creep kills registered.
   */
  public getKillCount(): number {
    return this.killCount;
  }

  /**
   * Returns current game speed multiplier.
   */
  public getSpeedMultiplier(): number {
    return this.speedMultiplier;
  }

  /**
   * Sets game speed multiplier (e.g., 1.0 for normal, 2.0 for fast).
   */
  public setSpeedMultiplier(multiplier: number): void {
    if (multiplier < 0) {
      throw new Error('Speed multiplier cannot be negative');
    }
    this.speedMultiplier = multiplier;
  }

  /**
   * Returns current difficulty multiplier.
   */
  public getDifficultyMultiplier(): number {
    return this.difficultyMultiplier;
  }

  /**
   * Sets game difficulty multiplier (e.g., 1.0 for normal, 1.5 for hard).
   */
  public setDifficultyMultiplier(multiplier: number): void {
    if (multiplier < 0) {
      throw new Error('Difficulty multiplier cannot be negative');
    }
    this.difficultyMultiplier = multiplier;
  }

  /**
   * Returns snapshot of current score state.
   */
  public getState(): ScoreState {
    return {
      score: this.score,
      killCount: this.killCount,
      speedMultiplier: this.speedMultiplier,
      difficultyMultiplier: this.difficultyMultiplier,
    };
  }

  /**
   * Directly sets the current score.
   */
  public setScore(amount: number, source?: string): void {
    if (amount < 0) {
      throw new Error('Score cannot be negative');
    }
    const delta = amount - this.score;
    if (delta !== 0) {
      this.score = amount;
      this.notifyListeners(delta, source);
    }
  }

  /**
   * Directly adds points to the score.
   */
  public addScore(amount: number, source?: string): void {
    if (amount < 0) {
      throw new Error('Score to add cannot be negative');
    }
    if (amount === 0) return;
    this.score += amount;
    this.notifyListeners(amount, source);
  }

  /**
   * Calculates and adds score for defeating a creep, applying current multipliers.
   * Returns the points awarded.
   */
  public addCreepKillScore(
    baseScoreValue: number,
    options: CreepScoreOptions = {}
  ): number {
    const calculatedPoints = ScoreCalculator.calculateCreepKillScore(baseScoreValue, {
      speedMultiplier: this.speedMultiplier,
      difficultyMultiplier: this.difficultyMultiplier,
      ...options,
    });

    this.killCount++;
    if (calculatedPoints > 0) {
      this.score += calculatedPoints;
      this.notifyListeners(calculatedPoints, 'creep_kill');
    }
    return calculatedPoints;
  }

  /**
   * Calculates and adds score for clearing a wave, applying current multipliers.
   * Returns the points awarded.
   */
  public addWaveClearScore(
    waveIndex: number,
    options: WaveClearScoreOptions = {}
  ): number {
    const calculatedPoints = ScoreCalculator.calculateWaveClearScore(waveIndex, {
      speedMultiplier: this.speedMultiplier,
      difficultyMultiplier: this.difficultyMultiplier,
      ...options,
    });

    if (calculatedPoints > 0) {
      this.score += calculatedPoints;
      this.notifyListeners(calculatedPoints, 'wave_clear');
    }
    return calculatedPoints;
  }

  /**
   * Resets score, kill count, and notifies listeners.
   */
  public reset(initialScore: number = 0): void {
    if (initialScore < 0) {
      throw new Error('Initial score cannot be negative');
    }
    const delta = initialScore - this.score;
    this.score = initialScore;
    this.killCount = 0;
    this.notifyListeners(delta, 'reset');
  }

  /**
   * Subscribes a listener to score changes.
   * @returns Unsubscribe callback.
   */
  public onScoreChanged(callback: ScoreChangeCallback): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Alias for onScoreChanged.
   */
  public subscribe(callback: ScoreChangeCallback): () => void {
    return this.onScoreChanged(callback);
  }

  private notifyListeners(delta: number, source?: string): void {
    for (const listener of this.listeners) {
      try {
        listener(this.score, delta, source);
      } catch (err) {
        console.error('[ScoreManager] Listener error:', err);
      }
    }

    if (this.eventBus) {
      this.eventBus.emit('SCORE_CHANGED', {
        currentScore: this.score,
        delta,
        source,
      });
    }
  }
}
