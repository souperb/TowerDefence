import { Viewport } from '../rendering/Viewport';
import { GridPosition, WorldPosition } from '../game/map/CoordinateUtils';

export type HoverCallback = (gridPos: GridPosition | null, worldPos: WorldPosition | null) => void;
export type ClickCallback = (gridPos: GridPosition, worldPos: WorldPosition) => void;

export interface InputManagerConfig {
  canvas: HTMLCanvasElement;
  viewport: Viewport;
  tileSize: number;
}

export class InputManager {
  private canvas: HTMLCanvasElement;
  private viewport: Viewport;
  private tileSize: number;

  private currentWorldPos: WorldPosition | null = null;
  private currentGridPos: GridPosition | null = null;
  private isPointerInside: boolean = false;

  private hoverListeners: Set<HoverCallback> = new Set();
  private clickListeners: Set<ClickCallback> = new Set();

  private boundOnPointerMove: (e: PointerEvent) => void;
  private boundOnPointerLeave: (e: PointerEvent) => void;
  private boundOnPointerEnter: (e: PointerEvent) => void;
  private boundOnPointerDown: (e: PointerEvent) => void;

  constructor(config: InputManagerConfig) {
    this.canvas = config.canvas;
    this.viewport = config.viewport;
    this.tileSize = config.tileSize;

    this.boundOnPointerMove = this.onPointerMove.bind(this);
    this.boundOnPointerLeave = this.onPointerLeave.bind(this);
    this.boundOnPointerEnter = this.onPointerEnter.bind(this);
    this.boundOnPointerDown = this.onPointerDown.bind(this);

    this.init();
  }

  setViewport(viewport: Viewport): void {
    this.viewport = viewport;
  }

  setTileSize(tileSize: number): void {
    this.tileSize = tileSize;
  }

  init(): void {
    this.canvas.addEventListener('pointermove', this.boundOnPointerMove);
    this.canvas.addEventListener('pointerleave', this.boundOnPointerLeave);
    this.canvas.addEventListener('pointerenter', this.boundOnPointerEnter);
    this.canvas.addEventListener('pointerdown', this.boundOnPointerDown);
  }

  destroy(): void {
    this.canvas.removeEventListener('pointermove', this.boundOnPointerMove);
    this.canvas.removeEventListener('pointerleave', this.boundOnPointerLeave);
    this.canvas.removeEventListener('pointerenter', this.boundOnPointerEnter);
    this.canvas.removeEventListener('pointerdown', this.boundOnPointerDown);

    this.hoverListeners.clear();
    this.clickListeners.clear();
  }

  onHover(callback: HoverCallback): () => void {
    this.hoverListeners.add(callback);
    return () => this.hoverListeners.delete(callback);
  }

  onClick(callback: ClickCallback): () => void {
    this.clickListeners.add(callback);
    return () => this.clickListeners.delete(callback);
  }

  getPointerWorldPosition(): WorldPosition | null {
    return this.currentWorldPos ? { ...this.currentWorldPos } : null;
  }

  getPointerGridPosition(): GridPosition | null {
    return this.currentGridPos ? { ...this.currentGridPos } : null;
  }

  isPointerOverCanvas(): boolean {
    return this.isPointerInside;
  }

  private handlePointerPosition(clientX: number, clientY: number): void {
    const worldPos = this.viewport.screenToWorld(clientX, clientY);
    const gridPos = this.viewport.screenToGrid(clientX, clientY, this.tileSize);

    this.currentWorldPos = worldPos;
    this.currentGridPos = gridPos;
    this.isPointerInside = true;

    for (const listener of this.hoverListeners) {
      listener(gridPos, worldPos);
    }
  }

  private onPointerMove(e: PointerEvent): void {
    this.handlePointerPosition(e.clientX, e.clientY);
  }

  private onPointerEnter(e: PointerEvent): void {
    this.handlePointerPosition(e.clientX, e.clientY);
  }

  private onPointerLeave(_e: PointerEvent): void {
    this.currentWorldPos = null;
    this.currentGridPos = null;
    this.isPointerInside = false;

    for (const listener of this.hoverListeners) {
      listener(null, null);
    }
  }

  private onPointerDown(e: PointerEvent): void {
    if (e.button !== 0) return; // Only primary mouse button
    // Touch taps are handled by TouchManager (tap = press + release without drag)
    if (e.pointerType === 'touch') return;

    const worldPos = this.viewport.screenToWorld(e.clientX, e.clientY);
    const gridPos = this.viewport.screenToGrid(e.clientX, e.clientY, this.tileSize);

    for (const listener of this.clickListeners) {
      listener(gridPos, worldPos);
    }
  }
}
