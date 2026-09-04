import {
  type GameStorageSchema,
  type GameSettings,
  type GameProgress,
  type GameSpeed,
  type SoundtrackMode,
  STORAGE_SCHEMA_VERSION,
  DEFAULT_SETTINGS,
  DEFAULT_PROGRESS,
  createDefaultStorageSchema,
  isValidGameSpeed,
  isValidSoundtrack,
} from './StorageSchema';

export type MigrationFunction = (data: Record<string, unknown>) => Record<string, unknown>;

function clampVolume(volume: unknown, defaultValue: number): number {
  if (typeof volume !== 'number' || Number.isNaN(volume)) {
    return defaultValue;
  }
  return Math.max(0, Math.min(1, volume));
}

function sanitizeGameSpeed(speed: unknown, defaultSpeed: GameSpeed): GameSpeed {
  if (isValidGameSpeed(speed)) {
    return speed;
  }
  return defaultSpeed;
}

function sanitizeSoundtrack(soundtrack: unknown, defaultSoundtrack: SoundtrackMode): SoundtrackMode {
  if (isValidSoundtrack(soundtrack)) {
    return soundtrack;
  }
  return defaultSoundtrack;
}

function sanitizeSettings(rawSettings: unknown): GameSettings {
  if (typeof rawSettings !== 'object' || rawSettings === null) {
    return { ...DEFAULT_SETTINGS };
  }

  const s = rawSettings as Record<string, unknown>;
  return {
    masterVolume: clampVolume(s.masterVolume, DEFAULT_SETTINGS.masterVolume),
    sfxVolume: clampVolume(s.sfxVolume, DEFAULT_SETTINGS.sfxVolume),
    bgmVolume: clampVolume(s.bgmVolume, DEFAULT_SETTINGS.bgmVolume),
    showRangeOnHover:
      typeof s.showRangeOnHover === 'boolean'
        ? s.showRangeOnHover
        : DEFAULT_SETTINGS.showRangeOnHover,
    gameSpeed: sanitizeGameSpeed(s.gameSpeed, DEFAULT_SETTINGS.gameSpeed),
    soundtrack: sanitizeSoundtrack(s.soundtrack, DEFAULT_SETTINGS.soundtrack ?? 'modern'),
  };
}

function sanitizeProgress(rawProgress: unknown): GameProgress {
  if (typeof rawProgress !== 'object' || rawProgress === null) {
    return {
      highScores: { ...DEFAULT_PROGRESS.highScores },
      completedLevels: [...DEFAULT_PROGRESS.completedLevels],
      unlockedTowers: [...DEFAULT_PROGRESS.unlockedTowers],
      starRatings: { ...DEFAULT_PROGRESS.starRatings },
      unlockedLevels: [...DEFAULT_PROGRESS.unlockedLevels],
    };
  }

  const p = rawProgress as Record<string, unknown>;

  const highScores: Record<string, number> = {};
  if (typeof p.highScores === 'object' && p.highScores !== null) {
    for (const [k, v] of Object.entries(p.highScores as Record<string, unknown>)) {
      if (typeof v === 'number' && !Number.isNaN(v)) {
        highScores[k] = v;
      }
    }
  }

  const starRatings: Record<string, number> = {};
  if (typeof p.starRatings === 'object' && p.starRatings !== null) {
    for (const [k, v] of Object.entries(p.starRatings as Record<string, unknown>)) {
      if (typeof v === 'number' && !Number.isNaN(v)) {
        starRatings[k] = Math.max(0, Math.min(3, Math.floor(v)));
      }
    }
  }

  const completedLevels = Array.isArray(p.completedLevels)
    ? p.completedLevels.filter((item): item is string => typeof item === 'string')
    : [...DEFAULT_PROGRESS.completedLevels];

  const unlockedTowers = Array.isArray(p.unlockedTowers)
    ? p.unlockedTowers.filter((item): item is string => typeof item === 'string')
    : [...DEFAULT_PROGRESS.unlockedTowers];

  const unlockedLevels = Array.isArray(p.unlockedLevels)
    ? p.unlockedLevels.filter((item): item is string => typeof item === 'string')
    : [...DEFAULT_PROGRESS.unlockedLevels];

  return {
    highScores,
    completedLevels,
    unlockedTowers: unlockedTowers.length > 0 ? unlockedTowers : [...DEFAULT_PROGRESS.unlockedTowers],
    starRatings,
    unlockedLevels: unlockedLevels.length > 0 ? unlockedLevels : [...DEFAULT_PROGRESS.unlockedLevels],
  };
}

/**
 * Migration from unversioned (v0 or legacy flat layout) to v1.
 */
export const migrateV0ToV1: MigrationFunction = (data: Record<string, unknown>) => {
  const settings = sanitizeSettings(data.settings ?? data);
  const progress = sanitizeProgress(data.progress ?? data);

  return {
    version: 1,
    settings,
    progress,
    savedSession: (data.savedSession as GameStorageSchema['savedSession']) ?? null,
  };
};

export const MIGRATIONS: Record<number, MigrationFunction> = {
  0: migrateV0ToV1,
};

/**
 * Migrates any raw storage payload to the latest versioned GameStorageSchema.
 * If data is corrupt or unrecoverable, returns safe defaults.
 */
export function migrateStorageSchema(rawData: unknown): GameStorageSchema {
  if (typeof rawData !== 'object' || rawData === null) {
    return createDefaultStorageSchema();
  }

  try {
    let currentData = { ...(rawData as Record<string, unknown>) };
    let currentVersion = typeof currentData.version === 'number' ? currentData.version : 0;

    // Apply incremental migrations up to target version
    while (currentVersion < STORAGE_SCHEMA_VERSION) {
      const migration = MIGRATIONS[currentVersion];
      if (migration) {
        currentData = migration(currentData);
        currentVersion = typeof currentData.version === 'number' ? currentData.version : currentVersion + 1;
      } else {
        // No migration defined for this intermediate version, break to fallback
        break;
      }
    }

    // Ensure final structure adheres to schema version 1
    return {
      version: STORAGE_SCHEMA_VERSION,
      settings: sanitizeSettings(currentData.settings),
      progress: sanitizeProgress(currentData.progress),
      savedSession: (currentData.savedSession as GameStorageSchema['savedSession']) ?? null,
    };
  } catch (error) {
    console.warn('[SchemaMigrations] Error migrating storage schema, falling back to defaults:', error);
    return createDefaultStorageSchema();
  }
}
