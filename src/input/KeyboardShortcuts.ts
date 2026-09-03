import { PlacementController } from './PlacementController';
import { SelectionController } from './SelectionController';
import { TimeControls, GameSpeed } from '../core/loop/TimeControls';
import { WaveManager } from '../game/state/WaveManager';
import { GameStateMachine, GameState } from '../game/state/GameStateMachine';
import { TowerType } from '../game/towers/TowerComponents';

export type ShortcutHandler = (event: KeyboardEvent) => void;

export interface KeyboardShortcutsConfig {
  placementController?: PlacementController;
  selectionController?: SelectionController;
  timeControls?: TimeControls;
  waveManager?: WaveManager;
  stateMachine?: GameStateMachine;
  target?: Window | Document | HTMLElement;
  enabled?: boolean;
  onSpeedToggle?: (speed: GameSpeed) => void;
  onAutoWaveToggle?: (enabled: boolean) => void;
}

/**
 * Manages global keyboard shortcuts:
 * - Space: Pause / Resume simulation or Start Wave
 * - 1, 2, 3: Quick Tower selection (1=Archer, 2=Cannon, 3=Mage)
 * - Escape: Cancel tower placement / Deselect selected tower
 * - [, ]: Cycle or step simulation speed
 * - Enter / S: Start next wave immediately
 */
export class KeyboardShortcuts {
  private placementController?: PlacementController;
  private selectionController?: SelectionController;
  private timeControls?: TimeControls;
  private waveManager?: WaveManager;
  private stateMachine?: GameStateMachine;
  private target: Window | Document | HTMLElement;
  private isEnabled: boolean = true;

  private customBindings: Map<string, ShortcutHandler> = new Map();
  private boundOnKeyDown: (e: Event) => void;
  private isListening = false;

  private onSpeedToggle?: (speed: GameSpeed) => void;
  private onAutoWaveToggle?: (enabled: boolean) => void;

  constructor(config: KeyboardShortcutsConfig = {}) {
    this.placementController = config.placementController;
    this.selectionController = config.selectionController;
    this.timeControls = config.timeControls;
    this.waveManager = config.waveManager;
    this.stateMachine = config.stateMachine;
    this.target = config.target ?? (typeof window !== 'undefined' ? window : ({} as any));
    this.isEnabled = config.enabled ?? true;
    this.onSpeedToggle = config.onSpeedToggle;
    this.onAutoWaveToggle = config.onAutoWaveToggle;

    this.boundOnKeyDown = (e: Event) => this.handleKeyDown(e as KeyboardEvent);

    if (this.isEnabled) {
      this.enable();
    }
  }

  public enable(): void {
    if (this.isListening) return;
    this.isEnabled = true;
    if (this.target && typeof (this.target as any).addEventListener === 'function') {
      (this.target as any).addEventListener('keydown', this.boundOnKeyDown);
      this.isListening = true;
    }
  }

  public disable(): void {
    if (!this.isListening) return;
    this.isEnabled = false;
    if (this.target && typeof (this.target as any).removeEventListener === 'function') {
      (this.target as any).removeEventListener('keydown', this.boundOnKeyDown);
      this.isListening = false;
    }
  }

  public getIsEnabled(): boolean {
    return this.isEnabled;
  }

  public registerShortcut(key: string, handler: ShortcutHandler): () => void {
    const normalizedKey = key.toLowerCase();
    this.customBindings.set(normalizedKey, handler);
    return () => this.unregisterShortcut(normalizedKey);
  }

  public unregisterShortcut(key: string): void {
    this.customBindings.delete(key.toLowerCase());
  }

  public handleKeyDown(e: KeyboardEvent): void {
    if (!this.isEnabled) return;

    // Ignore keypresses if typing inside an input or textarea
    const activeEl = typeof document !== 'undefined' ? document.activeElement : null;
    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || (activeEl as HTMLElement).isContentEditable)) {
      return;
    }

    const key = e.key;
    const keyLower = key.toLowerCase();

    // Check custom bindings first
    if (this.customBindings.has(keyLower)) {
      const handler = this.customBindings.get(keyLower)!;
      handler(e);
      return;
    }

    // Default hotkeys
    switch (key) {
      case ' ': // Space: Pause / Resume or Start Wave
        e.preventDefault();
        this.handleSpaceKey();
        break;

      case 'Enter':
      case 's':
      case 'S':
        this.handleStartWaveKey();
        break;

      case '1':
        this.handleTowerSelect('archer');
        break;

      case '2':
        this.handleTowerSelect('cannon');
        break;

      case '3':
        this.handleTowerSelect('mage');
        break;

      case 'Escape':
        this.handleEscapeKey();
        break;

      case 'u':
      case 'U':
        this.handleAutoWaveToggle();
        break;

      case '[':
      case ']':
      case 'Tab':
        e.preventDefault();
        this.handleSpeedToggle();
        break;

      default:
        break;
    }
  }

  private handleSpaceKey(): void {
    // If wave is in prep and player hits space, start wave; otherwise toggle pause
    if (this.waveManager && this.waveManager.getStateMachine().getState() === GameState.PREPARATION) {
      const started = this.waveManager.startWaveNow();
      if (started) return;
    }

    if (this.stateMachine?.isTerminal()) {
      return;
    }
    if (this.timeControls) {
      this.timeControls.togglePause();
    }
    if (this.stateMachine) {
      if (this.stateMachine.isPaused()) {
        this.stateMachine.resume();
      } else {
        this.stateMachine.pause();
      }
    }
  }

  private handleStartWaveKey(): void {
    if (this.waveManager) {
      this.waveManager.startWaveNow();
    }
  }

  private handleAutoWaveToggle(): void {
    if (this.waveManager) {
      const next = this.waveManager.toggleAutoStart();
      this.onAutoWaveToggle?.(next);
    }
  }

  private handleTowerSelect(towerType: TowerType): void {
    if (this.placementController) {
      if (this.selectionController) {
        this.selectionController.deselect();
      }
      if (this.placementController.getSelectedTower() === towerType) {
        this.placementController.cancelPlacement();
      } else {
        this.placementController.selectTower(towerType);
      }
    }
  }

  private handleEscapeKey(): void {
    if (this.placementController && this.placementController.isPlacing()) {
      this.placementController.cancelPlacement();
      return;
    }
    if (this.selectionController && this.selectionController.hasSelection()) {
      this.selectionController.deselect();
    }
  }

  private handleSpeedToggle(): void {
    if (this.timeControls) {
      const newSpeed = this.timeControls.cycleSpeed();
      if (this.onSpeedToggle) {
        this.onSpeedToggle(newSpeed);
      }
    }
  }

  public destroy(): void {
    this.disable();
    this.customBindings.clear();
  }
}
