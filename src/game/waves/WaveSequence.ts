import {
  WaveDefinition,
  getTotalCreepsInWave,
  getWaveDurationSeconds,
  DEFAULT_WAVES,
} from './WaveDefinition';

export interface WaveSequenceConfig {
  id?: string;
  name?: string;
  description?: string;
  waves: WaveDefinition[];
}

/**
 * Immutable sequence model representing configured waves for a map or level.
 */
export class WaveSequence {
  public readonly id?: string;
  public readonly name?: string;
  public readonly description?: string;
  private readonly waves: WaveDefinition[];

  constructor(config: WaveSequenceConfig | WaveDefinition[]) {
    if (Array.isArray(config)) {
      this.waves = config.map((w) => ({
        ...w,
        spawnGroups: w.spawnGroups.map((g) => ({ ...g })),
      }));
    } else {
      this.id = config.id;
      this.name = config.name;
      this.description = config.description;
      this.waves = config.waves.map((w) => ({
        ...w,
        spawnGroups: w.spawnGroups.map((g) => ({ ...g })),
      }));
    }
  }

  public getWaves(): readonly WaveDefinition[] {
    return this.waves;
  }

  public getWave(index: number): WaveDefinition | null {
    if (index < 0 || index >= this.waves.length) {
      return null;
    }
    return this.waves[index];
  }

  public getTotalWaves(): number {
    return this.waves.length;
  }

  public isLastWave(index: number): boolean {
    return this.waves.length > 0 && index >= this.waves.length - 1;
  }

  public getTotalCreeps(): number {
    return this.waves.reduce((sum, wave) => sum + getTotalCreepsInWave(wave), 0);
  }

  public getTotalCreepsInWave(index: number): number {
    const wave = this.getWave(index);
    return wave ? getTotalCreepsInWave(wave) : 0;
  }

  public getWaveDurationSeconds(index: number): number {
    const wave = this.getWave(index);
    return wave ? getWaveDurationSeconds(wave) : 0;
  }

  public validate(): boolean {
    if (this.waves.length === 0) {
      return false;
    }
    for (const wave of this.waves) {
      if (wave.waveNumber <= 0 || wave.spawnGroups.length === 0) {
        return false;
      }
      for (const group of wave.spawnGroups) {
        if (group.count <= 0 || group.intervalSeconds <= 0) {
          return false;
        }
      }
    }
    return true;
  }

  public static fromDefaultWaves(): WaveSequence {
    return new WaveSequence({
      id: 'default-sequence',
      name: 'Default Campaign Waves',
      waves: DEFAULT_WAVES,
    });
  }

  public static fromConfig(config: WaveSequenceConfig): WaveSequence {
    return new WaveSequence(config);
  }
}
