export interface GridPosition {
  x: number;
  y: number;
}

export interface WorldPosition {
  x: number;
  y: number;
}

/**
 * Converts world coordinates (pixels) to grid tile coordinates.
 */
export function worldToGrid(
  worldX: number,
  worldY: number,
  tileSize: number
): GridPosition {
  if (tileSize <= 0) {
    throw new Error('tileSize must be greater than 0');
  }
  return {
    x: Math.floor(worldX / tileSize),
    y: Math.floor(worldY / tileSize),
  };
}

/**
 * Converts grid tile coordinates to top-left world coordinates (pixels).
 */
export function gridToWorld(
  gridX: number,
  gridY: number,
  tileSize: number
): WorldPosition {
  if (tileSize <= 0) {
    throw new Error('tileSize must be greater than 0');
  }
  return {
    x: gridX * tileSize,
    y: gridY * tileSize,
  };
}

/**
 * Converts grid tile coordinates to center world coordinates (pixels).
 */
export function getTileCenter(
  gridX: number,
  gridY: number,
  tileSize: number
): WorldPosition {
  if (tileSize <= 0) {
    throw new Error('tileSize must be greater than 0');
  }
  return {
    x: gridX * tileSize + tileSize / 2,
    y: gridY * tileSize + tileSize / 2,
  };
}

/**
 * Checks if a grid coordinate is within valid grid boundaries.
 */
export function isWithinBounds(
  gridX: number,
  gridY: number,
  width: number,
  height: number
): boolean {
  return (
    Number.isInteger(gridX) &&
    Number.isInteger(gridY) &&
    gridX >= 0 &&
    gridX < width &&
    gridY >= 0 &&
    gridY < height
  );
}

/**
 * Calculates Euclidean distance between two world points.
 */
export function distance(
  pos1: WorldPosition,
  pos2: WorldPosition
): number {
  const dx = pos2.x - pos1.x;
  const dy = pos2.y - pos1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculates Manhattan distance between two grid positions.
 */
export function manhattanDistance(
  pos1: GridPosition,
  pos2: GridPosition
): number {
  return Math.abs(pos2.x - pos1.x) + Math.abs(pos2.y - pos1.y);
}
