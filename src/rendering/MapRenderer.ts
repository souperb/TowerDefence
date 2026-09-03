import { TileGrid } from '../game/map/TileGrid';
import { TileType } from '../game/map/TileType';

export interface MapRendererTheme {
  buildable: string;
  buildableBorder: string;
  path: string;
  pathBorder: string;
  blocked: string;
  blockedBorder: string;
  occupied: string;
  occupiedBorder: string;
  gridLine: string;
  gridLineWidth: number;
}

export const DEFAULT_MAP_THEME: MapRendererTheme = {
  buildable: '#1b3b2b',       // Deep mossy verdigris / ancient soil
  buildableBorder: '#0f241a',
  path: '#7c5335',            // Aged earthen track / powdered brick
  pathBorder: '#543620',
  blocked: '#2b2938',         // Relic basalt obelisks / forgotten stone
  blockedBorder: '#161420',
  occupied: '#1e3a5f',        // Anchored tech-dais
  occupiedBorder: '#0f1f33',
  gridLine: 'rgba(255, 200, 150, 0.05)',
  gridLineWidth: 1,
};

export class MapRenderer {
  private grid: TileGrid;
  private theme: MapRendererTheme;
  private showGridLines: boolean;

  constructor(
    grid: TileGrid,
    theme: Partial<MapRendererTheme> = {},
    showGridLines: boolean = true
  ) {
    this.grid = grid;
    this.theme = { ...DEFAULT_MAP_THEME, ...theme };
    this.showGridLines = showGridLines;
  }

  setGrid(grid: TileGrid): void {
    this.grid = grid;
  }

  setTheme(theme: Partial<MapRendererTheme>): void {
    this.theme = { ...this.theme, ...theme };
  }

  setShowGridLines(show: boolean): void {
    this.showGridLines = show;
  }

  /**
   * Renders the entire tile grid onto the 2D context.
   */
  render(ctx: CanvasRenderingContext2D): void {
    const width = this.grid.width;
    const height = this.grid.height;
    const tileSize = this.grid.tileSize;
    const totalWidth = width * tileSize;
    const totalHeight = height * tileSize;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tileType = this.grid.getTile(x, y);
        this.renderTile(ctx, x, y, tileSize, tileType);
      }
    }

    if (this.showGridLines) {
      this.renderGridLines(ctx, width, height, tileSize);
    }

    // Dying Sun atmospheric lighting & ambient vignette
    this.renderAtmosphere(ctx, totalWidth, totalHeight);
  }

  private renderAtmosphere(ctx: CanvasRenderingContext2D, totalWidth: number, totalHeight: number): void {
    ctx.save();
    // Ambient reddish/amber glow of the dying, swollen red sun of Urth
    try {
      const sunGradient = ctx.createRadialGradient(
        totalWidth * 0.85,
        totalHeight * 0.15,
        10,
        totalWidth * 0.85,
        totalHeight * 0.15,
        Math.max(totalWidth, totalHeight) * 0.95
      );
      sunGradient.addColorStop(0, 'rgba(239, 68, 68, 0.08)');
      sunGradient.addColorStop(0.4, 'rgba(217, 119, 6, 0.04)');
      sunGradient.addColorStop(1, 'rgba(15, 23, 42, 0.12)');
      ctx.fillStyle = sunGradient;
      ctx.fillRect(0, 0, totalWidth, totalHeight);
    } catch {
      // Fallback in test/mock environments without full gradient support
    }
    ctx.restore();
  }

  private renderTile(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    tileSize: number,
    tileType: TileType | null
  ): void {
    const px = x * tileSize;
    const py = y * tileSize;

    let fillColor = this.theme.buildable;
    let borderColor = this.theme.buildableBorder;

    switch (tileType) {
      case TileType.Path:
        fillColor = this.theme.path;
        borderColor = this.theme.pathBorder;
        break;
      case TileType.Blocked:
        fillColor = this.theme.blocked;
        borderColor = this.theme.blockedBorder;
        break;
      case TileType.Occupied:
        fillColor = this.theme.occupied;
        borderColor = this.theme.occupiedBorder;
        break;
      case TileType.Buildable:
      default:
        fillColor = this.theme.buildable;
        borderColor = this.theme.buildableBorder;
        break;
    }

    ctx.fillStyle = fillColor;
    ctx.fillRect(px, py, tileSize, tileSize);

    // Subtle inner tile border
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 0.5, py + 0.5, tileSize - 1, tileSize - 1);

    // Sci-Magic & Dying Earth Atmospheric Details per Tile
    if (tileType === TileType.Path) {
      // Worn flagstone grooves / ancient energy conduit runners
      ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
      ctx.fillRect(px + 3, py + tileSize - 3, tileSize - 6, 1);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.fillRect(px + 3, py + 2, tileSize - 6, 1);
      // Faint central pathway guide dots
      if ((x + y) % 2 === 0) {
        ctx.fillStyle = 'rgba(251, 191, 36, 0.12)';
        ctx.fillRect(px + tileSize / 2 - 1, py + tileSize / 2 - 1, 2, 2);
      }
    } else if (tileType === TileType.Blocked) {
      // Ancient monolithic megalith / forgotten starship bulkhead
      const margin = 3;
      ctx.fillStyle = '#0f0c1b';
      ctx.fillRect(px + margin, py + margin, tileSize - margin * 2, tileSize - margin * 2);

      // Relic runic corner braces
      ctx.strokeStyle = 'rgba(217, 119, 6, 0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      // Top-left brace
      ctx.moveTo(px + margin + 1, py + margin + 5);
      ctx.lineTo(px + margin + 1, py + margin + 1);
      ctx.lineTo(px + margin + 5, py + margin + 1);
      // Bottom-right brace
      ctx.moveTo(px + tileSize - margin - 5, py + tileSize - margin - 1);
      ctx.lineTo(px + tileSize - margin - 1, py + tileSize - margin - 1);
      ctx.lineTo(px + tileSize - margin - 1, py + tileSize - margin - 5);
      ctx.stroke();

      // Central glyph / crystal facet
      ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
      ctx.fillRect(px + tileSize / 2 - 2, py + tileSize / 2 - 2, 4, 4);
    } else if (tileType === TileType.Occupied) {
      // Anchored techno-pylon socket
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(px + tileSize / 2, py + tileSize / 2, tileSize * 0.38, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      // Buildable: Occasional ancient circuit traces / relic petroglyphs (deterministic hash)
      const hash = (x * 73 + y * 19) % 13;
      if (hash === 0) {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px + 4, py + tileSize / 2);
        ctx.lineTo(px + tileSize / 2, py + tileSize / 2);
        ctx.lineTo(px + tileSize / 2, py + tileSize - 4);
        ctx.stroke();
      } else if (hash === 1) {
        ctx.fillStyle = 'rgba(245, 158, 11, 0.06)';
        ctx.fillRect(px + 6, py + 6, 2, 2);
        ctx.fillRect(px + tileSize - 8, py + tileSize - 8, 2, 2);
      }
    }
  }

  private renderGridLines(
    ctx: CanvasRenderingContext2D,
    cols: number,
    rows: number,
    tileSize: number
  ): void {
    ctx.strokeStyle = this.theme.gridLine;
    ctx.lineWidth = this.theme.gridLineWidth;
    ctx.beginPath();

    const totalWidth = cols * tileSize;
    const totalHeight = rows * tileSize;

    for (let x = 0; x <= cols; x++) {
      const px = x * tileSize;
      ctx.moveTo(px, 0);
      ctx.lineTo(px, totalHeight);
    }

    for (let y = 0; y <= rows; y++) {
      const py = y * tileSize;
      ctx.moveTo(0, py);
      ctx.lineTo(totalWidth, py);
    }

    ctx.stroke();
  }
}
