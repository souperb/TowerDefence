import type { IStorageProvider } from './StorageProvider';
import { MemoryStorageProvider } from './MemoryStorageProvider';
import { LocalStorageProvider } from './LocalStorageProvider';
import {
  type GameStorageSchema,
  type GameSettings,
  type GameProgress,
  type SavedSession,
  createDefaultStorageSchema,
} from './StorageSchema';
import { migrateStorageSchema } from './SchemaMigrations';

export const DEFAULT_STORAGE_KEY = 'tower_defence_data';

export interface IStorageService {
  getItem<T>(key: string): T | null;
  setItem<T>(key: string, value: T): void;
}

export class StorageService implements IStorageService {
  private provider: IStorageProvider;
  private readonly storageKey: string;
  private isFallbackActive = false;

  constructor(provider?: IStorageProvider, storageKey: string = DEFAULT_STORAGE_KEY) {
    this.storageKey = storageKey;

    if (provider) {
      this.provider = provider;
    } else {
      this.provider = this.createDefaultProvider();
    }
  }

  private createDefaultProvider(): IStorageProvider {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const testKey = `__td_storage_test_${Math.random()}`;
        window.localStorage.setItem(testKey, '1');
        window.localStorage.removeItem(testKey);
        return new LocalStorageProvider(window.localStorage);
      }
    } catch (error) {
      console.warn('[StorageService] LocalStorage unavailable or restricted. Using MemoryStorageProvider fallback:', error);
      this.isFallbackActive = true;
      return new MemoryStorageProvider();
    }

    this.isFallbackActive = true;
    return new MemoryStorageProvider();
  }

  public isUsingMemoryFallback(): boolean {
    return this.isFallbackActive;
  }

  public getProvider(): IStorageProvider {
    return this.provider;
  }

  public load(autoSaveDefault: boolean = true): GameStorageSchema {
    try {
      const raw = this.provider.getItem(this.storageKey);
      if (raw === null || raw === undefined || raw.trim() === '') {
        const defaults = createDefaultStorageSchema();
        if (autoSaveDefault) {
          this.save(defaults);
        }
        return defaults;
      }

      const parsed = JSON.parse(raw);
      const migrated = migrateStorageSchema(parsed);
      return migrated;
    } catch (error) {
      console.warn('[StorageService] Failed to parse stored JSON data or corrupted payload. Resetting to defaults:', error);
      const defaults = createDefaultStorageSchema();
      if (autoSaveDefault) {
        this.save(defaults);
      }
      return defaults;
    }
  }

  public save(data: GameStorageSchema): boolean {
    try {
      const serialized = JSON.stringify(data);
      this.provider.setItem(this.storageKey, serialized);
      return true;
    } catch (error) {
      console.warn('[StorageService] Save failed (storage restricted/quota exceeded). Falling back to in-memory storage:', error);
      this.switchToMemoryFallback(data);
      return false;
    }
  }

  private switchToMemoryFallback(currentData?: GameStorageSchema): void {
    const memoryProvider = new MemoryStorageProvider();
    this.provider = memoryProvider;
    this.isFallbackActive = true;

    if (currentData) {
      try {
        memoryProvider.setItem(this.storageKey, JSON.stringify(currentData));
      } catch {
        // In-memory set should not fail
      }
    }
  }

  public getSettings(): GameSettings {
    const schema = this.load(false);
    return schema.settings;
  }

  public saveSettings(settings: Partial<GameSettings>): GameSettings {
    const schema = this.load(false);
    const updatedSettings: GameSettings = {
      ...schema.settings,
      ...settings,
    };
    schema.settings = updatedSettings;
    this.save(schema);
    return updatedSettings;
  }

  public getProgress(): GameProgress {
    const schema = this.load(false);
    return schema.progress;
  }

  public saveProgress(progress: Partial<GameProgress>): GameProgress {
    const schema = this.load();
    const updatedProgress: GameProgress = {
      ...schema.progress,
      ...progress,
      highScores: {
        ...schema.progress.highScores,
        ...(progress.highScores ?? {}),
      },
      starRatings: {
        ...schema.progress.starRatings,
        ...(progress.starRatings ?? {}),
      },
    };
    schema.progress = updatedProgress;
    this.save(schema);
    return updatedProgress;
  }

  public getSavedSession(): SavedSession | null {
    const schema = this.load();
    return schema.savedSession ?? null;
  }

  public saveSession(session: SavedSession): void {
    const schema = this.load();
    schema.savedSession = session;
    this.save(schema);
  }

  public clearSavedSession(): void {
    const schema = this.load();
    schema.savedSession = null;
    this.save(schema);
  }

  public resetToDefaults(): GameStorageSchema {
    const defaults = createDefaultStorageSchema();
    this.save(defaults);
    return defaults;
  }

  public getItem<T>(key: string): T | null {
    try {
      const raw = this.provider.getItem(key);
      if (raw === null || raw === undefined) {
        return null;
      }
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  public setItem<T>(key: string, value: T): void {
    try {
      this.provider.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`[StorageService] setItem failed for key "${key}", switching to in-memory fallback:`, error);
      this.switchToMemoryFallback();
      this.provider.setItem(key, JSON.stringify(value));
    }
  }

  public removeItem(key: string): void {
    this.provider.removeItem(key);
  }

  public clear(): void {
    this.provider.clear();
  }
}
