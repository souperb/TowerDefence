import { describe, it, expect } from 'vitest';
import { TileType } from '../../src/game/map/TileType';
import {
  worldToGrid,
  gridToWorld,
  getTileCenter,
  isWithinBounds,
  distance,
  manhattanDistance,
} from '../../src/game/map/CoordinateUtils';
import { TileGrid } from '../../src/game/map/TileGrid';

describe('TileType enum', () => {
  it('should have correct enum values', () => {
    expect(TileType.Buildable).toBe('buildable');
    expect(TileType.Path).toBe('path');
    expect(TileType.Blocked).toBe('blocked');
    expect(TileType.Occupied).toBe('occupied');
  });
});

describe('CoordinateUtils', () => {
  const tileSize = 32;

  describe('worldToGrid', () => {
    it('converts exact tile top-left to grid coordinates', () => {
      expect(worldToGrid(0, 0, tileSize)).toEqual({ x: 0, y: 0 });
      expect(worldToGrid(32, 64, tileSize)).toEqual({ x: 1, y: 2 });
    });

    it('converts points inside a tile to grid coordinates', () => {
      expect(worldToGrid(15, 25, tileSize)).toEqual({ x: 0, y: 0 });
      expect(worldToGrid(47, 95, tileSize)).toEqual({ x: 1, y: 2 });
    });

    it('handles negative coordinates correctly', () => {
      expect(worldToGrid(-1, -1, tileSize)).toEqual({ x: -1, y: -1 });
      expect(worldToGrid(-32, -32, tileSize)).toEqual({ x: -1, y: -1 });
      expect(worldToGrid(-33, 0, tileSize)).toEqual({ x: -2, y: 0 });
    });

    it('throws when tileSize is <= 0', () => {
      expect(() => worldToGrid(10, 10, 0)).toThrow();
      expect(() => worldToGrid(10, 10, -5)).toThrow();
    });
  });

  describe('gridToWorld', () => {
    it('converts grid coordinates to top-left world coordinates', () => {
      expect(gridToWorld(0, 0, tileSize)).toEqual({ x: 0, y: 0 });
      expect(gridToWorld(3, 5, tileSize)).toEqual({ x: 96, y: 160 });
    });

    it('roundtrips with worldToGrid', () => {
      const grid = { x: 4, y: 7 };
      const world = gridToWorld(grid.x, grid.y, tileSize);
      const roundtrip = worldToGrid(world.x, world.y, tileSize);
      expect(roundtrip).toEqual(grid);
    });

    it('throws when tileSize is <= 0', () => {
      expect(() => gridToWorld(1, 1, 0)).toThrow();
    });
  });

  describe('getTileCenter', () => {
    it('calculates the center coordinate of a tile', () => {
      expect(getTileCenter(0, 0, tileSize)).toEqual({ x: 16, y: 16 });
      expect(getTileCenter(2, 3, tileSize)).toEqual({ x: 80, y: 112 });
    });

    it('throws when tileSize is <= 0', () => {
      expect(() => getTileCenter(1, 1, 0)).toThrow();
    });
  });

  describe('isWithinBounds', () => {
    const width = 10;
    const height = 8;

    it('returns true for inside coordinates', () => {
      expect(isWithinBounds(0, 0, width, height)).toBe(true);
      expect(isWithinBounds(9, 7, width, height)).toBe(true);
      expect(isWithinBounds(5, 4, width, height)).toBe(true);
    });

    it('returns false for outside coordinates', () => {
      expect(isWithinBounds(-1, 0, width, height)).toBe(false);
      expect(isWithinBounds(0, -1, width, height)).toBe(false);
      expect(isWithinBounds(10, 5, width, height)).toBe(false);
      expect(isWithinBounds(5, 8, width, height)).toBe(false);
      expect(isWithinBounds(1.5, 2, width, height)).toBe(false);
    });
  });

  describe('distance and manhattanDistance', () => {
    it('computes Euclidean distance correctly', () => {
      expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
      expect(distance({ x: 10, y: 20 }, { x: 10, y: 20 })).toBe(0);
    });

    it('computes Manhattan distance correctly', () => {
      expect(manhattanDistance({ x: 1, y: 2 }, { x: 4, y: 6 })).toBe(7);
      expect(manhattanDistance({ x: 3, y: 3 }, { x: 3, y: 3 })).toBe(0);
    });
  });
});

describe('TileGrid Data Model', () => {
  it('initializes grid with default Buildable tiles', () => {
    const grid = new TileGrid(5, 4, 32);
    expect(grid.width).toBe(5);
    expect(grid.height).toBe(4);
    expect(grid.tileSize).toBe(32);
    expect(grid.worldWidth).toBe(160);
    expect(grid.worldHeight).toBe(128);

    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 5; x++) {
        expect(grid.getTile(x, y)).toBe(TileType.Buildable);
        expect(grid.isBuildable(x, y)).toBe(true);
        expect(grid.isOccupied(x, y)).toBe(false);
      }
    }
  });

  it('validates bounds on getTile and setTileType', () => {
    const grid = new TileGrid(5, 5, 32);
    expect(grid.getTile(-1, 0)).toBeNull();
    expect(grid.getTile(5, 5)).toBeNull();

    expect(grid.setTileType(-1, 0, TileType.Path)).toBe(false);
    expect(grid.setTileType(2, 3, TileType.Path)).toBe(true);
    expect(grid.getTile(2, 3)).toBe(TileType.Path);
    expect(grid.isBuildable(2, 3)).toBe(false);
  });

  it('manages tile occupancy state transitions (occupy and free)', () => {
    const grid = new TileGrid(4, 4, 32);
    expect(grid.isBuildable(1, 1)).toBe(true);

    // Occupy buildable tile
    expect(grid.occupyTile(1, 1)).toBe(true);
    expect(grid.isOccupied(1, 1)).toBe(true);
    expect(grid.isBuildable(1, 1)).toBe(false);

    // Cannot occupy already occupied tile
    expect(grid.occupyTile(1, 1)).toBe(false);

    // Free occupied tile
    expect(grid.freeTile(1, 1)).toBe(true);
    expect(grid.isBuildable(1, 1)).toBe(true);
    expect(grid.isOccupied(1, 1)).toBe(false);

    // Cannot free an already free tile
    expect(grid.freeTile(1, 1)).toBe(false);

    // Cannot occupy Blocked or Path tiles
    grid.setTileType(2, 2, TileType.Blocked);
    expect(grid.occupyTile(2, 2)).toBe(false);

    grid.setTileType(3, 3, TileType.Path);
    expect(grid.occupyTile(3, 3)).toBe(false);
  });

  it('manages and validates waypoints', () => {
    const grid = new TileGrid(5, 5, 32);

    // Waypoints must be on Path tiles
    const waypoints = [
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 2, y: 3 },
    ];

    // Invalid because tiles are not yet Path
    expect(grid.setWaypoints(waypoints)).toBe(false);

    // Set tiles to path
    for (const wp of waypoints) {
      grid.setTileType(wp.x, wp.y, TileType.Path);
    }

    expect(grid.setWaypoints(waypoints)).toBe(true);
    expect(grid.getWaypoints()).toEqual(waypoints);

    // Invalid waypoints length < 2
    expect(grid.setWaypoints([{ x: 0, y: 1 }])).toBe(false);

    // Out of bounds waypoint
    expect(grid.validateWaypoints([{ x: 0, y: 1 }, { x: 10, y: 1 }])).toBe(false);
  });

  it('loads level configuration from string ASCII map', () => {
    const mapAscii = [
      'PPP..',
      '..P..',
      '..P##',
      '..PPP',
    ];

    const grid = TileGrid.fromLevelConfig({
      width: 5,
      height: 4,
      tileSize: 32,
      tiles: mapAscii,
      waypoints: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 2, y: 1 },
        { x: 2, y: 2 },
        { x: 2, y: 3 },
        { x: 3, y: 3 },
        { x: 4, y: 3 },
      ],
    });

    expect(grid.getTile(0, 0)).toBe(TileType.Path);
    expect(grid.getTile(3, 0)).toBe(TileType.Buildable);
    expect(grid.getTile(3, 2)).toBe(TileType.Blocked);
    expect(grid.getTile(4, 2)).toBe(TileType.Blocked);
    expect(grid.getWaypoints().length).toBe(8);
  });

  it('loads level configuration from 2D TileType array', () => {
    const tiles: TileType[][] = [
      [TileType.Buildable, TileType.Path],
      [TileType.Blocked, TileType.Occupied],
    ];

    const grid = TileGrid.fromLevelConfig({
      width: 2,
      height: 2,
      tiles,
    });

    expect(grid.getTile(0, 0)).toBe(TileType.Buildable);
    expect(grid.getTile(1, 0)).toBe(TileType.Path);
    expect(grid.getTile(0, 1)).toBe(TileType.Blocked);
    expect(grid.getTile(1, 1)).toBe(TileType.Occupied);
  });
});
