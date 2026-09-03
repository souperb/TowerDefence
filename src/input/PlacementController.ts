import { TowerType } from '../game/towers/TowerComponents';
import { GridPosition } from '../game/map/CoordinateUtils';

export type TowerSelectedCallback = (towerType: TowerType | null) => void;
export type PlacementCancelledCallback = () => void;
export type PlaceRequestedCallback = (towerType: TowerType, gridPos: GridPosition) => void;

export interface PlacementControllerConfig {
  canvas?: HTMLCanvasElement;
  enableKeyboardShortcuts?: boolean;
}

export class PlacementController {
  private selectedTower: TowerType | null = null;
  private hoveredTile: GridPosition | null = null;

  private towerSelectedListeners: Set<TowerSelectedCallback> = new Set();
  private placementCancelledListeners: Set<PlacementCancelledCallback> = new Set();
  private placeRequestedListeners: Set<PlaceRequestedCallback> = new Set();

  private canvas?: HTMLCanvasElement;
  private enableKeyboardShortcuts: boolean;

  private boundOnKeyDown: (e: KeyboardEvent) => void;
  private boundOnContextMenu: (e: MouseEvent) => void;
  private isInitialized = false;

  constructor(config: PlacementControllerConfig = {}) {
    this.canvas = config.canvas;
    this.enableKeyboardShortcuts = config.enableKeyboardShortcuts ?? true;

    this.boundOnKeyDown = this.onKeyDown.bind(this);
    this.boundOnContextMenu = this.onContextMenu.bind(this);

    if (config.enableKeyboardShortcuts !== false) {
      this.init();
    }
  }

  /**
   * Initializes keyboard and mouse listeners.
   */
  public init(): void {
    if (this.isInitialized) return;

    if (typeof window !== 'undefined' && this.enableKeyboardShortcuts) {
      window.addEventListener('keydown', this.boundOnKeyDown);
    }

    if (this.canvas) {
      this.canvas.addEventListener('contextmenu', this.boundOnContextMenu);
    }

    this.isInitialized = true;
  }

  /**
   * Removes all event listeners and clears state.
   */
  public destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.boundOnKeyDown);
    }

    if (this.canvas) {
      this.canvas.removeEventListener('contextmenu', this.boundOnContextMenu);
    }

    this.towerSelectedListeners.clear();
    this.placementCancelledListeners.clear();
    this.placeRequestedListeners.clear();
    this.selectedTower = null;
    this.hoveredTile = null;
    this.isInitialized = false;
  }

  /**
   * Checks whether placement mode is currently active.
   */
  public isPlacing(): boolean {
    return this.selectedTower !== null;
  }

  /**
   * Gets the currently selected tower archetype or null.
   */
  public getSelectedTower(): TowerType | null {
    return this.selectedTower;
  }

  /**
   * Selects a tower for placement, entering placement mode.
   */
  public selectTower(towerType: TowerType | null): void {
    if (towerType === null) {
      this.cancelPlacement();
      return;
    }

    this.selectedTower = towerType;
    for (const listener of this.towerSelectedListeners) {
      listener(this.selectedTower);
    }
  }

  /**
   * Alias for selectTower.
   */
  public startPlacement(towerType: TowerType): void {
    this.selectTower(towerType);
  }

  /**
   * Cancels active placement mode and resets selection.
   */
  public cancelPlacement(): void {
    if (this.selectedTower === null) {
      return;
    }

    this.selectedTower = null;

    for (const listener of this.placementCancelledListeners) {
      listener();
    }

    for (const listener of this.towerSelectedListeners) {
      listener(null);
    }
  }

  /**
   * Updates current hovered grid coordinates.
   */
  public setHoveredTile(pos: GridPosition | null): void {
    this.hoveredTile = pos ? { ...pos } : null;
  }

  /**
   * Returns current hovered grid tile.
   */
  public getHoveredTile(): GridPosition | null {
    return this.hoveredTile ? { ...this.hoveredTile } : null;
  }

  /**
   * Requests building a tower at the given grid position (or current hovered tile).
   * Returns true if placement was requested, false if not in placement mode or no tile.
   */
  public requestPlacement(gridPos?: GridPosition): boolean {
    if (!this.selectedTower) {
      return false;
    }

    const targetPos = gridPos ?? this.hoveredTile;
    if (!targetPos) {
      return false;
    }

    const towerType = this.selectedTower;
    for (const listener of this.placeRequestedListeners) {
      listener(towerType, { ...targetPos });
    }

    return true;
  }

  /**
   * Subscribes to tower selection changes.
   */
  public onTowerSelected(callback: TowerSelectedCallback): () => void {
    this.towerSelectedListeners.add(callback);
    return () => this.towerSelectedListeners.delete(callback);
  }

  /**
   * Subscribes to placement cancellation events.
   */
  public onPlacementCancelled(callback: PlacementCancelledCallback): () => void {
    this.placementCancelledListeners.add(callback);
    return () => this.placementCancelledListeners.delete(callback);
  }

  /**
   * Subscribes to placement request events (e.g. click on tile while placing).
   */
  public onPlaceRequested(callback: PlaceRequestedCallback): () => void {
    this.placeRequestedListeners.add(callback);
    return () => this.placeRequestedListeners.delete(callback);
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      this.cancelPlacement();
    }
  }

  private onContextMenu(e: MouseEvent): void {
    if (this.isPlacing()) {
      e.preventDefault();
      this.cancelPlacement();
    }
  }
}
