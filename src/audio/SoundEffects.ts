/**
 * SoundEffects
 * Procedural 8-bit sound effects for all game actions, combat, and UI interactions.
 */

import { AudioContextManager } from './AudioContextManager';
import { ChiptuneSynth, noteToFrequency } from './ChiptuneSynth';
import { SfxName } from './types';

export class SoundEffects {
  private audioManager: AudioContextManager;
  private synth: ChiptuneSynth | null = null;

  constructor(audioManager: AudioContextManager) {
    this.audioManager = audioManager;
  }

  private getSynth(): ChiptuneSynth | null {
    const ctx = this.audioManager.getContext();
    if (!ctx) return null;
    if (!this.synth) {
      this.synth = new ChiptuneSynth(ctx);
    }
    return this.synth;
  }

  public play(name: SfxName, options: { volumeScale?: number } = {}): void {
    const sfxGain = this.audioManager.getSfxGain();
    const synth = this.getSynth();
    if (!sfxGain || !synth || this.audioManager.isMuted()) return;

    const scale = options.volumeScale ?? 1.0;
    const now = this.audioManager.getCurrentTime();

    switch (name) {
      case 'tower_place':
        this.playTowerPlace(synth, sfxGain, now, scale);
        break;
      case 'tower_sell':
        this.playTowerSell(synth, sfxGain, now, scale);
        break;
      case 'tower_upgrade':
        this.playTowerUpgrade(synth, sfxGain, now, scale);
        break;
      case 'tower_fire_archer':
        this.playTowerFireArcher(synth, sfxGain, now, scale);
        break;
      case 'tower_fire_cannon':
        this.playTowerFireCannon(synth, sfxGain, now, scale);
        break;
      case 'tower_fire_mage':
        this.playTowerFireMage(synth, sfxGain, now, scale);
        break;
      case 'projectile_hit':
        this.playProjectileHit(synth, sfxGain, now, scale);
        break;
      case 'creep_death':
        this.playCreepDeath(synth, sfxGain, now, scale);
        break;
      case 'creep_death_boss':
        this.playCreepDeathBoss(synth, sfxGain, now, scale);
        break;
      case 'base_breach':
        this.playBaseBreach(synth, sfxGain, now, scale);
        break;
      case 'wave_start':
        this.playWaveStart(synth, sfxGain, now, scale);
        break;
      case 'wave_complete':
        this.playWaveComplete(synth, sfxGain, now, scale);
        break;
      case 'ui_click':
        this.playUiClick(synth, sfxGain, now, scale);
        break;
      case 'ui_select':
        this.playUiSelect(synth, sfxGain, now, scale);
        break;
      case 'victory':
        this.playVictory(synth, sfxGain, now, scale);
        break;
      case 'game_over':
        this.playGameOver(synth, sfxGain, now, scale);
        break;
    }
  }

  private playTowerPlace(synth: ChiptuneSynth, dest: AudioNode, now: number, scale: number): void {
    synth.playTone(noteToFrequency('C5'), dest, {
      waveform: 'square',
      startTime: now,
      duration: 0.06,
      volume: 0.35 * scale,
      decay: 0.05,
    });
    synth.playTone(noteToFrequency('G5'), dest, {
      waveform: 'square',
      startTime: now + 0.05,
      duration: 0.08,
      volume: 0.4 * scale,
      decay: 0.06,
    });
    synth.playNoise(dest, {
      startTime: now,
      duration: 0.05,
      volume: 0.15 * scale,
      filterCutoff: 3000,
      periodic: true,
    });
  }

  private playTowerSell(synth: ChiptuneSynth, dest: AudioNode, now: number, scale: number): void {
    const notes = ['E6', 'B5', 'G#5', 'E5'];
    notes.forEach((note, idx) => {
      synth.playTone(noteToFrequency(note), dest, {
        waveform: 'square',
        startTime: now + idx * 0.04,
        duration: 0.08,
        volume: 0.28 * scale,
        decay: 0.06,
      });
    });
  }

  private playTowerUpgrade(synth: ChiptuneSynth, dest: AudioNode, now: number, scale: number): void {
    const notes = ['C4', 'E4', 'G4', 'C5', 'E5', 'G5'];
    notes.forEach((note, idx) => {
      synth.playTone(noteToFrequency(note), dest, {
        waveform: 'pulse',
        startTime: now + idx * 0.045,
        duration: 0.1,
        volume: 0.32 * scale,
        decay: 0.07,
      });
    });
  }

  private playTowerFireArcher(synth: ChiptuneSynth, dest: AudioNode, now: number, scale: number): void {
    // Energy Lance high-frequency laser sweep
    synth.playTone(1300, dest, {
      waveform: 'sawtooth',
      startTime: now,
      duration: 0.09,
      volume: 0.22 * scale,
      pitchSlide: { targetFreq: 280, duration: 0.08 },
      decay: 0.08,
    });
  }

  private playTowerFireCannon(synth: ChiptuneSynth, dest: AudioNode, now: number, scale: number): void {
    // Heavy mortar concussive blast
    synth.playTone(180, dest, {
      waveform: 'triangle',
      startTime: now,
      duration: 0.2,
      volume: 0.45 * scale,
      pitchSlide: { targetFreq: 40, duration: 0.18 },
      decay: 0.18,
    });
    synth.playNoise(dest, {
      startTime: now,
      duration: 0.16,
      volume: 0.35 * scale,
      filterCutoff: 600,
      filterType: 'lowpass',
      decay: 0.15,
      periodic: true,
    });
  }

  private playTowerFireMage(synth: ChiptuneSynth, dest: AudioNode, now: number, scale: number): void {
    // Void disruptor resonance warble
    synth.playTone(noteToFrequency('C5'), dest, {
      waveform: 'square',
      startTime: now,
      duration: 0.14,
      volume: 0.25 * scale,
      arpeggio: { intervals: [0, 7, 12, 19], speed: 0.02 },
      decay: 0.12,
      filterCutoff: 2400,
    });
  }

  private playProjectileHit(synth: ChiptuneSynth, dest: AudioNode, now: number, scale: number): void {
    synth.playNoise(dest, {
      startTime: now,
      duration: 0.05,
      volume: 0.18 * scale,
      filterCutoff: 1800,
      filterType: 'bandpass',
      decay: 0.04,
      periodic: true,
    });
  }

  private playCreepDeath(synth: ChiptuneSynth, dest: AudioNode, now: number, scale: number): void {
    // Retro explosion + coin chime
    synth.playTone(320, dest, {
      waveform: 'sawtooth',
      startTime: now,
      duration: 0.12,
      volume: 0.25 * scale,
      pitchSlide: { targetFreq: 70, duration: 0.11 },
      decay: 0.1,
    });
    synth.playNoise(dest, {
      startTime: now,
      duration: 0.12,
      volume: 0.28 * scale,
      filterCutoff: 900,
      decay: 0.1,
    });
    synth.playTone(noteToFrequency('B5'), dest, {
      waveform: 'square',
      startTime: now + 0.05,
      duration: 0.08,
      volume: 0.2 * scale,
      decay: 0.06,
    });
  }

  private playCreepDeathBoss(synth: ChiptuneSynth, dest: AudioNode, now: number, scale: number): void {
    // Colossus destruction explosion
    synth.playTone(140, dest, {
      waveform: 'sawtooth',
      startTime: now,
      duration: 0.35,
      volume: 0.45 * scale,
      pitchSlide: { targetFreq: 30, duration: 0.32 },
      decay: 0.3,
    });
    synth.playNoise(dest, {
      startTime: now,
      duration: 0.35,
      volume: 0.5 * scale,
      filterCutoff: 500,
      decay: 0.32,
    });
    // Boss defeat fanfare chime
    const notes = ['G4', 'C5', 'E5', 'G5', 'C6'];
    notes.forEach((note, idx) => {
      synth.playTone(noteToFrequency(note), dest, {
        waveform: 'square',
        startTime: now + 0.1 + idx * 0.06,
        duration: 0.15,
        volume: 0.35 * scale,
        decay: 0.12,
      });
    });
  }

  private playBaseBreach(synth: ChiptuneSynth, dest: AudioNode, now: number, scale: number): void {
    // Harsh warning klaxon
    synth.playTone(noteToFrequency('F#2'), dest, {
      waveform: 'sawtooth',
      startTime: now,
      duration: 0.25,
      volume: 0.4 * scale,
      decay: 0.2,
    });
    synth.playTone(noteToFrequency('G2'), dest, {
      waveform: 'square',
      startTime: now,
      duration: 0.25,
      volume: 0.4 * scale,
      decay: 0.2,
    });
  }

  private playWaveStart(synth: ChiptuneSynth, dest: AudioNode, now: number, scale: number): void {
    // Ancient herald trumpet
    synth.playTone(noteToFrequency('D4'), dest, {
      waveform: 'square',
      startTime: now,
      duration: 0.1,
      volume: 0.35 * scale,
    });
    synth.playTone(noteToFrequency('A4'), dest, {
      waveform: 'square',
      startTime: now + 0.09,
      duration: 0.1,
      volume: 0.35 * scale,
    });
    synth.playTone(noteToFrequency('D5'), dest, {
      waveform: 'square',
      startTime: now + 0.18,
      duration: 0.28,
      volume: 0.45 * scale,
      decay: 0.24,
    });
  }

  private playWaveComplete(synth: ChiptuneSynth, dest: AudioNode, now: number, scale: number): void {
    const notes = ['C5', 'E5', 'G5', 'C6'];
    notes.forEach((note, idx) => {
      synth.playTone(noteToFrequency(note), dest, {
        waveform: 'square',
        startTime: now + idx * 0.05,
        duration: 0.12,
        volume: 0.25 * scale,
        decay: 0.1,
      });
    });
  }

  private playUiClick(synth: ChiptuneSynth, dest: AudioNode, now: number, scale: number): void {
    synth.playTone(noteToFrequency('E5'), dest, {
      waveform: 'square',
      startTime: now,
      duration: 0.03,
      volume: 0.2 * scale,
      decay: 0.025,
    });
  }

  private playUiSelect(synth: ChiptuneSynth, dest: AudioNode, now: number, scale: number): void {
    synth.playTone(noteToFrequency('A5'), dest, {
      waveform: 'square',
      startTime: now,
      duration: 0.04,
      volume: 0.18 * scale,
      decay: 0.035,
    });
  }

  private playVictory(synth: ChiptuneSynth, dest: AudioNode, now: number, scale: number): void {
    const melody = [
      { note: 'D4', time: 0, dur: 0.12 },
      { note: 'F4', time: 0.12, dur: 0.12 },
      { note: 'A4', time: 0.24, dur: 0.16 },
      { note: 'D5', time: 0.4, dur: 0.35 },
      { note: 'C5', time: 0.78, dur: 0.14 },
      { note: 'D5', time: 0.94, dur: 0.6 },
    ];
    melody.forEach((m) => {
      synth.playTone(noteToFrequency(m.note), dest, {
        waveform: 'square',
        startTime: now + m.time,
        duration: m.dur,
        volume: 0.35 * scale,
        decay: m.dur * 0.9,
      });
    });
  }

  private playGameOver(synth: ChiptuneSynth, dest: AudioNode, now: number, scale: number): void {
    const lament = [
      { note: 'F3', time: 0, dur: 0.25 },
      { note: 'E3', time: 0.26, dur: 0.25 },
      { note: 'D#3', time: 0.52, dur: 0.28 },
      { note: 'D3', time: 0.82, dur: 0.7 },
    ];
    lament.forEach((m) => {
      synth.playTone(noteToFrequency(m.note), dest, {
        waveform: 'triangle',
        startTime: now + m.time,
        duration: m.dur,
        volume: 0.45 * scale,
        decay: m.dur * 0.9,
      });
      synth.playTone(noteToFrequency(m.note), dest, {
        waveform: 'sawtooth',
        startTime: now + m.time,
        duration: m.dur,
        volume: 0.2 * scale,
        decay: m.dur * 0.8,
        filterCutoff: 600,
      });
    });
  }
}
