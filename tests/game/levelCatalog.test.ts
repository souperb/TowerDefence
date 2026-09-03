import { describe, it, expect } from 'vitest';
import {
  LEVEL_LIST,
  LEVEL_CATALOG,
  getLevel,
  getLevelByNumber,
  getNextLevel,
  getDefaultLevel,
  gridWaypointsToWorld,
} from '../../src/game/levels';
import { TileGrid } from '../../src/game/map/TileGrid';
import { TileType } from '../../src/game/map/TileType';
import { getTotalCreepsInWave } from '../../src/game/waves/WaveDefinition';

describe('LevelCatalog & 5-Level Progression', () => {
  it('contains exactly 5 levels with increasing difficulty', () => {
    expect(LEVEL_LIST).toHaveLength(5);
    expect(Object.keys(LEVEL_CATALOG)).toHaveLength(5);

    for (let i = 0; i < LEVEL_LIST.length; i++) {
      const level = LEVEL_LIST[i];
      expect(level.number).toBe(i + 1);
      expect(level.difficulty).toBe(i + 1);
      expect(level.id).toBe(`level-${i + 1}`);
      expect(level.name).toBeDefined();
      expect(level.waves.length).toBeGreaterThanOrEqual(6);
    }
  });

  it('provides helper lookups: getLevel, getLevelByNumber, getNextLevel, getDefaultLevel', () => {
    expect(getDefaultLevel().id).toBe('level-1');
    expect(getLevel('level-1').name).toBe('Emerald Plains');
    expect(getLevel('level-5').name).toBe('Infernal Caldera');
    expect(() => getLevel('unknown-level')).toThrow();

    expect(getLevelByNumber(2)?.id).toBe('level-2');
    expect(getLevelByNumber(99)).toBeUndefined();

    expect(getNextLevel('level-1')?.id).toBe('level-2');
    expect(getNextLevel('level-2')?.id).toBe('level-3');
    expect(getNextLevel('level-3')?.id).toBe('level-4');
    expect(getNextLevel('level-4')?.id).toBe('level-5');
    expect(getNextLevel('level-5')).toBeUndefined();
  });

  it('converts grid waypoints to world pixel coordinates correctly', () => {
    const gridWp = [{ x: 1, y: 2 }, { x: 5, y: 10 }];
    const worldWp = gridWaypointsToWorld(gridWp, 32);
    expect(worldWp).toEqual([
      { x: 1 * 32 + 16, y: 2 * 32 + 16 },
      { x: 5 * 32 + 16, y: 10 * 32 + 16 },
    ]);
  });

  it('validates each of the 5 level map configurations in TileGrid', () => {
    for (const level of LEVEL_LIST) {
      expect(level.mapConfig.width).toBe(30);
      expect(level.mapConfig.height).toBe(20);
      expect(level.mapConfig.tileSize).toBe(32);

      const grid = TileGrid.fromLevelConfig(level.mapConfig);
      expect(grid.width).toBe(30);
      expect(grid.height).toBe(20);

      // Verify each waypoint is on a Path tile
      for (const wp of level.gridWaypoints) {
        expect(grid.isWithinBounds(wp.x, wp.y)).toBe(true);
        const tile = grid.getTile(wp.x, wp.y);
        if (tile !== TileType.Path) {
          throw new Error(`Level ${level.id} (${level.name}) waypoint (${wp.x}, ${wp.y}) tile is "${tile}", expected "path"`);
        }
        expect(tile).toBe(TileType.Path);
      }

      // Verify waypoint list is validated
      expect(grid.validateWaypoints(level.gridWaypoints)).toBe(true);
    }
  });

  it('validates wave definitions for all levels', () => {
    for (const level of LEVEL_LIST) {
      for (const wave of level.waves) {
        expect(wave.waveNumber).toBeGreaterThan(0);
        expect(wave.spawnGroups.length).toBeGreaterThan(0);
        expect(getTotalCreepsInWave(wave)).toBeGreaterThan(0);
        for (const group of wave.spawnGroups) {
          expect(group.count).toBeGreaterThan(0);
          expect(group.intervalSeconds).toBeGreaterThan(0);
        }
      }
    }
  });
});
