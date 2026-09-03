import { Entity } from '../ecs/Component';
import { IVector2 } from '../math/Vector2';

export interface BaseBreachEvent {
  entity: Entity;
  creepType: string;
  damageToBase: number;
  remainingHp: number;
}

export interface CreepSpawnedEvent {
  entity: Entity;
  creepType: string;
  waveIndex: number;
  spawnGroupIndex?: number;
  position: IVector2;
}

export interface WaveStartedEvent {
  waveIndex: number;
  /** 1-based wave number for display. */
  waveNumber?: number;
  totalWaves?: number;
  totalCreeps?: number;
}

/** Emitted when all creeps of a wave have been spawned (creeps may still be alive). */
export interface WaveSpawningCompletedEvent {
  waveIndex: number;
}

/** Emitted when all creeps of a wave have been defeated or breached. */
export interface WaveCompletedEvent {
  waveIndex: number;
  waveNumber?: number;
}

export interface CreepDeathEvent {
  entity: Entity;
  creepType: string;
  bountyGold: number;
  scoreValue: number;
  position: IVector2;
}

export interface CreepKilledEvent {
  entity: Entity;
  creepType: string;
  bountyGold: number;
  scoreValue: number;
  position: IVector2;
  totalScoreAwarded?: number;
}

export interface CreepDamagedEvent {
  entity: Entity;
  damage: number;
  remainingHp: number;
  maxHp: number;
}

export interface GoldChangedEvent {
  currentGold: number;
  delta: number;
  source?: string;
}

export interface ScoreChangedEvent {
  currentScore: number;
  delta: number;
  source?: string;
}

export interface GameStateChangedEvent {
  previousState: string;
  currentState: string;
  context?: any;
}

export interface WaveCountdownTickEvent {
  remainingSeconds: number;
  totalDuration: number;
  waveIndex: number;
}

export interface AutoWaveChangedEvent {
  enabled: boolean;
}

export interface GameOverEvent {
  finalScore: number;
  waveReached: number;
  totalWaves: number;
  kills?: number;
}

export interface VictoryEvent {
  finalScore: number;
  livesRemaining: number;
  totalWaves: number;
  stars: number;
}

export interface LevelResetEvent {
  initialLives?: number;
  initialGold?: number;
}

export interface TowerUpgradedEvent {
  entity: Entity;
  towerType: string;
  newTier: number;
  previousTier: number;
  upgradeCost: number;
  totalInvestedCost: number;
  damage: number;
  range: number;
  fireRate: number;
  splashRadius: number;
  gridX: number;
  gridY: number;
}

export interface TowerSoldEvent {
  entity: Entity;
  towerType: string;
  tier: number;
  refundGold: number;
  totalInvestedCost: number;
  gridX: number;
  gridY: number;
}

export type EventMap = {
  'BASE_BREACH': BaseBreachEvent;
  'CREEP_SPAWNED': CreepSpawnedEvent;
  'WAVE_STARTED': WaveStartedEvent;
  'WAVE_SPAWNING_COMPLETED': WaveSpawningCompletedEvent;
  'WAVE_COMPLETED': WaveCompletedEvent;
  'CREEP_DEATH': CreepDeathEvent;
  'CREEP_KILLED': CreepKilledEvent;
  'CREEP_DAMAGED': CreepDamagedEvent;
  'GOLD_CHANGED': GoldChangedEvent;
  'SCORE_CHANGED': ScoreChangedEvent;
  'GAME_STATE_CHANGED': GameStateChangedEvent;
  'WAVE_COUNTDOWN_TICK': WaveCountdownTickEvent;
  'AUTO_WAVE_CHANGED': AutoWaveChangedEvent;
  'GAME_OVER': GameOverEvent;
  'VICTORY': VictoryEvent;
  'LEVEL_RESET': LevelResetEvent;
  'TOWER_UPGRADED': TowerUpgradedEvent;
  'TOWER_SOLD': TowerSoldEvent;
  [key: string]: any;
};

export type EventHandler<T = any> = (data: T) => void;

/**
 * Type-safe and general-purpose synchronous Event Bus for game engine systems.
 */
export class EventBus {
  private listeners: Map<string, Set<EventHandler>> = new Map();

  /**
   * Subscribes a listener to a specific event topic.
   * Returns an unsubscribe callback.
   */
  public on<K extends keyof EventMap>(event: K, handler: EventHandler<EventMap[K]>): () => void;
  public on<T = any>(event: string, handler: EventHandler<T>): () => void;
  public on(event: string, handler: EventHandler): () => void {
    let handlers = this.listeners.get(event);
    if (!handlers) {
      handlers = new Set();
      this.listeners.set(event, handlers);
    }
    handlers.add(handler);

    return () => this.off(event, handler);
  }

  /**
   * Subscribes a one-time listener.
   */
  public once<K extends keyof EventMap>(event: K, handler: EventHandler<EventMap[K]>): () => void;
  public once<T = any>(event: string, handler: EventHandler<T>): () => void;
  public once(event: string, handler: EventHandler): () => void {
    const wrapper: EventHandler = (data: any) => {
      this.off(event, wrapper);
      handler(data);
    };
    return this.on(event, wrapper);
  }

  /**
   * Unsubscribes a listener from an event.
   */
  public off<K extends keyof EventMap>(event: K, handler: EventHandler<EventMap[K]>): void;
  public off<T = any>(event: string, handler: EventHandler<T>): void;
  public off(event: string, handler: EventHandler): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * Emits an event with the associated payload to all registered listeners.
   */
  public emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void;
  public emit<T = any>(event: string, data: T): void;
  public emit(event: string, data: any): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      // Iterate over a copy so handlers can safely unregister during iteration
      const copy = Array.from(handlers);
      for (const handler of copy) {
        handler(data);
      }
    }
  }

  /**
   * Returns the count of listeners registered for an event.
   */
  public listenerCount(event: string): number {
    return this.listeners.get(event)?.size ?? 0;
  }

  /**
   * Clears all listeners.
   */
  public clear(): void {
    this.listeners.clear();
  }
}

/**
 * Global shared engine event bus instance.
 */
export const engineEvents = new EventBus();
