import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AudioManager } from '../../src/audio/AudioManager';
import { EventBus } from '../../src/core/events/EngineEvents';
import { SettingsManager } from '../../src/storage/SettingsManager';
import { StorageService } from '../../src/storage/StorageService';
import { TRACK_LEVEL_1 } from '../../src/audio/MusicTracks';

describe('AudioManager', () => {
  let eventBus: EventBus;
  let settingsManager: SettingsManager;
  let audioManager: AudioManager;

  beforeEach(() => {
    eventBus = new EventBus();
    settingsManager = new SettingsManager(new StorageService());
    audioManager = new AudioManager({
      eventBus,
      settingsManager,
      initialLevelId: 'level-1',
    });
  });

  afterEach(() => {
    audioManager.destroy();
  });

  it('should initialize with level 1 track and sync with settings manager', () => {
    expect(audioManager.getCurrentTrack()?.id).toBe('level-1');
    expect(audioManager.getMasterVolume()).toBe(settingsManager.get('masterVolume'));
    expect(audioManager.getSfxVolume()).toBe(settingsManager.get('sfxVolume'));
    expect(audioManager.getBgmVolume()).toBe(settingsManager.get('bgmVolume'));
  });

  it('should update volume levels when settings manager changes', () => {
    settingsManager.setMasterVolume(0.42);
    expect(audioManager.getMasterVolume()).toBeCloseTo(0.42, 2);

    settingsManager.setSfxVolume(0.65);
    expect(audioManager.getSfxVolume()).toBeCloseTo(0.65, 2);

    settingsManager.setBgmVolume(0.35);
    expect(audioManager.getBgmVolume()).toBeCloseTo(0.35, 2);
  });

  it('should switch track when LEVEL_LOADED event is emitted', () => {
    expect(audioManager.getCurrentTrack()?.id).toBe('level-1');
    eventBus.emit('LEVEL_LOADED', { levelId: 'level-2' });
    expect(audioManager.getCurrentTrack()?.id).toBe('level-2');
  });

  it('should play SFX on game events without errors', () => {
    const sfxSpy = vi.spyOn(audioManager.sfx, 'play');

    eventBus.emit('WAVE_STARTED', { waveIndex: 0 });
    expect(sfxSpy).toHaveBeenCalledWith('wave_start', expect.anything());

    eventBus.emit('WAVE_COMPLETED', { waveIndex: 0 });
    expect(sfxSpy).toHaveBeenCalledWith('wave_complete', expect.anything());

    eventBus.emit('CREEP_KILLED', {
      entity: 1 as any,
      creepType: 'basic',
      bountyGold: 10,
      scoreValue: 20,
      position: { x: 0, y: 0 },
    });
    expect(sfxSpy).toHaveBeenCalledWith('creep_death', expect.anything());

    eventBus.emit('CREEP_KILLED', {
      entity: 2 as any,
      creepType: 'boss',
      bountyGold: 100,
      scoreValue: 500,
      position: { x: 0, y: 0 },
    });
    expect(sfxSpy).toHaveBeenCalledWith('creep_death_boss', expect.anything());

    eventBus.emit('BASE_BREACH', {
      entity: 3 as any,
      creepType: 'tank',
      damageToBase: 1,
      remainingHp: 19,
    });
    expect(sfxSpy).toHaveBeenCalledWith('base_breach', expect.anything());

    eventBus.emit('TOWER_UPGRADED', {
      entity: 4 as any,
      towerType: 'archer',
      newTier: 2,
      previousTier: 1,
      upgradeCost: 75,
      totalInvestedCost: 175,
      damage: 15,
      range: 120,
      fireRate: 1.5,
      splashRadius: 0,
      gridX: 2,
      gridY: 3,
    });
    expect(sfxSpy).toHaveBeenCalledWith('tower_upgrade', expect.anything());

    eventBus.emit('TOWER_SOLD', {
      entity: 4 as any,
      towerType: 'archer',
      tier: 2,
      refundGold: 120,
      totalInvestedCost: 175,
      gridX: 2,
      gridY: 3,
    });
    expect(sfxSpy).toHaveBeenCalledWith('tower_sell', expect.anything());

    eventBus.emit('VICTORY', {
      finalScore: 1000,
      livesRemaining: 20,
      totalWaves: 10,
      stars: 3,
    });
    expect(sfxSpy).toHaveBeenCalledWith('victory', expect.anything());

    eventBus.emit('GAME_OVER', {
      finalScore: 500,
      waveReached: 5,
      totalWaves: 10,
    });
    expect(sfxSpy).toHaveBeenCalledWith('game_over', expect.anything());
  });

  it('should support play/pause/resume/stop of music', () => {
    audioManager.playMusic(TRACK_LEVEL_1);
    expect(audioManager.isMusicPlaying()).toBe(true);

    audioManager.pauseMusic();
    expect(audioManager.isMusicPlaying()).toBe(false);

    audioManager.resumeMusic();
    expect(audioManager.isMusicPlaying()).toBe(true);

    audioManager.stopMusic();
    expect(audioManager.isMusicPlaying()).toBe(false);
  });
});
