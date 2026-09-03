import { GridPosition, WorldPosition, worldToGrid } from '../game/map/CoordinateUtils';

export interface ViewportConfig {
  virtualWidth: number;
  virtualHeight: number;
  canvas: HTMLCanvasElement;
}

export interface ScreenPosition {
  x: number;
  y: number;
}

export class Viewport {
  readonly virtualWidth: number;
  readonly virtualHeight: number;
  readonly canvas: HTMLCanvasElement;

  private _scale: number = 1;
  private _offsetX: number = 0;
  private _offsetY: number = 0;
  private _dpr: number = 1;

  constructor(config: ViewportConfig) {
    if (config.virtualWidth <= 0 || config.virtualHeight <= 0) {
      throw new Error('Virtual dimensions must be greater than 0');
    }
    this.virtualWidth = config.virtualWidth;
    this.virtualHeight = config.virtualHeight;
    this.canvas = config.canvas;

    this.update();
  }

  get scale(): number {
    return this._scale;
  }

  get offsetX(): number {
    return this._offsetX;
  }

  get offsetY(): number {
    return this._offsetY;
  }

  get dpr(): number {
    return this._dpr;
  }

  get aspectRatio(): number {
    return this.virtualWidth / this.virtualHeight;
  }

  /**
   * Recalculates scale and letterbox offsets based on container or canvas CSS dimensions.
   */
  update(containerWidth?: number, containerHeight?: number): void {
    const width = containerWidth ?? (this.canvas.clientWidth || this.canvas.width || this.virtualWidth);
    const height = containerHeight ?? (this.canvas.clientHeight || this.canvas.height || this.virtualHeight);

    if (width <= 0 || height <= 0) {
      return;
    }

    const scaleX = width / this.virtualWidth;
    const scaleY = height / this.virtualHeight;

    // Preserve aspect ratio (fit within available container space)
    this._scale = Math.min(scaleX, scaleY);

    const renderedWidth = this.virtualWidth * this._scale;
    const renderedHeight = this.virtualHeight * this._scale;

    this._offsetX = (width - renderedWidth) / 2;
    this._offsetY = (height - renderedHeight) / 2;
  }

  /**
   * Resizes internal canvas drawing buffer and updates letterboxing.
   */
  resizeCanvas(canvasWidth: number, canvasHeight: number, dpr: number = 1): void {
    this._dpr = dpr;
    this.canvas.width = Math.round(canvasWidth * dpr);
    this.canvas.height = Math.round(canvasHeight * dpr);
    this.update(canvasWidth, canvasHeight);
  }

  /**
   * Syncs the drawing buffer to the canvas's current CSS size and device pixel ratio.
   */
  syncToCanvasSize(dpr: number = 1): void {
    const width = this.canvas.clientWidth || this.canvas.width || this.virtualWidth;
    const height = this.canvas.clientHeight || this.canvas.height || this.virtualHeight;
    this.resizeCanvas(width, height, dpr);
  }

  /**
   * Clears the entire drawing buffer regardless of the current transform.
   */
  clear(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.restore();
  }

  /**
   * Converts client (pointer event) screen coordinates to virtual world coordinates.
   */
  screenToWorld(clientX: number, clientY: number): WorldPosition {
    const rect = this.canvas.getBoundingClientRect();
    const canvasX = clientX - rect.left;
    const canvasY = clientY - rect.top;

    const worldX = (canvasX - this._offsetX) / this._scale;
    const worldY = (canvasY - this._offsetY) / this._scale;

    return {
      x: worldX,
      y: worldY,
    };
  }

  /**
   * Converts canvas-local (unscaled CSS) coordinates to virtual world coordinates.
   */
  canvasToWorld(canvasX: number, canvasY: number): WorldPosition {
    return {
      x: (canvasX - this._offsetX) / this._scale,
      y: (canvasY - this._offsetY) / this._scale,
    };
  }

  /**
   * Converts virtual world coordinates to canvas-local coordinates.
   */
  worldToCanvas(worldX: number, worldY: number): ScreenPosition {
    return {
      x: worldX * this._scale + this._offsetX,
      y: worldY * this._scale + this._offsetY,
    };
  }

  /**
   * Converts client screen coordinates directly to grid coordinates given a tileSize.
   */
  screenToGrid(clientX: number, clientY: number, tileSize: number): GridPosition {
    const world = this.screenToWorld(clientX, clientY);
    return worldToGrid(world.x, world.y, tileSize);
  }

  /**
   * Applies the viewport transform (including device pixel ratio) to a Canvas 2D rendering context.
   */
  applyTransform(ctx: CanvasRenderingContext2D): void {
    const s = this._scale * this._dpr;
    ctx.setTransform(s, 0, 0, s, this._offsetX * this._dpr, this._offsetY * this._dpr);
  }

  /**
   * Resets the canvas transformation to identity.
   */
  resetTransform(ctx: CanvasRenderingContext2D): void {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
}
