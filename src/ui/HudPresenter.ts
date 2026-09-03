import {
  EventBus,
  engineEvents,
  GoldChangedEvent,
  ScoreChangedEvent,
  CreepKilledEvent,
  BaseBreachEvent,
  WaveStartedEvent,
  WaveCompletedEvent,
} from '../core/events/EngineEvents';
import { IVector2 } from '../core/math/Vector2';

export interface HudState {
  gold: number;
  score: number;
  lives: number;
  wave: number;
  totalWaves?: number;
  kills: number;
  levelNumber?: number;
  levelName?: string;
  gameMode?: 'adventure' | 'custom';
  autoWave?: boolean;
}

export interface FloatingPopup {
  id: string;
  type: 'gold' | 'score' | 'breach' | 'wave';
  text: string;
  delta?: number;
  position?: IVector2;
  timestamp: number;
}

export type HudStateListener = (state: Readonly<HudState>) => void;
export type PopupListener = (popup: FloatingPopup) => void;

export interface HudPresenterConfig {
  initialGold?: number;
  initialScore?: number;
  initialLives?: number;
  initialWave?: number;
  totalWaves?: number;
  autoWave?: boolean;
}

/**
 * Presenter bridging engine event bus notifications with user interface components and HUD overlays.
 * Maintains reactive game statistics (gold, score, lives, wave) and notifies UI subscribers.
 */
export class HudPresenter {
  private state: HudState;
  private eventBus: EventBus;
  private stateListeners: Set<HudStateListener> = new Set();
  private popupListeners: Set<PopupListener> = new Set();
  private unsubs: Array<() => void> = [];
  private popupCounter: number = 0;

  constructor(
    eventBus: EventBus = engineEvents,
    config: HudPresenterConfig = {}
  ) {
    this.eventBus = eventBus;
    this.state = {
      gold: config.initialGold ?? 300,
      score: config.initialScore ?? 0,
      lives: config.initialLives ?? 20,
      wave: config.initialWave ?? 0,
      totalWaves: config.totalWaves,
      kills: 0,
      autoWave: config.autoWave ?? false,
    };

    this.bindEvents();
  }

  /**
   * Binds to event bus events.
   */
  private bindEvents(): void {
    const unsubGold = this.eventBus.on('GOLD_CHANGED', (data: GoldChangedEvent) => {
      this.state.gold = data.currentGold;
      if (data.delta !== 0) {
        this.emitPopup({
          id: `gold-${++this.popupCounter}`,
          type: 'gold',
          delta: data.delta,
          text: data.delta > 0 ? `+${data.delta}g` : `${data.delta}g`,
          timestamp: Date.now(),
        });
      }
      this.notifyStateChanged();
    });

    const unsubScore = this.eventBus.on('SCORE_CHANGED', (data: ScoreChangedEvent) => {
      this.state.score = data.currentScore;
      if (data.delta !== 0) {
        this.emitPopup({
          id: `score-${++this.popupCounter}`,
          type: 'score',
          delta: data.delta,
          text: data.delta > 0 ? `+${data.delta} pts` : `${data.delta} pts`,
          timestamp: Date.now(),
        });
      }
      this.notifyStateChanged();
    });

    const unsubKill = this.eventBus.on('CREEP_KILLED', (data: CreepKilledEvent) => {
      this.state.kills++;
      if (data.position) {
        this.emitPopup({
          id: `kill-${++this.popupCounter}`,
          type: 'gold',
          delta: data.bountyGold,
          text: `+${data.bountyGold}g`,
          position: { ...data.position },
          timestamp: Date.now(),
        });
      }
      this.notifyStateChanged();
    });

    const unsubBreach = this.eventBus.on('BASE_BREACH', (data: BaseBreachEvent) => {
      this.state.lives = Math.max(0, this.state.lives - data.damageToBase);
      this.emitPopup({
        id: `breach-${++this.popupCounter}`,
        type: 'breach',
        delta: -data.damageToBase,
        text: `-${data.damageToBase} Lives!`,
        timestamp: Date.now(),
      });
      this.notifyStateChanged();
    });

    const unsubWaveStarted = this.eventBus.on('WAVE_STARTED', (data: WaveStartedEvent) => {
      const waveNumber = data.waveNumber ?? data.waveIndex + 1;
      this.state.wave = waveNumber;
      if (data.totalWaves !== undefined) {
        this.state.totalWaves = data.totalWaves;
      }
      this.emitPopup({
        id: `wave-${++this.popupCounter}`,
        type: 'wave',
        text: `Wave ${waveNumber} Started!`,
        timestamp: Date.now(),
      });
      this.notifyStateChanged();
    });

    const unsubWaveCompleted = this.eventBus.on('WAVE_COMPLETED', (data: WaveCompletedEvent) => {
      this.emitPopup({
        id: `wave-complete-${++this.popupCounter}`,
        type: 'wave',
        text: `Wave ${data.waveNumber ?? data.waveIndex + 1} Completed!`,
        timestamp: Date.now(),
      });
    });

    const unsubAutoWaveChanged = this.eventBus.on('AUTO_WAVE_CHANGED', (data: { enabled: boolean }) => {
      this.state.autoWave = data.enabled;
      this.notifyStateChanged();
    });

    const unsubLevelReset = this.eventBus.on('LEVEL_RESET', (data: { initialLives?: number; initialGold?: number; initialScore?: number }) => {
      this.state.lives = data.initialLives ?? 20;
      this.state.gold = data.initialGold ?? 300;
      this.state.score = data.initialScore ?? 0;
      this.state.wave = 1;
      this.state.kills = 0;
      this.notifyStateChanged();
    });

    this.unsubs.push(
      unsubGold,
      unsubScore,
      unsubKill,
      unsubBreach,
      unsubWaveStarted,
      unsubWaveCompleted,
      unsubAutoWaveChanged,
      unsubLevelReset
    );
  }

  /**
   * Returns current read-only snapshot of HUD state.
   */
  public getState(): Readonly<HudState> {
    return { ...this.state };
  }

  public getGold(): number {
    return this.state.gold;
  }

  public getScore(): number {
    return this.state.score;
  }

  public getLives(): number {
    return this.state.lives;
  }

  public getWave(): number {
    return this.state.wave;
  }

  public getKills(): number {
    return this.state.kills;
  }

  public setGold(gold: number): void {
    this.state.gold = Math.max(0, gold);
    this.notifyStateChanged();
  }

  public setScore(score: number): void {
    this.state.score = Math.max(0, score);
    this.notifyStateChanged();
  }

  public setLives(lives: number): void {
    this.state.lives = Math.max(0, lives);
    this.notifyStateChanged();
  }

  public setWave(wave: number, totalWaves?: number): void {
    this.state.wave = Math.max(0, wave);
    if (totalWaves !== undefined) {
      this.state.totalWaves = totalWaves;
    }
    this.notifyStateChanged();
  }

  public setLevelInfo(levelNumber: number, levelName: string, gameMode: 'adventure' | 'custom' = 'custom'): void {
    this.state.levelNumber = levelNumber;
    this.state.levelName = levelName;
    this.state.gameMode = gameMode;
    this.notifyStateChanged();
  }

  public setAutoWave(enabled: boolean): void {
    this.state.autoWave = enabled;
    this.notifyStateChanged();
  }

  /**
   * Subscribes a listener to HUD state changes.
   * Immediately calls the listener with the current state.
   */
  public onStateChange(listener: HudStateListener): () => void {
    this.stateListeners.add(listener);
    try {
      listener(this.getState());
    } catch (err) {
      console.error('[HudPresenter] Listener error on initial call:', err);
    }
    return () => this.stateListeners.delete(listener);
  }

  /**
   * Alias for onStateChange.
   */
  public subscribe(listener: HudStateListener): () => void {
    return this.onStateChange(listener);
  }

  /**
   * Subscribes a listener to floating popup notifications.
   */
  public onPopup(listener: PopupListener): () => void {
    this.popupListeners.add(listener);
    return () => this.popupListeners.delete(listener);
  }

  /**
   * Unsubscribes all event handlers and clears listeners.
   */
  public destroy(): void {
    for (const unsub of this.unsubs) {
      unsub();
    }
    this.unsubs = [];
    this.stateListeners.clear();
    this.popupListeners.clear();
  }

  private notifyStateChanged(): void {
    const snapshot = this.getState();
    for (const listener of this.stateListeners) {
      try {
        listener(snapshot);
      } catch (err) {
        console.error('[HudPresenter] State listener error:', err);
      }
    }
  }

  private emitPopup(popup: FloatingPopup): void {
    for (const listener of this.popupListeners) {
      try {
        listener(popup);
      } catch (err) {
        console.error('[HudPresenter] Popup listener error:', err);
      }
    }
  }
}
