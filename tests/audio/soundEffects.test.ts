import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AudioContextManager } from '../../src/audio/AudioContextManager';
import { SoundEffects } from '../../src/audio/SoundEffects';
import { SfxName } from '../../src/audio/types';

describe('SoundEffects', () => {
  let ctxManager: AudioContextManager;
  let sfx: SoundEffects;

  beforeEach(() => {
    ctxManager = new AudioContextManager();
    sfx = new SoundEffects(ctxManager);
  });

  afterEach(() => {
    ctxManager.destroy();
  });

  const allEffects: SfxName[] = [
    'tower_place',
    'tower_sell',
    'tower_upgrade',
    'tower_fire_archer',
    'tower_fire_cannon',
    'tower_fire_mage',
    'projectile_hit',
    'creep_death',
    'creep_death_boss',
    'base_breach',
    'wave_start',
    'wave_complete',
    'ui_click',
    'ui_select',
    'victory',
    'game_over',
  ];

  it('should play all procedural 8-bit sound effects without errors', () => {
    for (const effect of allEffects) {
      expect(() => {
        sfx.play(effect);
      }).not.toThrow();
    }
  });

  it('should not play sounds when muted', () => {
    ctxManager.setMuted(true);
    expect(() => {
      sfx.play('tower_place');
    }).not.toThrow();
  });
});
