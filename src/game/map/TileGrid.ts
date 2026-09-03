import { TileType } from './TileType';
import {
  GridPosition,
  WorldPosition,
  isWithinBounds,
  worldToGrid,
  gridToWorld,
  getTileCenter,
} from './CoordinateUtils';

export interface LevelConfig {
  width: number;
  height: number;
  tileSize?: number;
  tiles?: TileType[][] | string[];
  waypoints?: GridPosition[];
}

export class TileGrid {
  readonly width: number;
  readonly height: number;
  readonly tileSize: number;

  private tiles: TileType[][];
  private waypoints: GridPosition[] = [];

  constructor(width: number, height: number, tileSize: number = 32) {
    if (width <= 0 || height <= 0) {
      throw new Error('Grid dimensions must be positive integers');
    }
    if (tileSize <= 0) {
      throw new Error('tileSize must be greater than 0');
    }

    this.width = width;
    this.height = height;
    this.tileSize = tileSize;

    // Default all tiles to Buildable
    this.tiles = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => TileType.Buildable)
    );
  }

  /**
   * Returns total world width in pixels.
   */
  get worldWidth(): number {
    return this.width * this.tileSize;
  }

  /**
   * Returns total world height in pixels.
   */
  get worldHeight(): number {
    return this.height * this.tileSize;
  }

  /**
   * Checks if grid coordinate is within bounds.
   */
  isWithinBounds(x: number, y: number): boolean {
    return isWithinBounds(x, y, this.width, this.height);
  }

  /**
   * Gets the tile type at the specified grid coordinate.
   * Returns null if out of bounds.
   */
  getTile(x: number, y: number): TileType | null {
    if (!this.isWithinBounds(x, y)) {
      return null;
    }
    return this.tiles[y][x];
  }

  /**
   * Sets the tile type at the specified grid coordinate.
   * Returns true if successfully set, false if out of bounds.
   */
  setTileType(x: number, y: number, type: TileType): boolean {
    if (!this.isWithinBounds(x, y)) {
      return false;
    }
    this.tiles[y][x] = type;
    return true;
  }

  /**
   * Checks if a tile is buildable (TileType.Buildable).
   */
  isBuildable(x: number, y: number): boolean {
    if (!this.isWithinBounds(x, y)) {
      return false;
    }
    return this.tiles[y][x] === TileType.Buildable;
  }

  /**
   * Checks if a tile is occupied by a tower/structure.
   */
  isOccupied(x: number, y: number): boolean {
    if (!this.isWithinBounds(x, y)) {
      return false;
    }
    return this.tiles[y][x] === TileType.Occupied;
  }

  /**
   * Attempts to occupy a buildable tile.
   * Returns true on success, false if tile is not buildable or out of bounds.
   */
  occupyTile(x: number, y: number): boolean {
    if (!this.isBuildable(x, y)) {
      return false;
    }
    this.tiles[y][x] = TileType.Occupied;
    return true;
  }

  /**
   * Frees an occupied tile, returning it to Buildable state.
   * Returns true on success, false if tile was not occupied or out of bounds.
   */
  freeTile(x: number, y: number): boolean {
    if (!this.isOccupied(x, y)) {
      return false;
    }
    this.tiles[y][x] = TileType.Buildable;
    return true;
  }

  /**
   * Converts world coordinates (pixels) to grid coordinate.
   */
  worldToGrid(worldX: number, worldY: number): GridPosition {
    return worldToGrid(worldX, worldY, this.tileSize);
  }

  /**
   * Converts grid coordinate to top-left world position (pixels).
   */
  gridToWorld(gridX: number, gridY: number): WorldPosition {
    return gridToWorld(gridX, gridY, this.tileSize);
  }

  /**
   * Converts grid coordinate to center world position (pixels).
   */
  getTileCenter(gridX: number, gridY: number): WorldPosition {
    return getTileCenter(gridX, gridY, this.tileSize);
  }

  /**
   * Sets and validates waypoint path.
   * Validates that all waypoints are in bounds and lie on Path tiles.
   */
  setWaypoints(waypoints: GridPosition[]): boolean {
    if (!this.validateWaypoints(waypoints)) {
      return false;
    }
    this.waypoints = waypoints.map((wp) => ({ ...wp }));
    return true;
  }

  /**
   * Gets copy of current waypoints.
   */
  getWaypoints(): GridPosition[] {
    return this.waypoints.map((wp) => ({ ...wp }));
  }

  /**
   * Validates that a sequence of waypoints is valid within the grid.
   * A valid path has >= 2 waypoints, all within bounds and on Path tiles.
   */
  validateWaypoints(waypoints: GridPosition[]): boolean {
    if (!waypoints || waypoints.length < 2) {
      return false;
    }

    for (const wp of waypoints) {
      if (!this.isWithinBounds(wp.x, wp.y)) {
        return false;
      }
      if (this.tiles[wp.y][wp.x] !== TileType.Path) {
        return false;
      }
    }

    return true;
  }

  /**
   * Loads a level configuration into this TileGrid or creates a new TileGrid from config.
   */
  loadLevelConfig(config: LevelConfig): void {
    if (config.width !== this.width || config.height !== this.height) {
      throw new Error(
        `Config dimensions (${config.width}x${config.height}) do not match grid dimensions (${this.width}x${this.height})`
      );
    }

    if (config.tiles) {
      if (typeof config.tiles[0] === 'string') {
        const charMap: Record<string, TileType> = {
          '.': TileType.Buildable,
          'G': TileType.Buildable,
          'P': TileType.Path,
          '#': TileType.Blocked,
          'B': TileType.Blocked,
          'O': TileType.Occupied,
        };
        const strRows = config.tiles as string[];
        for (let y = 0; y < this.height; y++) {
          const row = strRows[y] || '';
          for (let x = 0; x < this.width; x++) {
            const char = row[x] || '.';
            this.tiles[y][x] = charMap[char] ?? TileType.Buildable;
          }
        }
      } else {
        const tileRows = config.tiles as TileType[][];
        for (let y = 0; y < this.height; y++) {
          for (let x = 0; x < this.width; x++) {
            this.tiles[y][x] = tileRows[y]?.[x] ?? TileType.Buildable;
          }
        }
      }
    }

    if (config.waypoints) {
      this.setWaypoints(config.waypoints);
    }
  }

  /**
   * Factory to create and initialize a TileGrid from a LevelConfig.
   */
  static fromLevelConfig(config: LevelConfig): TileGrid {
    const tileSize = config.tileSize ?? 32;
    const grid = new TileGrid(config.width, config.height, tileSize);
    grid.loadLevelConfig(config);
    return grid;
  }

  /**
   * Returns a 2D copy of the current tile map.
   */
  getTileMap(): TileType[][] {
    return this.tiles.map((row) => [...row]);
  }
}
