import { EventBus, engineEvents } from '../../core/events/EngineEvents';

export enum GameState {
  PREPARATION = 'PREPARATION',
  SPAWNING = 'SPAWNING',
  IN_PROGRESS = 'IN_PROGRESS',
  WAVE_COMPLETED = 'WAVE_COMPLETED',
  VICTORY = 'VICTORY',
  GAME_OVER = 'GAME_OVER',
  PAUSED = 'PAUSED',
}

export type StateChangeCallback = (
  currentState: GameState,
  previousState: GameState,
  context?: Record<string, any>
) => void;

export interface GameStateMachineOptions {
  initialState?: GameState;
  eventBus?: EventBus;
}

/**
 * State machine managing game lifecycle states:
 * PREPARATION -> SPAWNING -> IN_PROGRESS -> WAVE_COMPLETED -> PREPARATION / VICTORY
 * Also handles PAUSED and GAME_OVER states.
 */
export class GameStateMachine {
  private currentState: GameState;
  private previousState: GameState | null = null;
  private prePauseState: GameState | null = null;
  private eventBus: EventBus;
  private listeners: Set<StateChangeCallback> = new Set();

  private static readonly VALID_TRANSITIONS: Record<GameState, readonly GameState[]> = {
    [GameState.PREPARATION]: [
      GameState.SPAWNING,
      GameState.PAUSED,
      GameState.GAME_OVER,
      GameState.PREPARATION,
    ],
    [GameState.SPAWNING]: [
      GameState.IN_PROGRESS,
      GameState.WAVE_COMPLETED,
      GameState.PAUSED,
      GameState.GAME_OVER,
      GameState.PREPARATION,
    ],
    [GameState.IN_PROGRESS]: [
      GameState.WAVE_COMPLETED,
      GameState.PAUSED,
      GameState.GAME_OVER,
      GameState.PREPARATION,
    ],
    [GameState.WAVE_COMPLETED]: [
      GameState.PREPARATION,
      GameState.VICTORY,
      GameState.PAUSED,
      GameState.GAME_OVER,
    ],
    [GameState.VICTORY]: [
      GameState.PREPARATION,
    ],
    [GameState.GAME_OVER]: [
      GameState.PREPARATION,
    ],
    [GameState.PAUSED]: [
      GameState.PREPARATION,
      GameState.SPAWNING,
      GameState.IN_PROGRESS,
      GameState.WAVE_COMPLETED,
      GameState.VICTORY,
      GameState.GAME_OVER,
    ],
  };

  constructor(options: GameStateMachineOptions = {}) {
    this.currentState = options.initialState ?? GameState.PREPARATION;
    this.eventBus = options.eventBus ?? engineEvents;
  }

  public setEventBus(bus: EventBus): void {
    this.eventBus = bus;
  }

  public getState(): GameState {
    return this.currentState;
  }

  public getPreviousState(): GameState | null {
    return this.previousState;
  }

  public getPrePauseState(): GameState | null {
    return this.prePauseState;
  }

  public isInState(state: GameState): boolean {
    return this.currentState === state;
  }

  public isPaused(): boolean {
    return this.currentState === GameState.PAUSED;
  }

  public isGameOver(): boolean {
    return this.currentState === GameState.GAME_OVER;
  }

  public isVictory(): boolean {
    return this.currentState === GameState.VICTORY;
  }

  public isTerminal(): boolean {
    return this.isGameOver() || this.isVictory();
  }

  public isWaveActive(): boolean {
    return this.currentState === GameState.SPAWNING || this.currentState === GameState.IN_PROGRESS;
  }

  public canTransitionTo(targetState: GameState): boolean {
    if (this.currentState === targetState) {
      return true;
    }
    const allowed = GameStateMachine.VALID_TRANSITIONS[this.currentState];
    return allowed ? allowed.includes(targetState) : false;
  }

  /**
   * Attempts to transition to the target state.
   * Returns true if transition was successful, false if invalid.
   */
  public transitionTo(targetState: GameState, context?: Record<string, any>): boolean {
    if (!this.canTransitionTo(targetState)) {
      return false;
    }

    if (this.currentState === GameState.PAUSED && targetState !== GameState.PAUSED) {
      this.prePauseState = null;
    } else if (targetState === GameState.PAUSED && this.currentState !== GameState.PAUSED) {
      this.prePauseState = this.currentState;
    }

    const oldState = this.currentState;
    this.previousState = oldState;
    this.currentState = targetState;

    this.notifyStateChanged(this.currentState, oldState, context);
    return true;
  }

  /**
   * Forces a state transition, bypassing validation checks.
   */
  public forceState(targetState: GameState, context?: Record<string, any>): void {
    if (this.currentState === GameState.PAUSED && targetState !== GameState.PAUSED) {
      this.prePauseState = null;
    } else if (targetState === GameState.PAUSED && this.currentState !== GameState.PAUSED) {
      this.prePauseState = this.currentState;
    }

    const oldState = this.currentState;
    this.previousState = oldState;
    this.currentState = targetState;

    this.notifyStateChanged(this.currentState, oldState, context);
  }

  /**
   * Pauses the game state machine, saving previous active state.
   */
  public pause(): boolean {
    if (this.isPaused() || this.isTerminal()) {
      return false;
    }
    return this.transitionTo(GameState.PAUSED);
  }

  /**
   * Resumes from pause back to the pre-pause state.
   */
  public resume(): boolean {
    if (!this.isPaused()) {
      return false;
    }
    const resumeTarget = this.prePauseState ?? GameState.PREPARATION;
    return this.transitionTo(resumeTarget);
  }

  /**
   * Resets the state machine back to an initial state (defaults to PREPARATION).
   */
  public reset(initialState: GameState = GameState.PREPARATION): void {
    const oldState = this.currentState;
    this.previousState = oldState;
    this.prePauseState = null;
    this.currentState = initialState;

    this.notifyStateChanged(this.currentState, oldState, { reason: 'reset' });
  }

  /**
   * Registers a callback for state change events.
   * @returns Unsubscribe function.
   */
  public onStateChange(callback: StateChangeCallback): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  public subscribe(callback: StateChangeCallback): () => void {
    return this.onStateChange(callback);
  }

  private notifyStateChanged(
    current: GameState,
    previous: GameState,
    context?: Record<string, any>
  ): void {
    for (const listener of this.listeners) {
      try {
        listener(current, previous, context);
      } catch (err) {
        console.error('[GameStateMachine] Error in state listener:', err);
      }
    }

    if (this.eventBus) {
      this.eventBus.emit('GAME_STATE_CHANGED', {
        previousState: previous,
        currentState: current,
        context,
      });
    }
  }
}
