export type GameSpeed = 1 | 2 | 4;

export interface GameSettings {
  masterVolume: number;
  sfxVolume: number;
  bgmVolume: number;
  showRangeOnHover: boolean;
  gameSpeed: GameSpeed;
  autoWave?: boolean;
}

export interface GameProgress {
  highScores: Record<string, number>;
  completedLevels: string[];
  unlockedTowers: string[];
  starRatings: Record<string, number>;
  unlockedLevels: string[];
}

export interface SavedTowerState {
  type: string;
  tier: number;
  gridX: number;
  gridY: number;
  targetStrategy?: 'first' | 'lowestHp' | 'closest';
  customProps?: Record<string, unknown>;
}

export interface SavedSession {
  mapId: string;
  currentWave: number;
  gold: number;
  lives: number;
  score: number;
  towers: SavedTowerState[];
  timestamp?: number;
}

export interface GameStorageSchema {
  version: number;
  settings: GameSettings;
  progress: GameProgress;
  savedSession?: SavedSession | null;
}

export const STORAGE_SCHEMA_VERSION = 1;

export const DEFAULT_SETTINGS: Readonly<GameSettings> = {
  masterVolume: 0.8,
  sfxVolume: 0.8,
  bgmVolume: 0.7,
  showRangeOnHover: true,
  gameSpeed: 1,
  autoWave: false,
};

export const DEFAULT_PROGRESS: Readonly<GameProgress> = {
  highScores: {},
  completedLevels: [],
  unlockedTowers: ['archer', 'cannon', 'mage'],
  starRatings: {},
  unlockedLevels: ['level-1'],
};

export function createDefaultStorageSchema(): GameStorageSchema {
  return {
    version: STORAGE_SCHEMA_VERSION,
    settings: {
      masterVolume: DEFAULT_SETTINGS.masterVolume,
      sfxVolume: DEFAULT_SETTINGS.sfxVolume,
      bgmVolume: DEFAULT_SETTINGS.bgmVolume,
      showRangeOnHover: DEFAULT_SETTINGS.showRangeOnHover,
      gameSpeed: DEFAULT_SETTINGS.gameSpeed,
      autoWave: DEFAULT_SETTINGS.autoWave,
    },
    progress: {
      highScores: { ...DEFAULT_PROGRESS.highScores },
      completedLevels: [...DEFAULT_PROGRESS.completedLevels],
      unlockedTowers: [...DEFAULT_PROGRESS.unlockedTowers],
      starRatings: { ...DEFAULT_PROGRESS.starRatings },
      unlockedLevels: [...DEFAULT_PROGRESS.unlockedLevels],
    },
    savedSession: null,
  };
}

export function isValidGameSpeed(speed: unknown): speed is GameSpeed {
  return speed === 1 || speed === 2 || speed === 4;
}

export function isValidStorageSchema(data: unknown): data is GameStorageSchema {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const obj = data as Partial<GameStorageSchema>;
  if (typeof obj.version !== 'number') {
    return false;
  }

  if (typeof obj.settings !== 'object' || obj.settings === null) {
    return false;
  }

  const s = obj.settings;
  if (
    typeof s.masterVolume !== 'number' ||
    typeof s.sfxVolume !== 'number' ||
    typeof s.bgmVolume !== 'number' ||
    typeof s.showRangeOnHover !== 'boolean' ||
    !isValidGameSpeed(s.gameSpeed)
  ) {
    return false;
  }

  if (typeof obj.progress !== 'object' || obj.progress === null) {
    return false;
  }

  const p = obj.progress;
  if (
    typeof p.highScores !== 'object' ||
    p.highScores === null ||
    !Array.isArray(p.completedLevels) ||
    !Array.isArray(p.unlockedTowers)
  ) {
    return false;
  }

  return true;
}
