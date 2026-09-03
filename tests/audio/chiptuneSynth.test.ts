import { describe, it, expect } from 'vitest';
import { ChiptuneSynth, noteToFrequency } from '../../src/audio/ChiptuneSynth';

describe('ChiptuneSynth & Frequency Calculations', () => {
  it('should convert standard note names to correct frequencies', () => {
    expect(noteToFrequency('A4')).toBeCloseTo(440, 1);
    expect(noteToFrequency('A3')).toBeCloseTo(220, 1);
    expect(noteToFrequency('C4')).toBeCloseTo(261.63, 1);
    expect(noteToFrequency('C5')).toBeCloseTo(523.25, 1);
    expect(noteToFrequency('F#4')).toBeCloseTo(369.99, 1);
    expect(noteToFrequency('Eb4')).toBeCloseTo(311.13, 1);
  });

  it('should handle numeric MIDI note inputs and rests', () => {
    expect(noteToFrequency(69)).toBeCloseTo(440, 1);
    expect(noteToFrequency(60)).toBeCloseTo(261.63, 1);
    expect(noteToFrequency(null)).toBe(0);
    expect(noteToFrequency('-')).toBe(0);
    expect(noteToFrequency('')).toBe(0);
  });

  it('should play tones and noise bursts without errors', () => {
    const ctx = new AudioContext();
    const synth = new ChiptuneSynth(ctx);
    const dest = ctx.createGain();

    expect(() => {
      synth.playTone(440, dest, {
        waveform: 'square',
        duration: 0.1,
        volume: 0.5,
      });
    }).not.toThrow();

    expect(() => {
      synth.playTone(noteToFrequency('E4'), dest, {
        waveform: 'pulse',
        pitchSlide: { targetFreq: 880 },
        arpeggio: { intervals: [0, 3, 7] },
        vibrato: { rate: 5, depth: 10 },
      });
    }).not.toThrow();

    expect(() => {
      synth.playNoise(dest, {
        volume: 0.3,
        filterCutoff: 1000,
        periodic: true,
      });
    }).not.toThrow();
  });
});
