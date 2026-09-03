import {
  type GameSettings,
  type GameSpeed,
  DEFAULT_SETTINGS,
  isValidGameSpeed,
} from './StorageSchema';
import { StorageService } from './StorageService';

export type SettingsListener = (settings: Readonly<GameSettings>) => void;
export type SettingPropertyListener<K extends keyof GameSettings> = (
  value: GameSettings[K]
) => void;

function clampVolume(volume: number): number {
  if (Number.isNaN(volume)) {
    return 0;
  }
  return Math.max(0, Math.min(1, volume));
}

export class SettingsManager {
  private readonly storageService: StorageService;
  private currentSettings: GameSettings;
  private readonly listeners: Set<SettingsListener> = new Set();
  private readonly propertyListeners: Map<
    keyof GameSettings,
    Set<(value: any) => void>
  > = new Map();

  constructor(storageService?: StorageService) {
    this.storageService = storageService ?? new StorageService();
    this.currentSettings = { ...this.storageService.getSettings() };
  }

  public getSettings(): Readonly<GameSettings> {
    return { ...this.currentSettings };
  }

  public get<K extends keyof GameSettings>(key: K): GameSettings[K] {
    return this.currentSettings[key];
  }

  public set<K extends keyof GameSettings>(key: K, value: GameSettings[K]): void {
    if (key === 'masterVolume' || key === 'sfxVolume' || key === 'bgmVolume') {
      (this.currentSettings as any)[key] = clampVolume(value as number);
    } else if (key === 'gameSpeed') {
      if (isValidGameSpeed(value)) {
        this.currentSettings.gameSpeed = value;
      }
    } else if (key === 'showRangeOnHover') {
      this.currentSettings.showRangeOnHover = Boolean(value);
    } else if (key === 'autoWave') {
      this.currentSettings.autoWave = Boolean(value);
    }

    this.persistAndNotify([key]);
  }

  public update(partial: Partial<GameSettings>): void {
    const changedKeys: Array<keyof GameSettings> = [];
    if (partial.masterVolume !== undefined) {
      this.currentSettings.masterVolume = clampVolume(partial.masterVolume);
      changedKeys.push('masterVolume');
    }
    if (partial.sfxVolume !== undefined) {
      this.currentSettings.sfxVolume = clampVolume(partial.sfxVolume);
      changedKeys.push('sfxVolume');
    }
    if (partial.bgmVolume !== undefined) {
      this.currentSettings.bgmVolume = clampVolume(partial.bgmVolume);
      changedKeys.push('bgmVolume');
    }
    if (partial.showRangeOnHover !== undefined) {
      this.currentSettings.showRangeOnHover = Boolean(partial.showRangeOnHover);
      changedKeys.push('showRangeOnHover');
    }
    if (partial.autoWave !== undefined) {
      this.currentSettings.autoWave = Boolean(partial.autoWave);
      changedKeys.push('autoWave');
    }
    if (partial.gameSpeed !== undefined && isValidGameSpeed(partial.gameSpeed)) {
      this.currentSettings.gameSpeed = partial.gameSpeed;
      changedKeys.push('gameSpeed');
    }

    this.persistAndNotify(changedKeys);
  }

  public setMasterVolume(volume: number): void {
    this.set('masterVolume', volume);
  }

  public setSfxVolume(volume: number): void {
    this.set('sfxVolume', volume);
  }

  public setBgmVolume(volume: number): void {
    this.set('bgmVolume', volume);
  }

  public setShowRangeOnHover(show: boolean): void {
    this.set('showRangeOnHover', show);
  }

  public setGameSpeed(speed: GameSpeed): void {
    this.set('gameSpeed', speed);
  }

  public setAutoWave(autoWave: boolean): void {
    this.set('autoWave', autoWave);
  }

  public resetDefaults(): void {
    this.currentSettings = { ...DEFAULT_SETTINGS };
    this.persistAndNotify();
  }

  public subscribe(listener: SettingsListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public onChange<K extends keyof GameSettings>(
    key: K,
    listener: SettingPropertyListener<K>
  ): () => void {
    if (!this.propertyListeners.has(key)) {
      this.propertyListeners.set(key, new Set());
    }
    const set = this.propertyListeners.get(key)!;
    set.add(listener as (value: any) => void);

    return () => {
      set.delete(listener as (value: any) => void);
    };
  }

  private persistAndNotify(changedKeys?: Array<keyof GameSettings>): void {
    this.storageService.saveSettings(this.currentSettings);

    const snapshot = this.getSettings();
    for (const listener of this.listeners) {
      try {
        listener(snapshot);
      } catch (err) {
        console.error('[SettingsManager] Error in settings listener:', err);
      }
    }

    const keysToNotify = changedKeys ?? (Object.keys(this.currentSettings) as Array<keyof GameSettings>);
    for (const key of keysToNotify) {
      const listeners = this.propertyListeners.get(key);
      if (listeners) {
        const val = this.currentSettings[key];
        for (const listener of listeners) {
          try {
            listener(val);
          } catch (err) {
            console.error(`[SettingsManager] Error in property listener for ${key}:`, err);
          }
        }
      }
    }
  }
}
