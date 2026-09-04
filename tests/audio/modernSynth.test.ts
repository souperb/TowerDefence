import { describe, it, expect } from 'vitest';
import { ModernSynth } from '../../src/audio/ModernSynth';
import { noteToFrequency } from '../../src/audio/ChiptuneSynth';

describe('ModernSynth', () => {
  it('should play modern tones with varied instruments without errors', () => {
    const ctx = new AudioContext();
    const synth = new ModernSynth(ctx);
    const dest = ctx.createGain();

    expect(() => {
      synth.playTone(noteToFrequency('E4'), dest, {
        waveform: 'sawtooth',
        instrument: 'modern-lead',
        filterCutoff: 3500,
        filterQ: 2,
        detune: 8,
      });
    }).not.toThrow();

    expect(() => {
      synth.playTone(noteToFrequency('C3'), dest, {
        waveform: 'sine',
        instrument: 'modern-pad',
        attack: 0.1,
        release: 0.2,
      });
    }).not.toThrow();

    expect(() => {
      synth.playTone(noteToFrequency('G2'), dest, {
        waveform: 'triangle',
        instrument: 'modern-sub',
        filterCutoff: 600,
      });
    }).not.toThrow();

    expect(() => {
      synth.playTone(noteToFrequency('A3'), dest, {
        waveform: 'sawtooth',
        instrument: 'modern-pluck',
        pitchSlide: { targetFreq: 440 },
        vibrato: { rate: 6, depth: 8 },
        arpeggio: { intervals: [0, 3, 7] },
      });
    }).not.toThrow();
  });

  it('should synthesize modern drum instruments without errors', () => {
    const ctx = new AudioContext();
    const synth = new ModernSynth(ctx);
    const dest = ctx.createGain();

    expect(() => {
      synth.playTone(0, dest, { instrument: 'modern-kick', volume: 0.6 });
    }).not.toThrow();

    expect(() => {
      synth.playTone(0, dest, { instrument: 'modern-snare', volume: 0.5 });
    }).not.toThrow();

    expect(() => {
      synth.playTone(0, dest, { instrument: 'modern-hihat', volume: 0.3 });
    }).not.toThrow();

    expect(() => {
      synth.playTone(0, dest, { instrument: 'modern-openhat', volume: 0.4 });
    }).not.toThrow();

    expect(() => {
      synth.playTone(0, dest, { waveform: 'noise', filterCutoff: 4000, volume: 0.2 });
    }).not.toThrow();
  });
});
