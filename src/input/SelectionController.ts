import { Entity, World } from '../core/ecs';
import { GridPosition } from '../game/map/CoordinateUtils';
import { TileGrid } from '../game/map/TileGrid';
import { TOWER_COMPONENT, TowerComponent } from '../game/towers/TowerComponents';

export type SelectionChangedCallback = (
  entity: Entity | null,
  gridPos: GridPosition | null
) => void;
export type EntitySelectedCallback = (
  entity: Entity,
  gridPos: GridPosition
) => void;
export type DeselectedCallback = () => void;

export interface SelectionControllerConfig {
  world?: World;
  grid?: TileGrid;
  canvas?: HTMLCanvasElement;
  enableKeyboardShortcuts?: boolean;
}

/**
 * Controller managing user selection of placed towers in the game world.
 * Tracks selected tower entity and tile coordinates, handles click selection,
 * outside click / empty tile deselection, and Escape hotkey dismissal.
 */
export class SelectionController {
  private selectedEntity: Entity | null = null;
  private selectedTile: GridPosition | null = null;

  private world?: World;
  private grid?: TileGrid;
  private canvas?: HTMLCanvasElement;
  private enableKeyboardShortcuts: boolean;

  private selectionChangedListeners: Set<SelectionChangedCallback> = new Set();
  private entitySelectedListeners: Set<EntitySelectedCallback> = new Set();
  private deselectedListeners: Set<DeselectedCallback> = new Set();

  private boundOnKeyDown: (e: KeyboardEvent) => void;
  private isInitialized = false;

  constructor(config: SelectionControllerConfig = {}) {
    this.world = config.world;
    this.grid = config.grid;
    this.canvas = config.canvas;
    this.enableKeyboardShortcuts = config.enableKeyboardShortcuts ?? true;

    this.boundOnKeyDown = this.onKeyDown.bind(this);

    if (this.enableKeyboardShortcuts) {
      this.init();
    }
  }

  /**
   * Initializes event listeners (e.g. keyboard shortcuts).
   */
  public init(): void {
    if (this.isInitialized) return;

    if (typeof window !== 'undefined' && this.enableKeyboardShortcuts) {
      window.addEventListener('keydown', this.boundOnKeyDown);
    }

    this.isInitialized = true;
  }

  /**
   * Cleans up all listeners and resets selection state.
   */
  public destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.boundOnKeyDown);
    }

    this.selectionChangedListeners.clear();
    this.entitySelectedListeners.clear();
    this.deselectedListeners.clear();
    this.selectedEntity = null;
    this.selectedTile = null;
    this.isInitialized = false;
  }

  public getGrid(): TileGrid | undefined {
    return this.grid;
  }

  public getCanvas(): HTMLCanvasElement | undefined {
    return this.canvas;
  }

  /**
   * Sets the active ECS world instance.
   */
  public setWorld(world: World | undefined): void {
    this.world = world;
  }

  /**
   * Sets the active TileGrid instance.
   */
  public setGrid(grid: TileGrid | undefined): void {
    this.grid = grid;
  }

  /**
   * Checks whether a tower entity is currently selected.
   */
  public hasSelection(): boolean {
    return this.selectedEntity !== null;
  }

  /**
   * Returns the currently selected tower Entity ID, or null.
   */
  public getSelectedEntity(): Entity | null {
    return this.selectedEntity;
  }

  /**
   * Returns the grid position of the selected tower, or null.
   */
  public getSelectedTile(): GridPosition | null {
    return this.selectedTile ? { ...this.selectedTile } : null;
  }

  /**
   * Directly sets the selected entity and grid position.
   */
  public selectEntity(entity: Entity | null, gridPos?: GridPosition | null): void {
    if (entity === null) {
      this.deselect();
      return;
    }

    const previousEntity = this.selectedEntity;
    this.selectedEntity = entity;
    this.selectedTile = gridPos ? { ...gridPos } : null;

    if (this.selectedTile && this.entitySelectedListeners.size > 0) {
      for (const listener of this.entitySelectedListeners) {
        listener(entity, { ...this.selectedTile });
      }
    }

    if (previousEntity !== entity) {
      this.notifySelectionChanged();
    }
  }

  /**
   * Clears active selection and notifies subscribers.
   */
  public deselect(): void {
    if (this.selectedEntity === null && this.selectedTile === null) {
      return;
    }

    this.selectedEntity = null;
    this.selectedTile = null;

    for (const listener of this.deselectedListeners) {
      listener();
    }

    this.notifySelectionChanged();
  }

  /**
   * Alias for deselect().
   */
  public clearSelection(): void {
    this.deselect();
  }

  /**
   * Selects a tower at the given grid coordinates if one exists in the world.
   * If no tower exists at the coordinates, clears the selection.
   *
   * @param gridPos Target grid position.
   * @param world Optional world override (uses configured world if not passed).
   * @returns The selected tower Entity, or null if no tower was present.
   */
  public selectAt(gridPos: GridPosition, world?: World): Entity | null {
    const targetWorld = world ?? this.world;
    if (!targetWorld) {
      this.deselect();
      return null;
    }

    const towerEntity = this.findTowerAt(targetWorld, gridPos.x, gridPos.y);
    if (towerEntity !== null) {
      this.selectEntity(towerEntity, gridPos);
      return towerEntity;
    }

    this.deselect();
    return null;
  }

  /**
   * Handles a tile click event. If a tower is located at the coordinates, it is selected;
   * otherwise, any active selection is dismissed.
   */
  public handleTileClick(gridPos: GridPosition, world?: World): Entity | null {
    return this.selectAt(gridPos, world);
  }

  /**
   * Finds the tower entity occupying the specified tile coordinates.
   */
  public findTowerAt(world: World, gridX: number, gridY: number): Entity | null {
    const towerEntities = world.query([TOWER_COMPONENT]);
    for (const entity of towerEntities) {
      if (!world.isAlive(entity)) continue;
      const tower = world.getComponent<TowerComponent>(entity, TOWER_COMPONENT);
      if (tower && tower.gridX === gridX && tower.gridY === gridY) {
        return entity;
      }
    }
    return null;
  }

  /**
   * Subscribes to selection change events (entity selected or deselected).
   */
  public onSelectionChanged(callback: SelectionChangedCallback): () => void {
    this.selectionChangedListeners.add(callback);
    return () => this.selectionChangedListeners.delete(callback);
  }

  /**
   * Subscribes to tower selection events.
   */
  public onEntitySelected(callback: EntitySelectedCallback): () => void {
    this.entitySelectedListeners.add(callback);
    return () => this.entitySelectedListeners.delete(callback);
  }

  /**
   * Subscribes to deselection events.
   */
  public onDeselected(callback: DeselectedCallback): () => void {
    this.deselectedListeners.add(callback);
    return () => this.deselectedListeners.delete(callback);
  }

  private notifySelectionChanged(): void {
    const entity = this.selectedEntity;
    const tile = this.selectedTile ? { ...this.selectedTile } : null;
    for (const listener of this.selectionChangedListeners) {
      try {
        listener(entity, tile);
      } catch (err) {
        console.error('[SelectionController] Selection changed listener error:', err);
      }
    }
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      this.deselect();
    }
  }
}
