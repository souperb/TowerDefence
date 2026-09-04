import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  MemoryStorageProvider,
  LocalStorageProvider,
  createDefaultStorageSchema,
  isValidStorageSchema,
  migrateStorageSchema,
  StorageService,
  SettingsManager,
  DEFAULT_SETTINGS,
  STORAGE_SCHEMA_VERSION,
} from '@/storage';

describe('Storage Schema & Migrations', () => {
  it('should create default storage schema with version 1', () => {
    const schema = createDefaultStorageSchema();
    expect(schema.version).toBe(1);
    expect(schema.settings.masterVolume).toBe(DEFAULT_SETTINGS.masterVolume);
    expect(schema.settings.sfxVolume).toBe(DEFAULT_SETTINGS.sfxVolume);
    expect(schema.settings.bgmVolume).toBe(DEFAULT_SETTINGS.bgmVolume);
    expect(schema.settings.showRangeOnHover).toBe(true);
    expect(schema.settings.gameSpeed).toBe(1);
    expect(schema.progress.unlockedTowers).toContain('archer');
    expect(schema.progress.unlockedLevels).toContain('level-1');
    expect(schema.savedSession).toBeNull();
  });

  it('should correctly validate valid and invalid schemas', () => {
    const valid = createDefaultStorageSchema();
    expect(isValidStorageSchema(valid)).toBe(true);

    expect(isValidStorageSchema(null)).toBe(false);
    expect(isValidStorageSchema(undefined)).toBe(false);
    expect(isValidStorageSchema({})).toBe(false);
    expect(isValidStorageSchema({ version: '1' })).toBe(false);
    expect(
      isValidStorageSchema({
        version: 1,
        settings: { masterVolume: 'high' },
        progress: {},
      })
    ).toBe(false);
    expect(
      isValidStorageSchema({
        version: 1,
        settings: { ...DEFAULT_SETTINGS, gameSpeed: 3 }, // invalid game speed
        progress: valid.progress,
      })
    ).toBe(false);
  });

  it('should migrate unversioned (v0 / legacy) data to v1 with safe defaults', () => {
    const legacyData = {
      settings: {
        masterVolume: 0.5,
        sfxVolume: 1.5, // should be clamped to 1.0
        bgmVolume: -0.2, // should be clamped to 0.0
        gameSpeed: 2,
      },
      progress: {
        highScores: { 'map-1': 1500 },
        completedLevels: ['map-1'],
      },
    };

    const migrated = migrateStorageSchema(legacyData);
    expect(migrated.version).toBe(STORAGE_SCHEMA_VERSION);
    expect(migrated.settings.masterVolume).toBe(0.5);
    expect(migrated.settings.sfxVolume).toBe(1.0);
    expect(migrated.settings.bgmVolume).toBe(0.0);
    expect(migrated.settings.gameSpeed).toBe(2);
    expect(migrated.settings.showRangeOnHover).toBe(true); // default filled
    expect(migrated.progress.highScores['map-1']).toBe(1500);
    expect(migrated.progress.completedLevels).toEqual(['map-1']);
    expect(migrated.progress.unlockedTowers).toEqual(['archer', 'cannon', 'mage']);
  });

  it('should gracefully handle corrupt or garbage payload by returning default schema', () => {
    const resultFromNull = migrateStorageSchema(null);
    expect(resultFromNull.version).toBe(1);
    expect(resultFromNull.settings.masterVolume).toBe(DEFAULT_SETTINGS.masterVolume);

    const resultFromCorrupt = migrateStorageSchema('random non-json string');
    expect(resultFromCorrupt.version).toBe(1);
    expect(resultFromCorrupt.settings.gameSpeed).toBe(1);
  });
});

describe('MemoryStorageProvider', () => {
  let provider: MemoryStorageProvider;

  beforeEach(() => {
    provider = new MemoryStorageProvider();
  });

  it('should set, get, remove, and clear items in memory', () => {
    expect(provider.length).toBe(0);
    expect(provider.getItem('foo')).toBeNull();

    provider.setItem('foo', 'bar');
    expect(provider.length).toBe(1);
    expect(provider.getItem('foo')).toBe('bar');
    expect(provider.key(0)).toBe('foo');

    provider.setItem('num', '42');
    expect(provider.length).toBe(2);

    provider.removeItem('foo');
    expect(provider.getItem('foo')).toBeNull();
    expect(provider.length).toBe(1);

    provider.clear();
    expect(provider.length).toBe(0);
    expect(provider.getItem('num')).toBeNull();
  });
});

describe('LocalStorageProvider', () => {
  it('should wrap window.localStorage or provided storage mock', () => {
    const mockStorage: Storage = {
      length: 0,
      clear: vi.fn(),
      getItem: vi.fn((key: string) => (key === 'k' ? 'val' : null)),
      key: vi.fn(() => null),
      removeItem: vi.fn(),
      setItem: vi.fn(),
    };

    const provider = new LocalStorageProvider(mockStorage);
    expect(provider.getItem('k')).toBe('val');
    provider.setItem('test', '123');
    expect(mockStorage.setItem).toHaveBeenCalledWith('test', '123');
    provider.removeItem('test');
    expect(mockStorage.removeItem).toHaveBeenCalledWith('test');
    provider.clear();
    expect(mockStorage.clear).toHaveBeenCalled();
  });
});

describe('StorageService', () => {
  let memoryProvider: MemoryStorageProvider;
  let service: StorageService;

  beforeEach(() => {
    memoryProvider = new MemoryStorageProvider();
    service = new StorageService(memoryProvider);
  });

  it('should load default schema if storage is empty and save it', () => {
    const schema = service.load();
    expect(schema.version).toBe(1);
    expect(schema.settings.masterVolume).toBe(DEFAULT_SETTINGS.masterVolume);
    expect(memoryProvider.length).toBe(1);
  });

  it('should round-trip save and load data accurately', () => {
    const loaded = service.load();
    loaded.settings.masterVolume = 0.35;
    loaded.progress.highScores['level-1'] = 9999;
    service.save(loaded);

    const reloaded = service.load();
    expect(reloaded.settings.masterVolume).toBe(0.35);
    expect(reloaded.progress.highScores['level-1']).toBe(9999);
  });

  it('should recover from malformed / corrupted JSON by resetting to defaults', () => {
    memoryProvider.setItem('tower_defence_data', '{ corrupted json! not valid ...');

    const schema = service.load();
    expect(schema.version).toBe(1);
    expect(schema.settings.masterVolume).toBe(DEFAULT_SETTINGS.masterVolume);
  });

  it('should save and retrieve partial settings and progress', () => {
    const updatedSettings = service.saveSettings({ bgmVolume: 0.2, gameSpeed: 4 });
    expect(updatedSettings.bgmVolume).toBe(0.2);
    expect(updatedSettings.gameSpeed).toBe(4);
    expect(service.getSettings().bgmVolume).toBe(0.2);

    const updatedProgress = service.saveProgress({
      highScores: { 'map-alpha': 5000 },
      starRatings: { 'map-alpha': 3 },
    });
    expect(updatedProgress.highScores['map-alpha']).toBe(5000);
    expect(updatedProgress.starRatings['map-alpha']).toBe(3);
    expect(service.getProgress().highScores['map-alpha']).toBe(5000);
  });

  it('should save, retrieve, and clear saved sessions', () => {
    expect(service.getSavedSession()).toBeNull();

    service.saveSession({
      mapId: 'level-1',
      currentWave: 5,
      gold: 250,
      lives: 18,
      score: 1200,
      towers: [
        { type: 'archer', tier: 2, gridX: 3, gridY: 4, targetStrategy: 'first' },
      ],
      timestamp: 123456789,
    });

    const session = service.getSavedSession();
    expect(session).not.toBeNull();
    expect(session?.currentWave).toBe(5);
    expect(session?.towers[0].type).toBe('archer');

    service.clearSavedSession();
    expect(service.getSavedSession()).toBeNull();
  });

  it('should fallback to in-memory storage provider when save throws QuotaExceededError or SecurityError', () => {
    const throwingProvider: MemoryStorageProvider = new MemoryStorageProvider();
    vi.spyOn(throwingProvider, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError', 'QuotaExceededError');
    });

    const throwingService = new StorageService(throwingProvider);
    expect(throwingService.isUsingMemoryFallback()).toBe(false);

    const schema = createDefaultStorageSchema();
    schema.settings.masterVolume = 0.12;

    const saveResult = throwingService.save(schema);
    expect(saveResult).toBe(false);
    expect(throwingService.isUsingMemoryFallback()).toBe(true);

    // Subsequent reads and writes should continue seamlessly in memory
    expect(throwingService.getSettings().masterVolume).toBe(0.12);
  });

  it('should support generic getItem, setItem, removeItem, and resetToDefaults', () => {
    service.setItem('custom_flag', { active: true, count: 5 });
    expect(service.getItem<{ active: boolean; count: number }>('custom_flag')).toEqual({
      active: true,
      count: 5,
    });

    service.removeItem('custom_flag');
    expect(service.getItem('custom_flag')).toBeNull();

    service.saveSettings({ masterVolume: 0.1 });
    service.resetToDefaults();
    expect(service.getSettings().masterVolume).toBe(DEFAULT_SETTINGS.masterVolume);
  });
});

describe('SettingsManager', () => {
  let storageService: StorageService;
  let settingsManager: SettingsManager;

  beforeEach(() => {
    storageService = new StorageService(new MemoryStorageProvider());
    settingsManager = new SettingsManager(storageService);
  });

  it('should get initial settings from storage', () => {
    const settings = settingsManager.getSettings();
    expect(settings.masterVolume).toBe(DEFAULT_SETTINGS.masterVolume);
    expect(settings.sfxVolume).toBe(DEFAULT_SETTINGS.sfxVolume);
    expect(settings.gameSpeed).toBe(1);
  });

  it('should clamp volume settings between 0 and 1', () => {
    settingsManager.setMasterVolume(1.8);
    expect(settingsManager.get('masterVolume')).toBe(1.0);

    settingsManager.setSfxVolume(-0.5);
    expect(settingsManager.get('sfxVolume')).toBe(0.0);

    settingsManager.setBgmVolume(0.45);
    expect(settingsManager.get('bgmVolume')).toBe(0.45);
  });

  it('should validate and set game speed', () => {
    settingsManager.setGameSpeed(2);
    expect(settingsManager.get('gameSpeed')).toBe(2);

    settingsManager.setGameSpeed(4);
    expect(settingsManager.get('gameSpeed')).toBe(4);

    // Invalid game speeds should be rejected
    settingsManager.setGameSpeed(3 as any);
    expect(settingsManager.get('gameSpeed')).toBe(4);
  });

  it('should update multiple settings via update()', () => {
    settingsManager.update({
      masterVolume: 0.5,
      showRangeOnHover: false,
      gameSpeed: 2,
    });

    const settings = settingsManager.getSettings();
    expect(settings.masterVolume).toBe(0.5);
    expect(settings.showRangeOnHover).toBe(false);
    expect(settings.gameSpeed).toBe(2);
  });

  it('should notify subscribers on change', () => {
    const listener = vi.fn();
    const unsubscribe = settingsManager.subscribe(listener);

    settingsManager.setMasterVolume(0.6);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ masterVolume: 0.6 }));

    unsubscribe();
    settingsManager.setMasterVolume(0.9);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('should notify property-specific listeners with onChange', () => {
    const sfxListener = vi.fn();
    const unsub = settingsManager.onChange('sfxVolume', sfxListener);

    settingsManager.setSfxVolume(0.3);
    expect(sfxListener).toHaveBeenCalledWith(0.3);

    settingsManager.setMasterVolume(0.4);
    // sfxListener shouldn't be called when masterVolume changes
    expect(sfxListener).toHaveBeenCalledTimes(1);

    unsub();
    settingsManager.setSfxVolume(0.8);
    expect(sfxListener).toHaveBeenCalledTimes(1);
  });

  it('should persist settings to storage and restore them on reload', () => {
    settingsManager.setMasterVolume(0.25);
    settingsManager.setShowRangeOnHover(false);
    settingsManager.setGameSpeed(4);
    settingsManager.setSoundtrack('8bit');

    // Create a new SettingsManager pointing to the same storage service
    const reloadedManager = new SettingsManager(storageService);
    const reloadedSettings = reloadedManager.getSettings();

    expect(reloadedSettings.masterVolume).toBe(0.25);
    expect(reloadedSettings.showRangeOnHover).toBe(false);
    expect(reloadedSettings.gameSpeed).toBe(4);
    expect(reloadedSettings.soundtrack).toBe('8bit');
  });

  it('should support soundtrack get, set, and toggle', () => {
    expect(settingsManager.getSoundtrack()).toBe('modern');

    settingsManager.setSoundtrack('8bit');
    expect(settingsManager.getSoundtrack()).toBe('8bit');

    const toggled = settingsManager.toggleSoundtrack();
    expect(toggled).toBe('modern');
    expect(settingsManager.getSoundtrack()).toBe('modern');
  });

  it('should reset to defaults and notify listeners', () => {
    settingsManager.setMasterVolume(0.1);
    const listener = vi.fn();
    settingsManager.subscribe(listener);

    settingsManager.resetDefaults();
    expect(settingsManager.get('masterVolume')).toBe(DEFAULT_SETTINGS.masterVolume);
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ masterVolume: DEFAULT_SETTINGS.masterVolume }));
  });
});
