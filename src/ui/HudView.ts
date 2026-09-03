import { HudPresenter, HudState } from './HudPresenter';
import { TimeControls, GameSpeed } from '../core/loop/TimeControls';
import { WaveManager } from '../game/state/WaveManager';
import { GameStateMachine, GameState } from '../game/state/GameStateMachine';
import { EventBus, engineEvents } from '../core/events/EngineEvents';

export interface HudViewConfig {
  container?: HTMLElement | string;
  presenter?: HudPresenter;
  timeControls?: TimeControls;
  waveManager?: WaveManager;
  stateMachine?: GameStateMachine;
  eventBus?: EventBus;
  onStartWave?: () => void;
  onTogglePause?: () => void;
  onCycleSpeed?: () => void;
  onSpeedChange?: (speed: GameSpeed) => void;
  onOpenLevels?: () => void;
  onAutoWaveToggle?: (enabled: boolean) => void;
  onToggleAudio?: () => void;
}

/**
 * Top HUD view component rendering real-time metrics:
 * Gold, Lives, Score, Wave indicator / Countdown, Speed toggles (1x/2x/4x), Pause/Resume, and Start Wave button.
 */
export class HudView {
  private element: HTMLElement;
  private isMounted = false;
  private presenter?: HudPresenter;
  private timeControls?: TimeControls;
  private waveManager?: WaveManager;
  private stateMachine?: GameStateMachine;
  private eventBus: EventBus;

  private unsubs: Array<() => void> = [];
  private startWaveCallbacks: Set<() => void> = new Set();
  private togglePauseCallbacks: Set<() => void> = new Set();
  private cycleSpeedCallbacks: Set<() => void> = new Set();
  private speedChangeCallbacks: Set<(speed: GameSpeed) => void> = new Set();
  private openLevelsCallbacks: Set<() => void> = new Set();
  private autoWaveToggleCallbacks: Set<(enabled: boolean) => void> = new Set();
  private toggleAudioCallbacks: Set<() => void> = new Set();

  constructor(config: HudViewConfig = {}) {
    this.presenter = config.presenter;
    this.timeControls = config.timeControls;
    this.waveManager = config.waveManager;
    this.stateMachine = config.stateMachine;
    this.eventBus = config.eventBus ?? engineEvents;

    if (config.onStartWave) this.startWaveCallbacks.add(config.onStartWave);
    if (config.onTogglePause) this.togglePauseCallbacks.add(config.onTogglePause);
    if (config.onCycleSpeed) this.cycleSpeedCallbacks.add(config.onCycleSpeed);
    if (config.onSpeedChange) this.speedChangeCallbacks.add(config.onSpeedChange);
    if (config.onOpenLevels) this.openLevelsCallbacks.add(config.onOpenLevels);
    if (config.onAutoWaveToggle) this.autoWaveToggleCallbacks.add(config.onAutoWaveToggle);
    if (config.onToggleAudio) this.toggleAudioCallbacks.add(config.onToggleAudio);

    this.element = this.createElement();
    this.mount(config.container);
    this.bindEvents();

    if (this.presenter) {
      this.updateFromState(this.presenter.getState());
    } else if (this.waveManager) {
      this.setAutoWave(this.waveManager.isAutoStartEnabled());
    }
  }

  private createElement(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'hud-view-container';
    el.innerHTML = `
      <header class="hud-bar" data-ref="hudBar">
        <div class="hud-metric hud-metric-level" data-ref="metricLevel" title="Current Level" style="display: none;">
          <span class="hud-icon">🏰</span>
          <span class="hud-label">Level:</span>
          <span class="hud-value" data-ref="valLevel">1</span>
        </div>
        <div class="hud-metric hud-metric-lives" data-ref="metricLives" title="Remaining Core Lives">
          <span class="hud-icon">❤️</span>
          <span class="hud-label">Lives:</span>
          <span class="hud-value" data-ref="valLives">20</span>
        </div>
        <div class="hud-metric hud-metric-gold" data-ref="metricGold" title="Current Gold Balance">
          <span class="hud-icon">🪙</span>
          <span class="hud-label">Gold:</span>
          <span class="hud-value" data-ref="valGold">300</span>
        </div>
        <div class="hud-metric hud-metric-wave" data-ref="metricWave" title="Current Wave Progression">
          <span class="hud-icon">🌊</span>
          <span class="hud-label">Wave:</span>
          <span class="hud-value" data-ref="valWave">1 / 10</span>
        </div>
        <div class="hud-metric hud-metric-score" data-ref="metricScore" title="Current Score">
          <span class="hud-icon">⭐</span>
          <span class="hud-label">Score:</span>
          <span class="hud-value" data-ref="valScore">0</span>
        </div>
      </header>

      <div class="hud-controls-group" data-ref="controlsGroup">
        <button type="button" class="btn btn-secondary btn-levels" data-ref="btnLevels" aria-label="Open Level Select Menu" title="Choose Mission / Adventure Mode">
          <span class="btn-icon">🗺️</span>
          <span class="btn-text">Levels</span>
        </button>
        <button type="button" class="btn btn-secondary btn-audio" data-ref="btnAudio" aria-label="Toggle Audio Sound and Music" title="Toggle Sound / Music (8-Bit Audio)">
          <span class="btn-icon" data-ref="icoAudio">🔊</span>
          <span class="audio-label" data-ref="lblAudio">Sound</span>
        </button>
        <button type="button" class="btn btn-secondary btn-auto-wave" data-ref="btnAutoWave" aria-label="Toggle Auto Wave" title="Automatically start waves when previous wave finishes">
          <span class="btn-icon">⚡</span>
          <span class="auto-wave-label" data-ref="lblAutoWave">Auto: OFF</span>
        </button>
        <button type="button" class="btn btn-primary btn-start-wave" data-ref="btnStartWave" aria-label="Start Wave" title="Start next wave immediately (Shortcut: Space / Enter)">
          <span class="btn-icon">▶</span>
          <span class="btn-text" data-ref="txtStartWave">Start Wave</span>
        </button>
        <button type="button" class="btn btn-secondary btn-speed" data-ref="btnSpeed" aria-label="Toggle Simulation Speed" title="Toggle Simulation Speed (1x, 2x, 4x)">
          <span class="speed-label" data-ref="lblSpeed">1x</span>
        </button>
        <button type="button" class="btn btn-secondary btn-pause" data-ref="btnPause" aria-label="Pause / Resume" title="Pause or Resume Game (Shortcut: Space)">
          <span class="pause-label" data-ref="lblPause">Pause</span>
        </button>
      </div>
    `;

    // Button click listeners
    const btnLevels = el.querySelector('[data-ref="btnLevels"]') as HTMLButtonElement | null;
    btnLevels?.addEventListener('click', () => this.handleOpenLevelsClick());

    const btnAudio = el.querySelector('[data-ref="btnAudio"]') as HTMLButtonElement | null;
    btnAudio?.addEventListener('click', () => this.handleToggleAudioClick());

    const btnAutoWave = el.querySelector('[data-ref="btnAutoWave"]') as HTMLButtonElement | null;
    btnAutoWave?.addEventListener('click', () => this.handleToggleAutoWaveClick());

    const btnStartWave = el.querySelector('[data-ref="btnStartWave"]') as HTMLButtonElement | null;
    btnStartWave?.addEventListener('click', () => this.handleStartWaveClick());

    const btnSpeed = el.querySelector('[data-ref="btnSpeed"]') as HTMLButtonElement | null;
    btnSpeed?.addEventListener('click', () => this.handleCycleSpeedClick());

    const btnPause = el.querySelector('[data-ref="btnPause"]') as HTMLButtonElement | null;
    btnPause?.addEventListener('click', () => this.handleTogglePauseClick());

    return el;
  }

  private mount(container?: HTMLElement | string): void {
    if (typeof document === 'undefined') return;

    let target: HTMLElement | null = null;
    if (typeof container === 'string') {
      target = document.getElementById(container) ?? document.querySelector(container);
    } else if (container instanceof HTMLElement) {
      target = container;
    }

    if (!target) {
      target =
        document.getElementById('ui-layer') ??
        document.getElementById('game-container') ??
        document.getElementById('app') ??
        document.body;
    }

    if (target && !this.isMounted) {
      target.appendChild(this.element);
      this.isMounted = true;
    }
  }

  private bindEvents(): void {
    if (this.presenter) {
      const unsubState = this.presenter.onStateChange((state) => {
        this.updateFromState(state);
      });
      this.unsubs.push(unsubState);
    }

    if (this.stateMachine) {
      const unsubState = this.stateMachine.onStateChange((current) => {
        this.handleGameStateChanged(current);
      });
      this.unsubs.push(unsubState);
    } else {
      // Fall back to the event bus only when no state machine was supplied
      const unsubEventState = this.eventBus.on('GAME_STATE_CHANGED', (data) => {
        this.handleGameStateChanged(data.currentState as GameState);
      });
      this.unsubs.push(unsubEventState);
    }

    // WaveManager publishes countdown ticks to the bus, so a single bus subscription covers both
    const unsubCountdownTick = this.eventBus.on('WAVE_COUNTDOWN_TICK', (data) => {
      this.setCountdown(data.remainingSeconds);
    });

    const unsubAutoWave = this.eventBus.on('AUTO_WAVE_CHANGED', (data: { enabled: boolean }) => {
      this.setAutoWave(data.enabled);
    });

    const unsubLevelReset = this.eventBus.on('LEVEL_RESET', (_data) => {
      this.handleGameStateChanged(GameState.PREPARATION);
      if (this.presenter) {
        this.updateFromState(this.presenter.getState());
      }
    });

    this.unsubs.push(unsubCountdownTick, unsubAutoWave, unsubLevelReset);
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  public setGold(gold: number): void {
    const el = this.element.querySelector('[data-ref="valGold"]');
    if (el) el.textContent = gold.toLocaleString();
  }

  public setLives(lives: number): void {
    const el = this.element.querySelector('[data-ref="valLives"]');
    if (el) el.textContent = String(lives);
  }

  public setScore(score: number): void {
    const el = this.element.querySelector('[data-ref="valScore"]');
    if (el) el.textContent = score.toLocaleString();
  }

  public setWave(wave: number, totalWaves?: number): void {
    const el = this.element.querySelector('[data-ref="valWave"]');
    if (el) {
      el.textContent = totalWaves !== undefined ? `${wave} / ${totalWaves}` : String(wave);
    }
  }

  public setCountdown(remainingSeconds: number): void {
    const btnText = this.element.querySelector('[data-ref="txtStartWave"]');
    const isPrep = !this.waveManager || this.waveManager.getStateMachine().getState() === GameState.PREPARATION;
    if (btnText && isPrep && remainingSeconds > 0) {
      const formatted = Math.ceil(remainingSeconds);
      btnText.textContent = `Start Wave (${formatted}s)`;
    } else if (btnText && isPrep) {
      btnText.textContent = 'Start Wave';
    }
  }

  public setSpeed(speed: GameSpeed): void {
    const el = this.element.querySelector('[data-ref="lblSpeed"]');
    if (el) el.textContent = `${speed}x`;
  }

  public setMuted(muted: boolean): void {
    const ico = this.element.querySelector('[data-ref="icoAudio"]');
    const lbl = this.element.querySelector('[data-ref="lblAudio"]');
    const btn = this.element.querySelector('[data-ref="btnAudio"]') as HTMLButtonElement | null;
    if (ico) ico.textContent = muted ? '🔇' : '🔊';
    if (lbl) lbl.textContent = muted ? 'Muted' : 'Sound';
    if (btn) {
      if (muted) {
        btn.classList.add('btn-active');
      } else {
        btn.classList.remove('btn-active');
      }
    }
  }

  public setPaused(isPaused: boolean): void {
    const el = this.element.querySelector('[data-ref="lblPause"]');
    if (el) el.textContent = isPaused ? 'Resume' : 'Pause';

    const btnPause = this.element.querySelector('[data-ref="btnPause"]') as HTMLButtonElement | null;
    if (btnPause) {
      if (isPaused) {
        btnPause.classList.add('btn-active');
      } else {
        btnPause.classList.remove('btn-active');
      }
    }
  }

  public setAutoWave(enabled: boolean): void {
    const el = this.element.querySelector('[data-ref="lblAutoWave"]');
    if (el) el.textContent = enabled ? 'Auto: ON' : 'Auto: OFF';

    const btn = this.element.querySelector('[data-ref="btnAutoWave"]') as HTMLButtonElement | null;
    if (btn) {
      if (enabled) {
        btn.classList.add('btn-active');
      } else {
        btn.classList.remove('btn-active');
      }
    }
  }

  public isAutoWaveEnabled(): boolean {
    return this.waveManager ? this.waveManager.isAutoStartEnabled() : false;
  }

  public setLevel(levelNumber?: number, levelName?: string, gameMode?: 'adventure' | 'custom'): void {
    const metricEl = this.element.querySelector('[data-ref="metricLevel"]') as HTMLElement | null;
    const valEl = this.element.querySelector('[data-ref="valLevel"]');
    if (levelNumber !== undefined && metricEl && valEl) {
      metricEl.style.display = 'flex';
      valEl.textContent = gameMode === 'adventure' ? `Adv ${levelNumber}` : `${levelNumber}`;
      if (levelName) {
        metricEl.title = `Level ${levelNumber}: ${levelName} (${gameMode === 'adventure' ? 'Adventure Mode' : 'Custom Mode'})`;
      }
    } else if (metricEl) {
      metricEl.style.display = 'none';
    }
  }

  public setStartWaveDisabled(disabled: boolean): void {
    const btn = this.element.querySelector('[data-ref="btnStartWave"]') as HTMLButtonElement | null;
    if (btn) btn.disabled = disabled;
  }

  public update(state: Partial<HudState>): void {
    if (state.gold !== undefined) this.setGold(state.gold);
    if (state.lives !== undefined) this.setLives(state.lives);
    if (state.score !== undefined) this.setScore(state.score);
    if (state.wave !== undefined) this.setWave(state.wave, state.totalWaves);
    if (state.levelNumber !== undefined) this.setLevel(state.levelNumber, state.levelName, state.gameMode);
  }

  private updateFromState(state: HudState): void {
    this.setGold(state.gold);
    this.setLives(state.lives);
    this.setScore(state.score);
    this.setWave(state.wave, state.totalWaves);
    this.setLevel(state.levelNumber, state.levelName, state.gameMode);
  }

  private handleGameStateChanged(current: GameState): void {
    const isPrep = current === GameState.PREPARATION;
    const isTerminal = current === GameState.GAME_OVER || current === GameState.VICTORY;
    const isPaused = current === GameState.PAUSED;

    this.setStartWaveDisabled(!isPrep || isTerminal);
    if (isPaused) {
      this.setPaused(true);
    } else {
      this.setPaused(false);
    }

    const btnText = this.element.querySelector('[data-ref="txtStartWave"]');
    if (btnText && !isPrep) {
      btnText.textContent = 'Wave in Progress';
    } else if (btnText && isPrep) {
      btnText.textContent = 'Start Wave';
    }
  }

  public handleOpenLevelsClick(): void {
    for (const cb of this.openLevelsCallbacks) {
      cb();
    }
  }

  public handleToggleAudioClick(): void {
    for (const cb of this.toggleAudioCallbacks) {
      cb();
    }
  }

  public handleToggleAutoWaveClick(): void {
    let nextState = false;
    if (this.waveManager) {
      nextState = this.waveManager.toggleAutoStart();
    } else {
      const isCurrentActive = this.element.querySelector('[data-ref="btnAutoWave"]')?.classList.contains('btn-active') ?? false;
      nextState = !isCurrentActive;
    }
    this.setAutoWave(nextState);
    if (this.presenter) {
      this.presenter.setAutoWave(nextState);
    }
    for (const cb of this.autoWaveToggleCallbacks) {
      cb(nextState);
    }
  }

  public handleStartWaveClick(): void {
    if (this.waveManager) {
      this.waveManager.startWaveNow();
    }
    for (const cb of this.startWaveCallbacks) {
      cb();
    }
  }

  public handleCycleSpeedClick(): void {
    if (this.timeControls) {
      const nextSpeed = this.timeControls.cycleSpeed();
      this.setSpeed(nextSpeed);
      for (const cb of this.speedChangeCallbacks) {
        cb(nextSpeed);
      }
    }
    for (const cb of this.cycleSpeedCallbacks) {
      cb();
    }
  }

  public handleTogglePauseClick(): void {
    if (this.stateMachine?.isTerminal()) {
      return;
    }
    if (this.timeControls) {
      const isPaused = this.timeControls.togglePause();
      this.setPaused(isPaused);
    }
    if (this.stateMachine) {
      if (this.stateMachine.isPaused()) {
        this.stateMachine.resume();
      } else if (!this.stateMachine.isTerminal()) {
        this.stateMachine.pause();
      }
    }
    for (const cb of this.togglePauseCallbacks) {
      cb();
    }
  }

  public onStartWave(callback: () => void): () => void {
    this.startWaveCallbacks.add(callback);
    return () => this.startWaveCallbacks.delete(callback);
  }

  public onToggleAudio(callback: () => void): () => void {
    this.toggleAudioCallbacks.add(callback);
    return () => this.toggleAudioCallbacks.delete(callback);
  }

  public onAutoWaveToggle(callback: (enabled: boolean) => void): () => void {
    this.autoWaveToggleCallbacks.add(callback);
    return () => this.autoWaveToggleCallbacks.delete(callback);
  }

  public onTogglePause(callback: () => void): () => void {
    this.togglePauseCallbacks.add(callback);
    return () => this.togglePauseCallbacks.delete(callback);
  }

  public onCycleSpeed(callback: () => void): () => void {
    this.cycleSpeedCallbacks.add(callback);
    return () => this.cycleSpeedCallbacks.delete(callback);
  }

  public onSpeedChange(callback: (speed: GameSpeed) => void): () => void {
    this.speedChangeCallbacks.add(callback);
    return () => this.speedChangeCallbacks.delete(callback);
  }

  public destroy(): void {
    for (const unsub of this.unsubs) {
      unsub();
    }
    this.unsubs = [];
    this.startWaveCallbacks.clear();
    this.togglePauseCallbacks.clear();
    this.cycleSpeedCallbacks.clear();
    this.speedChangeCallbacks.clear();
    this.toggleAudioCallbacks.clear();
    this.openLevelsCallbacks.clear();
    this.autoWaveToggleCallbacks.clear();

    if (this.isMounted && this.element.parentElement) {
      this.element.parentElement.removeChild(this.element);
      this.isMounted = false;
    }
  }
}
