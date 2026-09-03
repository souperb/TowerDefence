import { TileGrid } from '../game/map/TileGrid';
import { GridPosition } from '../game/map/CoordinateUtils';

export interface GridCursorTheme {
  validFill: string;
  validStroke: string;
  invalidFill: string;
  invalidStroke: string;
  lineWidth: number;
}

export const DEFAULT_CURSOR_THEME: GridCursorTheme = {
  validFill: 'rgba(6, 182, 212, 0.22)',      // relic cyan holographic reticle
  validStroke: 'rgba(56, 189, 248, 0.9)',
  invalidFill: 'rgba(239, 68, 68, 0.25)',   // warning crimson
  invalidStroke: 'rgba(244, 63, 94, 0.9)',
  lineWidth: 2,
};

export class GridCursorRenderer {
  private grid: TileGrid;
  private theme: GridCursorTheme;
  private hoveredTile: GridPosition | null = null;
  private visible: boolean = true;
  private customValidCheck?: (gridX: number, gridY: number) => boolean;

  constructor(
    grid: TileGrid,
    theme: Partial<GridCursorTheme> = {}
  ) {
    this.grid = grid;
    this.theme = { ...DEFAULT_CURSOR_THEME, ...theme };
  }

  setGrid(grid: TileGrid): void {
    this.grid = grid;
  }

  setTheme(theme: Partial<GridCursorTheme>): void {
    this.theme = { ...this.theme, ...theme };
  }

  setHoveredTile(tile: GridPosition | null): void {
    if (tile && this.grid.isWithinBounds(tile.x, tile.y)) {
      this.hoveredTile = { x: tile.x, y: tile.y };
    } else {
      this.hoveredTile = null;
    }
  }

  getHoveredTile(): GridPosition | null {
    return this.hoveredTile ? { ...this.hoveredTile } : null;
  }

  setVisible(visible: boolean): void {
    this.visible = visible;
  }

  isVisible(): boolean {
    return this.visible;
  }

  setCustomValidCheck(fn?: (gridX: number, gridY: number) => boolean): void {
    this.customValidCheck = fn;
  }

  /**
   * Evaluates whether the currently hovered tile is valid for building.
   */
  isValidPlacement(gridX: number, gridY: number): boolean {
    if (this.customValidCheck) {
      return this.customValidCheck(gridX, gridY);
    }
    return this.grid.isBuildable(gridX, gridY);
  }

  /**
   * Renders the highlight box at the hovered grid position.
   */
  render(ctx: CanvasRenderingContext2D): void {
    if (!this.visible || !this.hoveredTile) {
      return;
    }

    const { x, y } = this.hoveredTile;
    if (!this.grid.isWithinBounds(x, y)) {
      return;
    }

    const isValid = this.isValidPlacement(x, y);
    const tileSize = this.grid.tileSize;
    const px = x * tileSize;
    const py = y * tileSize;

    const fillStyle = isValid ? this.theme.validFill : this.theme.invalidFill;
    const strokeStyle = isValid ? this.theme.validStroke : this.theme.invalidStroke;

    ctx.save();
    ctx.fillStyle = fillStyle;
    ctx.fillRect(px, py, tileSize, tileSize);

    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = this.theme.lineWidth;
    ctx.strokeRect(
      px + this.theme.lineWidth / 2,
      py + this.theme.lineWidth / 2,
      tileSize - this.theme.lineWidth,
      tileSize - this.theme.lineWidth
    );

    // Techno-arcane targeting reticle corner brackets
    const bracketLen = 6;
    ctx.strokeStyle = isValid ? '#ffffff' : '#fecdd3';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    // Top-left
    ctx.moveTo(px, py + bracketLen);
    ctx.lineTo(px, py);
    ctx.lineTo(px + bracketLen, py);
    // Top-right
    ctx.moveTo(px + tileSize - bracketLen, py);
    ctx.lineTo(px + tileSize, py);
    ctx.lineTo(px + tileSize, py + bracketLen);
    // Bottom-left
    ctx.moveTo(px, py + tileSize - bracketLen);
    ctx.lineTo(px, py + tileSize);
    ctx.lineTo(px + bracketLen, py + tileSize);
    // Bottom-right
    ctx.moveTo(px + tileSize - bracketLen, py + tileSize);
    ctx.lineTo(px + tileSize, py + tileSize);
    ctx.lineTo(px + tileSize, py + tileSize - bracketLen);
    ctx.stroke();

    ctx.restore();
  }
}
