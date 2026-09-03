import { Viewport } from '../rendering/Viewport';
import { GridPosition, WorldPosition } from '../game/map/CoordinateUtils';
import { PlacementController } from './PlacementController';
import { SelectionController } from './SelectionController';

export type TouchTapCallback = (gridPos: GridPosition, worldPos: WorldPosition) => void;

export interface TouchManagerConfig {
  canvas: HTMLCanvasElement;
  viewport: Viewport;
  tileSize?: number;
  placementController?: PlacementController;
  selectionController?: SelectionController;
  preventGestureDefaults?: boolean;
}

/**
 * Manages mobile and touch screen gesture inputs, touch-to-grid mapping,
 * and suppresses browser gesture conflicts (e.g. accidental pinch/double-tap zoom).
 */
export class TouchManager {
  private canvas: HTMLCanvasElement;
  private viewport: Viewport;
  private tileSize: number;
  private placementController?: PlacementController;
  private selectionController?: SelectionController;
  private preventGestureDefaults: boolean;

  private tapCallbacks: Set<TouchTapCallback> = new Set();
  private touchStartPos: { x: number; y: number; time: number } | null = null;
  private isTouching: boolean = false;

  private boundOnTouchStart: (e: TouchEvent) => void;
  private boundOnTouchMove: (e: TouchEvent) => void;
  private boundOnTouchEnd: (e: TouchEvent) => void;
  private boundOnTouchCancel: (e: TouchEvent) => void;

  constructor(config: TouchManagerConfig) {
    this.canvas = config.canvas;
    this.viewport = config.viewport;
    this.tileSize = config.tileSize ?? 32;
    this.placementController = config.placementController;
    this.selectionController = config.selectionController;
    this.preventGestureDefaults = config.preventGestureDefaults ?? true;

    this.boundOnTouchStart = this.onTouchStart.bind(this);
    this.boundOnTouchMove = this.onTouchMove.bind(this);
    this.boundOnTouchEnd = this.onTouchEnd.bind(this);
    this.boundOnTouchCancel = this.onTouchCancel.bind(this);

    this.init();
  }

  public init(): void {
    if (!this.canvas) return;

    this.canvas.addEventListener('touchstart', this.boundOnTouchStart, { passive: false });
    this.canvas.addEventListener('touchmove', this.boundOnTouchMove, { passive: false });
    this.canvas.addEventListener('touchend', this.boundOnTouchEnd, { passive: false });
    this.canvas.addEventListener('touchcancel', this.boundOnTouchCancel, { passive: false });
  }

  public setViewport(viewport: Viewport): void {
    this.viewport = viewport;
  }

  public setTileSize(tileSize: number): void {
    this.tileSize = tileSize;
  }

  public onTap(callback: TouchTapCallback): () => void {
    this.tapCallbacks.add(callback);
    return () => this.tapCallbacks.delete(callback);
  }

  public getIsTouching(): boolean {
    return this.isTouching;
  }

  private onTouchStart(e: TouchEvent): void {
    if (this.preventGestureDefaults) {
      if (e.touches.length > 1) {
        // Multi-touch gestures (pinch zoom) prevented on canvas
        e.preventDefault();
      }
    }

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      this.isTouching = true;
      this.touchStartPos = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };

      // Update hovered grid coordinates for placement preview
      const gridPos = this.viewport.screenToGrid(touch.clientX, touch.clientY, this.tileSize);
      if (this.placementController) {
        this.placementController.setHoveredTile(gridPos);
      }
    }
  }

  private onTouchMove(e: TouchEvent): void {
    if (this.preventGestureDefaults) {
      e.preventDefault(); // Prevent scrolling while dragging on game canvas
    }

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const gridPos = this.viewport.screenToGrid(touch.clientX, touch.clientY, this.tileSize);
      if (this.placementController) {
        this.placementController.setHoveredTile(gridPos);
      }
    }
  }

  private onTouchEnd(e: TouchEvent): void {
    if (this.preventGestureDefaults) {
      e.preventDefault();
    }

    if (this.touchStartPos) {
      const touch = e.changedTouches[0];
      if (touch) {
        const dx = touch.clientX - this.touchStartPos.x;
        const dy = touch.clientY - this.touchStartPos.y;
        const distSq = dx * dx + dy * dy;
        const elapsed = Date.now() - this.touchStartPos.time;

        // If touch moved < 15px and lasted < 500ms, register as a clean tap
        if (distSq < 225 && elapsed < 500) {
          const worldPos = this.viewport.screenToWorld(touch.clientX, touch.clientY);
          const gridPos = this.viewport.screenToGrid(touch.clientX, touch.clientY, this.tileSize);

          for (const cb of this.tapCallbacks) {
            cb(gridPos, worldPos);
          }

          if (this.placementController && this.placementController.isPlacing()) {
            this.placementController.requestPlacement(gridPos);
          } else if (this.selectionController) {
            this.selectionController.handleTileClick(gridPos);
          }
        }
      }
    }

    this.touchStartPos = null;
    this.isTouching = false;
  }

  private onTouchCancel(_e: TouchEvent): void {
    this.touchStartPos = null;
    this.isTouching = false;
  }

  public destroy(): void {
    if (this.canvas) {
      this.canvas.removeEventListener('touchstart', this.boundOnTouchStart);
      this.canvas.removeEventListener('touchmove', this.boundOnTouchMove);
      this.canvas.removeEventListener('touchend', this.boundOnTouchEnd);
      this.canvas.removeEventListener('touchcancel', this.boundOnTouchCancel);
    }
    this.tapCallbacks.clear();
    this.touchStartPos = null;
    this.isTouching = false;
  }
}
