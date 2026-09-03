import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Viewport } from '../../src/rendering/Viewport';
import { TileGrid } from '../../src/game/map/TileGrid';
import { TileType } from '../../src/game/map/TileType';
import { MapRenderer } from '../../src/rendering/MapRenderer';
import { GridCursorRenderer } from '../../src/rendering/GridCursorRenderer';
import { InputManager } from '../../src/input/InputManager';

describe('Viewport', () => {
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
  });

  it('initializes with virtual dimensions and calculates aspect ratio', () => {
    const viewport = new Viewport({
      virtualWidth: 800,
      virtualHeight: 600,
      canvas,
    });

    expect(viewport.virtualWidth).toBe(800);
    expect(viewport.virtualHeight).toBe(600);
    expect(viewport.aspectRatio).toBeCloseTo(800 / 600);
  });

  it('calculates scale and letterboxing for wider aspect container', () => {
    const viewport = new Viewport({
      virtualWidth: 800,
      virtualHeight: 600,
      canvas,
    });

    // Container is wider (1200x600) -> scale is limited by height (scale = 1.0)
    viewport.update(1200, 600);
    expect(viewport.scale).toBe(1.0);
    expect(viewport.offsetY).toBe(0);
    expect(viewport.offsetX).toBe((1200 - 800) / 2); // 200px letterbox on each side
  });

  it('calculates scale and pillarboxing for taller aspect container', () => {
    const viewport = new Viewport({
      virtualWidth: 800,
      virtualHeight: 600,
      canvas,
    });

    // Container is taller (800x1000) -> scale is limited by width (scale = 1.0)
    viewport.update(800, 1000);
    expect(viewport.scale).toBe(1.0);
    expect(viewport.offsetX).toBe(0);
    expect(viewport.offsetY).toBe((1000 - 600) / 2); // 200px letterbox top/bottom
  });

  it('scales uniformly when container maintains same aspect ratio', () => {
    const viewport = new Viewport({
      virtualWidth: 800,
      virtualHeight: 600,
      canvas,
    });

    viewport.update(1600, 1200);
    expect(viewport.scale).toBe(2.0);
    expect(viewport.offsetX).toBe(0);
    expect(viewport.offsetY).toBe(0);
  });

  it('converts screen/client coordinates to world coordinates under scaling and offsets', () => {
    const viewport = new Viewport({
      virtualWidth: 800,
      virtualHeight: 600,
      canvas,
    });

    // Mock canvas bounding client rect
    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
      left: 100,
      top: 50,
      right: 1300,
      bottom: 650,
      width: 1200,
      height: 600,
      x: 100,
      y: 50,
      toJSON: () => {},
    });

    viewport.update(1200, 600); // scale = 1.0, offsetX = 200, offsetY = 0

    // Pointer at left edge of letterbox
    // clientX = 100 (canvas left) + 200 (letterbox offset) + 32 (1 tile in world) = 332
    // clientY = 50 (canvas top) + 0 (offset) + 64 (2 tiles in world) = 114
    const world = viewport.screenToWorld(332, 114);
    expect(world.x).toBeCloseTo(32);
    expect(world.y).toBeCloseTo(64);

    const gridPos = viewport.screenToGrid(332, 114, 32);
    expect(gridPos).toEqual({ x: 1, y: 2 });
  });

  it('applies transform matrix to Canvas 2D context', () => {
    const viewport = new Viewport({
      virtualWidth: 800,
      virtualHeight: 600,
      canvas,
    });
    viewport.update(1200, 600);

    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    viewport.applyTransform(ctx);

    expect(ctx.setTransform).toHaveBeenCalledWith(
      viewport.scale,
      0,
      0,
      viewport.scale,
      viewport.offsetX,
      viewport.offsetY
    );
  });
});

describe('MapRenderer', () => {
  it('renders tile grid and grid borders on 2D context', () => {
    const grid = new TileGrid(4, 4, 32);
    grid.setTileType(1, 1, TileType.Path);
    grid.setTileType(2, 2, TileType.Blocked);
    grid.setTileType(3, 3, TileType.Occupied);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

    const renderer = new MapRenderer(grid);
    renderer.render(ctx);

    expect(ctx.fillRect).toHaveBeenCalled();
    expect(ctx.strokeRect).toHaveBeenCalled();
    expect(ctx.stroke).toHaveBeenCalled();
  });
});

describe('GridCursorRenderer & Hover Buildability', () => {
  it('renders valid highlight when hovering over buildable tile', () => {
    const grid = new TileGrid(5, 5, 32);
    const cursor = new GridCursorRenderer(grid);
    cursor.setHoveredTile({ x: 2, y: 2 });

    expect(cursor.isValidPlacement(2, 2)).toBe(true);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    cursor.render(ctx);

    expect(ctx.fillRect).toHaveBeenCalledWith(64, 64, 32, 32);
    expect(ctx.strokeRect).toHaveBeenCalled();
  });

  it('renders invalid highlight when hovering over Path or Blocked tile', () => {
    const grid = new TileGrid(5, 5, 32);
    grid.setTileType(1, 1, TileType.Path);
    grid.setTileType(2, 2, TileType.Blocked);

    const cursor = new GridCursorRenderer(grid);

    cursor.setHoveredTile({ x: 1, y: 1 });
    expect(cursor.isValidPlacement(1, 1)).toBe(false);

    cursor.setHoveredTile({ x: 2, y: 2 });
    expect(cursor.isValidPlacement(2, 2)).toBe(false);
  });

  it('respects visibility flag and custom validation logic', () => {
    const grid = new TileGrid(5, 5, 32);
    const cursor = new GridCursorRenderer(grid);
    cursor.setHoveredTile({ x: 0, y: 0 });

    cursor.setVisible(false);
    expect(cursor.isVisible()).toBe(false);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    cursor.render(ctx);

    expect(ctx.fillRect).not.toHaveBeenCalled();

    cursor.setVisible(true);
    cursor.setCustomValidCheck((x, _y) => x > 2);
    expect(cursor.isValidPlacement(0, 0)).toBe(false);
    expect(cursor.isValidPlacement(3, 0)).toBe(true);
  });
});

describe('InputManager Pointer & Touch Tracking', () => {
  let canvas: HTMLCanvasElement;
  let viewport: Viewport;
  let inputManager: InputManager;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;

    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      right: 800,
      bottom: 600,
      width: 800,
      height: 600,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    viewport = new Viewport({
      virtualWidth: 800,
      virtualHeight: 600,
      canvas,
    });

    inputManager = new InputManager({
      canvas,
      viewport,
      tileSize: 32,
    });
  });

  it('triggers hover callbacks on pointermove with resolved world and grid positions', () => {
    const hoverSpy = vi.fn();
    inputManager.onHover(hoverSpy);

    const pointerEvent = new PointerEvent('pointermove', {
      clientX: 64 + 10,
      clientY: 96 + 15,
    });
    canvas.dispatchEvent(pointerEvent);

    expect(hoverSpy).toHaveBeenCalledWith(
      { x: 2, y: 3 },
      { x: 74, y: 111 }
    );
    expect(inputManager.getPointerGridPosition()).toEqual({ x: 2, y: 3 });
    expect(inputManager.isPointerOverCanvas()).toBe(true);
  });

  it('clears hover state on pointerleave', () => {
    const hoverSpy = vi.fn();
    inputManager.onHover(hoverSpy);

    canvas.dispatchEvent(new PointerEvent('pointermove', { clientX: 50, clientY: 50 }));
    expect(inputManager.isPointerOverCanvas()).toBe(true);

    canvas.dispatchEvent(new PointerEvent('pointerleave'));
    expect(hoverSpy).toHaveBeenLastCalledWith(null, null);
    expect(inputManager.getPointerGridPosition()).toBeNull();
    expect(inputManager.isPointerOverCanvas()).toBe(false);
  });

  it('dispatches click callbacks with grid and world position on primary button click', () => {
    const clickSpy = vi.fn();
    inputManager.onClick(clickSpy);

    canvas.dispatchEvent(
      new PointerEvent('pointerdown', {
        clientX: 128 + 5,
        clientY: 32 + 5,
        button: 0,
      })
    );

    expect(clickSpy).toHaveBeenCalledWith(
      { x: 4, y: 1 },
      { x: 133, y: 37 }
    );
  });

  it('ignores non-primary pointer clicks', () => {
    const clickSpy = vi.fn();
    inputManager.onClick(clickSpy);

    canvas.dispatchEvent(
      new PointerEvent('pointerdown', {
        clientX: 128,
        clientY: 32,
        button: 2, // Right click
      })
    );

    expect(clickSpy).not.toHaveBeenCalled();
  });

  it('cleans up listeners on destroy', () => {
    inputManager.destroy();
    const hoverSpy = vi.fn();
    inputManager.onHover(hoverSpy);

    canvas.dispatchEvent(new PointerEvent('pointermove', { clientX: 50, clientY: 50 }));
    expect(hoverSpy).not.toHaveBeenCalled();
  });
});
