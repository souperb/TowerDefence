import { World } from '../../core/ecs/World';
import { System } from '../../core/ecs/System';
import { EventBus, engineEvents, BaseBreachEvent } from '../../core/events/EngineEvents';
import { GameStateMachine, GameState } from '../state/GameStateMachine';
import { WaveManager } from '../state/WaveManager';
import { ScoreManager } from '../scoring/ScoreManager';
import { EconomyManager } from '../economy/EconomyManager';
import { CREEP_COMPONENT } from '../creeps/CreepComponents';

export interface GameStateSystemOptions {
  stateMachine: GameStateMachine;
  waveManager: WaveManager;
  scoreManager?: ScoreManager;
  economyManager?: EconomyManager;
  eventBus?: EventBus;
  initialLives?: number;
}

export interface VictoryStats {
  score: number;
  livesRemaining: number;
  initialLives: number;
  totalWaves: number;
  stars: number;
}

export interface GameOverStats {
  score: number;
  waveReached: number;
  totalWaves: number;
  kills: number;
}

/**
 * Evaluates victory and defeat game state conditions, manages core lives,
 * triggers terminal state transitions, and halts simulation on game over or victory.
 */
export class GameStateSystem implements System {
  public name = 'GameStateSystem';
  public priority = 20;

  private stateMachine: GameStateMachine;
  private waveManager: WaveManager;
  private scoreManager?: ScoreManager;
  private economyManager?: EconomyManager;
  private eventBus: EventBus;

  private initialLives: number;
  private currentLives: number;
  private unsubs: Array<() => void> = [];

  constructor(options: GameStateSystemOptions) {
    this.stateMachine = options.stateMachine;
    this.waveManager = options.waveManager;
    this.scoreManager = options.scoreManager;
    this.economyManager = options.economyManager;
    this.eventBus = options.eventBus ?? engineEvents;
    this.initialLives = options.initialLives ?? 20;
    this.currentLives = this.initialLives;

    this.bindEvents();
  }

  private bindEvents(): void {
    const breachUnsub = this.eventBus.on('BASE_BREACH', (data: BaseBreachEvent) => {
      this.deductLives(data.damageToBase);
    });
    this.unsubs.push(breachUnsub);
  }

  public getEconomyManager(): EconomyManager | undefined {
    return this.economyManager;
  }

  public getScoreManager(): ScoreManager | undefined {
    return this.scoreManager;
  }

  public getLives(): number {
    return this.currentLives;
  }

  public getInitialLives(): number {
    return this.initialLives;
  }

  public setLives(lives: number): void {
    this.currentLives = Math.max(0, lives);
  }

  public deductLives(amount: number): void {
    if (amount <= 0) return;
    this.currentLives = Math.max(0, this.currentLives - amount);
  }

  public isGameOver(): boolean {
    return this.stateMachine.isGameOver();
  }

  public isVictory(): boolean {
    return this.stateMachine.isVictory();
  }

  public isSimulationHalted(): boolean {
    return this.stateMachine.isTerminal();
  }

  public resetLives(initialLives?: number): void {
    if (initialLives !== undefined) {
      this.initialLives = Math.max(1, initialLives);
    }
    this.currentLives = this.initialLives;
  }

  public reset(initialLives?: number): void {
    this.resetLives(initialLives);
  }

  public calculateStars(): number {
    if (this.currentLives <= 0) return 0;
    const ratio = this.currentLives / this.initialLives;
    if (ratio >= 0.8 || this.currentLives === this.initialLives) {
      return 3;
    }
    if (ratio >= 0.4) {
      return 2;
    }
    return 1;
  }

  public update(world: World, _dt: number): void {
    if (this.stateMachine.isPaused()) {
      return;
    }

    // Halt simulation if already in terminal state
    if (this.stateMachine.isTerminal()) {
      return;
    }

    const currentScore = this.scoreManager ? this.scoreManager.getScore() : 0;
    const currentKills = this.scoreManager ? this.scoreManager.getKillCount() : 0;
    const totalWaves = this.waveManager.getTotalWaves();
    const waveReached = this.waveManager.getCurrentWaveNumber();

    // Defeat condition: Lives <= 0
    if (this.currentLives <= 0) {
      const gameOverStats: GameOverStats = {
        score: currentScore,
        waveReached,
        totalWaves,
        kills: currentKills,
      };

      this.stateMachine.transitionTo(GameState.GAME_OVER, gameOverStats);

      this.eventBus.emit('GAME_OVER', {
        finalScore: currentScore,
        waveReached,
        totalWaves,
        kills: currentKills,
      });
      return;
    }

    // Victory condition: All waves cleared and no creeps alive
    if (this.waveManager.isAllWavesCleared()) {
      const remainingCreeps = world.query([CREEP_COMPONENT]);
      if (remainingCreeps.length === 0 && this.currentLives > 0) {
        const stars = this.calculateStars();
        const victoryStats: VictoryStats = {
          score: currentScore,
          livesRemaining: this.currentLives,
          initialLives: this.initialLives,
          totalWaves,
          stars,
        };

        this.stateMachine.transitionTo(GameState.VICTORY, victoryStats);

        this.eventBus.emit('VICTORY', {
          finalScore: currentScore,
          livesRemaining: this.currentLives,
          totalWaves,
          stars,
        });
      }
    }
  }

  public destroy(_world?: World): void {
    for (const unsub of this.unsubs) {
      unsub();
    }
    this.unsubs = [];
  }
}
