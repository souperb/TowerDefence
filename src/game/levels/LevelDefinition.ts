import { LevelConfig } from '../map/TileGrid';
import { IVector2 } from '../../core/math/Vector2';
import { WaveDefinition } from '../waves/WaveDefinition';
import { MapRendererTheme } from '../../rendering/MapRenderer';

export type GameMode = 'adventure' | 'custom';

export interface LevelDefinition {
  id: string;
  number: number;
  name: string;
  subtitle: string;
  description: string;
  difficulty: number; // 1 to 5 (stars / difficulty rating)
  difficultyLabel: string; // 'Beginner' | 'Easy' | 'Medium' | 'Hard' | 'Expert'
  theme: MapRendererTheme;
  mapConfig: LevelConfig;
  gridWaypoints: IVector2[];
  worldWaypoints: IVector2[];
  waves: WaveDefinition[];
  initialGold: number;
  initialLives: number;
}

/**
 * Converts a list of grid-coordinate waypoints into pixel center world coordinates.
 */
export function gridWaypointsToWorld(
  gridWaypoints: IVector2[],
  tileSize: number = 32
): IVector2[] {
  return gridWaypoints.map((wp) => ({
    x: wp.x * tileSize + tileSize / 2,
    y: wp.y * tileSize + tileSize / 2,
  }));
}
