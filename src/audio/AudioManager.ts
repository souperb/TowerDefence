/**
 * AudioManager
 * Central facade for 8-bit chiptune audio system in Tower Defence.
 * Coordinates AudioContext lifecycle, SoundEffects playback, Level BGM sequencing,
 * EventBus game triggers, and SettingsManager volume persistence.
 */

import { AudioContextManager } from './AudioContextManager';
import { SoundEffects } from './SoundEffects';
import { MusicSequencer } from './MusicSequencer';
import { getTrackForLevel, LEVEL_TRACKS } from './MusicTracks';
import { SfxName, MusicTrack } from './types';
import { EventBus } from '../core/events/EngineEvents';
import { SettingsManager } from '../storage/SettingsManager';

export interface AudioManagerOptions {
  eventBus?: EventBus;
  settingsManager?: SettingsManager;
  initialLevelId?: string;
  autoPlayMusic?: boolean;
}

export class AudioManager {
  private static instance: AudioManager | null = null;

  public readonly contextManager: AudioContextManager;
  public readonly sfx: SoundEffects;
  public readonly sequencer: MusicSequencer;

  private unsubs: Array<() => void> = [];

  constructor(options: AudioManagerOptions = {}) {
    this.contextManager = new AudioContextManager();
    this.sfx = new SoundEffects(this.contextManager);
    this.sequencer = new MusicSequencer(this.contextManager);

    if (options.settingsManager) {
      this.bindSettingsManager(options.settingsManager);
    }
    if (options.eventBus) {
      this.bindEventBus(options.eventBus);
    }

    if (options.initialLevelId) {
      this.playLevelTrack(options.initialLevelId);
    }
  }

  public static getInstance(options?: AudioManagerOptions): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager(options);
    }
    return AudioManager.instance;
  }

  /**
   * Resumes AudioContext on user interaction.
   */
  public async unlock(): Promise<boolean> {
    return this.contextManager.unlock();
  }

  /**
   * Plays a procedural 8-bit sound effect.
   */
  public playSfx(name: SfxName, options: { volumeScale?: number } = {}): void {
    this.sfx.play(name, options);
  }

  /**
   * Plays a music track by Level ID or track definition.
   */
  public playMusic(trackOrLevelId: string | MusicTrack): void {
    if (typeof trackOrLevelId === 'string') {
      const track = LEVEL_TRACKS[trackOrLevelId] ?? getTrackForLevel(trackOrLevelId);
      this.sequencer.playTrack(track);
    } else {
      this.sequencer.playTrack(trackOrLevelId);
    }
  }

  /**
   * Plays the designated 8-bit theme for a level.
   */
  public playLevelTrack(levelId: string): void {
    const track = getTrackForLevel(levelId);
    this.sequencer.playTrack(track);
  }

  public stopMusic(): void {
    this.sequencer.stop();
  }

  public pauseMusic(): void {
    this.sequencer.pause();
  }

  public resumeMusic(): void {
    this.sequencer.resume();
  }

  public isMusicPlaying(): boolean {
    return this.sequencer.isPlaying();
  }

  public getCurrentTrack(): MusicTrack | null {
    return this.sequencer.getCurrentTrack();
  }

  public setMasterVolume(vol: number): void {
    this.contextManager.setMasterVolume(vol);
  }

  public setSfxVolume(vol: number): void {
    this.contextManager.setSfxVolume(vol);
  }

  public setBgmVolume(vol: number): void {
    this.contextManager.setBgmVolume(vol);
  }

  public getMasterVolume(): number {
    return this.contextManager.getMasterVolume();
  }

  public getSfxVolume(): number {
    return this.contextManager.getSfxVolume();
  }

  public getBgmVolume(): number {
    return this.contextManager.getBgmVolume();
  }

  public setMuted(muted: boolean): void {
    this.contextManager.setMuted(muted);
  }

  public isMuted(): boolean {
    return this.contextManager.isMuted();
  }

  public toggleMute(): boolean {
    const nextMuted = this.contextManager.toggleMute();
    return nextMuted;
  }

  /**
   * Synchronizes volume and settings changes with SettingsManager.
   */
  public bindSettingsManager(settings: SettingsManager): void {
    // Apply current settings
    this.setMasterVolume(settings.get('masterVolume') ?? 0.8);
    this.setSfxVolume(settings.get('sfxVolume') ?? 0.8);
    this.setBgmVolume(settings.get('bgmVolume') ?? 0.7);

    this.unsubs.push(
      settings.onChange('masterVolume', (v) => this.setMasterVolume(v)),
      settings.onChange('sfxVolume', (v) => this.setSfxVolume(v)),
      settings.onChange('bgmVolume', (v) => this.setBgmVolume(v))
    );
  }

  /**
   * Listens to EngineEvents and automatically triggers corresponding SFX / music tracks.
   */
  public bindEventBus(eventBus: EventBus): void {
    this.unsubs.push(
      // Level transition -> Change BGM
      eventBus.on('LEVEL_LOADED', (data: { levelId: string }) => {
        if (data && data.levelId) {
          this.playLevelTrack(data.levelId);
        }
      }),

      // Wave & Combat events
      eventBus.on('WAVE_STARTED', () => {
        this.playSfx('wave_start');
      }),

      eventBus.on('WAVE_COMPLETED', () => {
        this.playSfx('wave_complete');
      }),

      eventBus.on('CREEP_KILLED', (data) => {
        if (data?.creepType === 'boss') {
          this.playSfx('creep_death_boss');
        } else {
          this.playSfx('creep_death');
        }
      }),

      eventBus.on('BASE_BREACH', () => {
        this.playSfx('base_breach');
      }),

      // Tower economy & upgrade events
      eventBus.on('TOWER_UPGRADED', () => {
        this.playSfx('tower_upgrade');
      }),

      eventBus.on('TOWER_SOLD', () => {
        this.playSfx('tower_sell');
      }),

      // Victory & Game Over
      eventBus.on('VICTORY', () => {
        this.playSfx('victory');
      }),

      eventBus.on('GAME_OVER', () => {
        this.playSfx('game_over');
      })
    );
  }

  public destroy(): void {
    for (const unsub of this.unsubs) {
      unsub();
    }
    this.unsubs = [];
    this.sequencer.destroy();
    this.contextManager.destroy();
    if (AudioManager.instance === this) {
      AudioManager.instance = null;
    }
  }
}
