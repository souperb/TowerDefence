import { TileGrid } from '../game/map/TileGrid';
import { GridPosition, getTileCenter } from '../game/map/CoordinateUtils';
import { TowerType } from '../game/towers/TowerComponents';
import { getTowerDefinition, TowerDefinition } from '../game/towers/TowerCatalog';
import { EconomyManager } from '../game/economy/EconomyManager';

export interface PlacementTheme {
  validRangeFill: string;
  validRangeStroke: string;
  invalidRangeFill: string;
  invalidRangeStroke: string;
  validGhostFill: string;
  validGhostStroke: string;
  invalidGhostFill: string;
  invalidGhostStroke: string;
  rangeLineWidth: number;
  ghostLineWidth: number;
  ghostAlpha: number;
}

export const DEFAULT_PLACEMENT_THEME: PlacementTheme = {
  validRangeFill: 'rgba(6, 182, 212, 0.16)',        // Relic cyan holographic field
  validRangeStroke: 'rgba(56, 189, 248, 0.85)',       // Hard-light cyan perimeter ring
  invalidRangeFill: 'rgba(239, 68, 68, 0.18)',      // Sanguine warning field
  invalidRangeStroke: 'rgba(244, 63, 94, 0.85)',     // Sanguine warning ring
  validGhostFill: 'rgba(6, 182, 212, 0.3)',
  validGhostStroke: 'rgba(56, 189, 248, 0.9)',
  invalidGhostFill: 'rgba(239, 68, 68, 0.3)',
  invalidGhostStroke: 'rgba(244, 63, 94, 0.9)',
  rangeLineWidth: 2,
  ghostLineWidth: 2,
  ghostAlpha: 0.8,
};

export interface PlacementRendererConfig {
  grid: TileGrid;
  economy?: EconomyManager;
  theme?: Partial<PlacementTheme>;
}

export class PlacementRenderer {
  private grid: TileGrid;
  private economy?: EconomyManager;
  private theme: PlacementTheme;

  private activeTower: TowerType | null = null;
  private hoveredTile: GridPosition | null = null;
  private customValidation?: (type: TowerType, gridX: number, gridY: number) => boolean;

  constructor(config: PlacementRendererConfig) {
    this.grid = config.grid;
    this.economy = config.economy;
    this.theme = { ...DEFAULT_PLACEMENT_THEME, ...config.theme };
  }

  public setGrid(grid: TileGrid): void {
    this.grid = grid;
  }

  public setEconomy(economy?: EconomyManager): void {
    this.economy = economy;
  }

  public setTheme(theme: Partial<PlacementTheme>): void {
    this.theme = { ...this.theme, ...theme };
  }

  public setActiveTower(towerType: TowerType | null): void {
    this.activeTower = towerType;
  }

  public getActiveTower(): TowerType | null {
    return this.activeTower;
  }

  public setHoveredTile(pos: GridPosition | null): void {
    this.hoveredTile = pos ? { ...pos } : null;
  }

  public getHoveredTile(): GridPosition | null {
    return this.hoveredTile ? { ...this.hoveredTile } : null;
  }

  public setCustomValidation(fn?: (type: TowerType, gridX: number, gridY: number) => boolean): void {
    this.customValidation = fn;
  }

  /**
   * Checks if placement at the specified tile is valid for the given tower type.
   */
  public isValidPlacement(type: TowerType, gridX: number, gridY: number): boolean {
    if (this.customValidation) {
      return this.customValidation(type, gridX, gridY);
    }

    if (!this.grid.isWithinBounds(gridX, gridY)) {
      return false;
    }

    if (!this.grid.isBuildable(gridX, gridY)) {
      return false;
    }

    if (this.economy) {
      const def = getTowerDefinition(type);
      if (!this.economy.canAfford(def.baseCost)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Renders the placement ghost and circular attack range preview onto the canvas context.
   */
  public render(
    ctx: CanvasRenderingContext2D,
    overrideState?: {
      towerType?: TowerType | null;
      gridPos?: GridPosition | null;
      isValid?: boolean;
    }
  ): void {
    const towerType = overrideState?.towerType !== undefined ? overrideState.towerType : this.activeTower;
    const gridPos = overrideState?.gridPos !== undefined ? overrideState.gridPos : this.hoveredTile;

    if (!towerType || !gridPos) {
      return;
    }

    const { x, y } = gridPos;
    if (!this.grid.isWithinBounds(x, y)) {
      return;
    }

    let def: TowerDefinition;
    try {
      def = getTowerDefinition(towerType);
    } catch {
      return;
    }

    const isValid = overrideState?.isValid !== undefined
      ? overrideState.isValid
      : this.isValidPlacement(towerType, x, y);

    const tileSize = this.grid.tileSize;
    const px = x * tileSize;
    const py = y * tileSize;
    const center = getTileCenter(x, y, tileSize);

    ctx.save();

    // 1. Draw circular attack range indicator
    const rangeFill = isValid ? this.theme.validRangeFill : this.theme.invalidRangeFill;
    const rangeStroke = isValid ? this.theme.validRangeStroke : this.theme.invalidRangeStroke;

    ctx.beginPath();
    ctx.arc(center.x, center.y, def.range, 0, Math.PI * 2);
    ctx.fillStyle = rangeFill;
    ctx.fill();

    ctx.lineWidth = this.theme.rangeLineWidth;
    ctx.strokeStyle = rangeStroke;
    ctx.stroke();

    // 2. Draw ghost tower tile preview
    ctx.globalAlpha = this.theme.ghostAlpha;

    const ghostFill = isValid ? this.theme.validGhostFill : this.theme.invalidGhostFill;
    const ghostStroke = isValid ? this.theme.validGhostStroke : this.theme.invalidGhostStroke;

    ctx.fillStyle = ghostFill;
    ctx.fillRect(px, py, tileSize, tileSize);

    ctx.lineWidth = this.theme.ghostLineWidth;
    ctx.strokeStyle = ghostStroke;
    ctx.strokeRect(
      px + this.theme.ghostLineWidth / 2,
      py + this.theme.ghostLineWidth / 2,
      tileSize - this.theme.ghostLineWidth,
      tileSize - this.theme.ghostLineWidth
    );

    // 3. Draw Tower Structure preview matching placed tower visuals
    const pad = 2;
    const baseSize = tileSize - pad * 2;
    const halfBase = baseSize / 2;

    ctx.save();
    ctx.translate(center.x, center.y);

    // Heavy Relic Pedestal / Dais
    ctx.fillStyle = '#090d16';
    ctx.fillRect(-halfBase, -halfBase, baseSize, baseSize);

    // Metallic border
    ctx.strokeStyle = towerType === 'mage' ? '#581c87' : towerType === 'cannon' ? '#78350f' : '#0e7490';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-halfBase, -halfBase, baseSize, baseSize);

    // Corner Rivets
    ctx.fillStyle = '#d97706';
    const rOff = halfBase - 3;
    ctx.fillRect(-rOff, -rOff, 2, 2);
    ctx.fillRect(rOff - 2, -rOff, 2, 2);
    ctx.fillRect(-rOff, rOff - 2, 2, 2);
    ctx.fillRect(rOff - 2, rOff - 2, 2, 2);

    // Superstructure
    if (towerType === 'archer') {
      // Energy Lance Spire
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-halfBase * 0.5, -halfBase * 0.6, baseSize * 0.5, baseSize * 0.6);

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-halfBase * 0.35, halfBase * 0.4);
      ctx.lineTo(-halfBase * 0.35, -halfBase * 0.7);
      ctx.moveTo(halfBase * 0.35, halfBase * 0.4);
      ctx.lineTo(halfBase * 0.35, -halfBase * 0.7);
      ctx.stroke();

      ctx.fillStyle = '#67e8f9';
      ctx.beginPath();
      ctx.arc(0, -halfBase * 0.1, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, -halfBase * 0.1, 1.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (towerType === 'cannon') {
      // Plasma Mortar
      ctx.fillStyle = '#27272a';
      ctx.beginPath();
      ctx.arc(0, 0, halfBase * 0.75, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(0, 0, halfBase * 0.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fff7ed';
      ctx.beginPath();
      ctx.arc(0, 0, 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Void Pylon
      ctx.fillStyle = '#180d2b';
      ctx.beginPath();
      ctx.moveTo(0, -halfBase * 0.85);
      ctx.lineTo(halfBase * 0.65, 0);
      ctx.lineTo(0, halfBase * 0.85);
      ctx.lineTo(-halfBase * 0.65, 0);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
    ctx.restore();
  }
}
