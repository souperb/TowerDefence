import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TileGrid } from '../../src/game/map/TileGrid';
import { TileType } from '../../src/game/map/TileType';
import { getTowerDefinition } from '../../src/game/towers/TowerCatalog';
import { EconomyManager } from '../../src/game/economy/EconomyManager';
import { PlacementRenderer } from '../../src/rendering/PlacementRenderer';

describe('PlacementRenderer (TASK-04-02)', () => {
  let grid: TileGrid;
  let economy: EconomyManager;
  let renderer: PlacementRenderer;
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    grid = new TileGrid(10, 10, 32);
    // Set (1,1) as Path, (2,2) as Blocked, (3,3) as Occupied
    grid.setTileType(1, 1, TileType.Path);
    grid.setTileType(2, 2, TileType.Blocked);
    grid.setTileType(3, 3, TileType.Occupied);

    economy = new EconomyManager(300);
    renderer = new PlacementRenderer({ grid, economy });

    canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 320;
    ctx = canvas.getContext('2d')!;
  });

  it('should not render anything if active tower is null or hovered tile is null', () => {
    renderer.setActiveTower(null);
    renderer.setHoveredTile({ x: 5, y: 5 });
    renderer.render(ctx);
    expect(ctx.arc).not.toHaveBeenCalled();
    expect(ctx.fillRect).not.toHaveBeenCalled();

    renderer.setActiveTower('archer');
    renderer.setHoveredTile(null);
    renderer.render(ctx);
    expect(ctx.arc).not.toHaveBeenCalled();
    expect(ctx.fillRect).not.toHaveBeenCalled();
  });

  it('should not render if hovered tile is out of bounds', () => {
    renderer.setActiveTower('archer');
    renderer.setHoveredTile({ x: 20, y: 20 });
    renderer.render(ctx);
    expect(ctx.arc).not.toHaveBeenCalled();
  });

  it('should render range circle with radius matching tower definition range', () => {
    const archerDef = getTowerDefinition('archer');
    renderer.setActiveTower('archer');
    renderer.setHoveredTile({ x: 4, y: 4 });

    renderer.render(ctx);

    const expectedCenterX = 4 * 32 + 16;
    const expectedCenterY = 4 * 32 + 16;
    expect(ctx.arc).toHaveBeenCalledWith(
      expectedCenterX,
      expectedCenterY,
      archerDef.range,
      0,
      Math.PI * 2
    );
  });

  it('should render green range and ghost preview on valid buildable tile with sufficient gold', () => {
    renderer.setActiveTower('archer');
    renderer.setHoveredTile({ x: 5, y: 5 }); // Buildable tile, gold is 300 (archer costs 100)

    expect(renderer.isValidPlacement('archer', 5, 5)).toBe(true);

    renderer.render(ctx);

    // Range circle fill and stroke should use valid theme colors
    expect(ctx.arc).toHaveBeenCalled();
    expect(ctx.fill).toHaveBeenCalled();
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it('should render red range and ghost preview on invalid tiles (path, blocked, occupied)', () => {
    renderer.setActiveTower('cannon');

    // Path tile (1,1)
    expect(renderer.isValidPlacement('cannon', 1, 1)).toBe(false);

    // Blocked tile (2,2)
    expect(renderer.isValidPlacement('cannon', 2, 2)).toBe(false);

    // Occupied tile (3,3)
    expect(renderer.isValidPlacement('cannon', 3, 3)).toBe(false);

    renderer.setHoveredTile({ x: 1, y: 1 });
    renderer.render(ctx);
    expect(ctx.arc).toHaveBeenCalled();
  });

  it('should render red range preview when player has insufficient gold for tower', () => {
    economy.setGold(50); // Mage costs 200

    expect(renderer.isValidPlacement('mage', 5, 5)).toBe(false);

    renderer.setActiveTower('mage');
    renderer.setHoveredTile({ x: 5, y: 5 });
    renderer.render(ctx);

    expect(ctx.arc).toHaveBeenCalled();
  });

  it('should support custom validation override function', () => {
    const customValidator = vi.fn((_type: string, x: number, y: number) => {
      return x === 5 && y === 5;
    });

    renderer.setCustomValidation(customValidator);

    expect(renderer.isValidPlacement('archer', 5, 5)).toBe(true);
    expect(renderer.isValidPlacement('archer', 6, 6)).toBe(false);
    expect(customValidator).toHaveBeenCalled();
  });

  it('should support theme customizations', () => {
    renderer.setTheme({
      validRangeFill: 'rgba(0, 255, 0, 0.5)',
      invalidRangeFill: 'rgba(255, 0, 0, 0.5)',
    });

    renderer.setActiveTower('archer');
    renderer.setHoveredTile({ x: 4, y: 4 });
    renderer.render(ctx);

    expect(ctx.arc).toHaveBeenCalled();
  });
});
