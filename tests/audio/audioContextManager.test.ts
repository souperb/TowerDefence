import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AudioContextManager } from '../../src/audio/AudioContextManager';

describe('AudioContextManager', () => {
  let audioManager: AudioContextManager;

  beforeEach(() => {
    audioManager = new AudioContextManager();
  });

  afterEach(() => {
    audioManager.destroy();
  });

  it('should initialize gain nodes and manage volume levels', () => {
    expect(audioManager.getMasterVolume()).toBe(0.8);
    expect(audioManager.getSfxVolume()).toBe(0.8);
    expect(audioManager.getBgmVolume()).toBe(0.7);
    expect(audioManager.isMuted()).toBe(false);

    audioManager.setMasterVolume(0.5);
    audioManager.setSfxVolume(0.4);
    audioManager.setBgmVolume(0.3);

    expect(audioManager.getMasterVolume()).toBe(0.5);
    expect(audioManager.getSfxVolume()).toBe(0.4);
    expect(audioManager.getBgmVolume()).toBe(0.3);
  });

  it('should clamp volume between 0 and 1', () => {
    audioManager.setMasterVolume(1.5);
    expect(audioManager.getMasterVolume()).toBe(1.0);

    audioManager.setSfxVolume(-0.5);
    expect(audioManager.getSfxVolume()).toBe(0.0);
  });

  it('should toggle and update mute state', () => {
    expect(audioManager.isMuted()).toBe(false);
    const muted = audioManager.toggleMute();
    expect(muted).toBe(true);
    expect(audioManager.isMuted()).toBe(true);

    audioManager.toggleMute();
    expect(audioManager.isMuted()).toBe(false);
  });

  it('should unlock audio context on resume', async () => {
    const success = await audioManager.unlock();
    expect(success).toBe(true);
    expect(audioManager.isContextRunning()).toBe(true);
  });
});
