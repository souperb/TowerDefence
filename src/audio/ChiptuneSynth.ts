/**
 * ChiptuneSynth
 * Procedural 8-bit synthesizer for authentic NES / PSG / GameBoy style sounds
 * using the Web Audio API. Supports pulse/square, triangle, noise, pitch slides,
 * arpeggios, and hardware-style envelope modulation.
 */

import { WaveformType } from './types';

const NOTE_NAMES: Record<string, number> = {
  C: 0,
  'C#': 1,
  DB: 1,
  D: 2,
  'D#': 3,
  EB: 3,
  E: 4,
  F: 5,
  'F#': 6,
  GB: 6,
  G: 7,
  'G#': 8,
  AB: 8,
  A: 9,
  'A#': 10,
  BB: 10,
  B: 11,
};

/**
 * Converts a note string (e.g. "C4", "F#3", "Eb5") or MIDI number to frequency in Hz.
 */
export function noteToFrequency(note: string | number | null | undefined): number {
  if (note === null || note === undefined || note === '' || note === '-') {
    return 0;
  }
  if (typeof note === 'number') {
    return 440 * Math.pow(2, (note - 69) / 12);
  }

  const trimmed = note.trim().toUpperCase();
  const match = trimmed.match(/^([A-G][#B]?)(-?\d+)$/);
  if (!match) {
    const parsed = parseFloat(trimmed);
    return isNaN(parsed) ? 0 : parsed;
  }

  const pitchName = match[1];
  const octave = parseInt(match[2], 10);
  const semitone = NOTE_NAMES[pitchName] ?? 0;
  const midi = (octave + 1) * 12 + semitone;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export interface ToneOptions {
  waveform?: WaveformType;
  startTime?: number;
  duration?: number;
  volume?: number;
  pitchSlide?: { targetFreq: number; duration?: number };
  arpeggio?: { intervals: number[]; speed?: number };
  vibrato?: { rate: number; depth: number };
  attack?: number;
  decay?: number;
  sustain?: number;
  release?: number;
  filterCutoff?: number;
  filterType?: BiquadFilterType;
}

export class ChiptuneSynth {
  private ctx: AudioContext;
  private noiseBuffer: AudioBuffer | null = null;
  private periodicNoiseBuffer: AudioBuffer | null = null;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.initNoiseBuffers();
  }

  /**
   * Generates authentic 8-bit style noise buffers for snare, hi-hats, explosions.
   */
  private initNoiseBuffers(): void {
    if (!this.ctx) return;
    try {
      const bufferSize = this.ctx.sampleRate * 2;
      this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = this.noiseBuffer.getChannelData(0);

      // White noise buffer
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      // 8-bit periodic / pseudo-random LFSR emulation (GameBoy / NES metallic noise)
      this.periodicNoiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const periodicOutput = this.periodicNoiseBuffer.getChannelData(0);
      let lfsr = 0x7fff;
      for (let i = 0; i < bufferSize; i++) {
        const bit = ((lfsr >> 0) ^ (lfsr >> 6)) & 1;
        lfsr = (lfsr >> 1) | (bit << 14);
        periodicOutput[i] = (lfsr & 1) ? 1.0 : -1.0;
      }
    } catch {
      // Ignore in headless / mock test environments
    }
  }

  /**
   * Plays a single note / tone routed to the destination node.
   */
  public playTone(
    freq: number,
    destination: AudioNode,
    options: ToneOptions = {}
  ): void {
    if (!this.ctx || freq <= 0) return;

    const startTime = options.startTime ?? this.ctx.currentTime;
    const duration = options.duration ?? 0.15;
    const volume = Math.max(0, Math.min(1, options.volume ?? 0.5));
    const waveform = options.waveform ?? 'square';

    if (waveform === 'noise') {
      this.playNoise(destination, {
        startTime,
        duration,
        volume,
        filterCutoff: options.filterCutoff,
        filterType: options.filterType,
        decay: options.decay,
      });
      return;
    }

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Configure waveform
      if (waveform === 'pulse') {
        osc.type = 'sawtooth'; // punchy bright lead timbre
      } else {
        osc.type = waveform as OscillatorType;
      }

      osc.frequency.setValueAtTime(freq, startTime);

      // Handle pitch slides (portamento / laser sweep)
      if (options.pitchSlide) {
        const slideDuration = options.pitchSlide.duration ?? duration;
        osc.frequency.exponentialRampToValueAtTime(
          Math.max(10, options.pitchSlide.targetFreq),
          startTime + slideDuration
        );
      }

      // Handle arpeggios (rapid semitone cycling in classic chiptune style)
      if (options.arpeggio && options.arpeggio.intervals.length > 0) {
        const intervals = options.arpeggio.intervals;
        const arpSpeed = options.arpeggio.speed ?? 0.035; // ~30ms per step
        let t = startTime;
        let step = 0;
        while (t < startTime + duration) {
          const semitone = intervals[step % intervals.length];
          const arpFreq = freq * Math.pow(2, semitone / 12);
          osc.frequency.setValueAtTime(arpFreq, t);
          t += arpSpeed;
          step++;
        }
      }

      // Handle Vibrato
      if (options.vibrato) {
        const vibratoOsc = this.ctx.createOscillator();
        const vibratoGain = this.ctx.createGain();
        vibratoOsc.frequency.setValueAtTime(options.vibrato.rate, startTime);
        vibratoGain.gain.setValueAtTime(options.vibrato.depth, startTime);
        vibratoOsc.connect(vibratoGain);
        vibratoGain.connect(osc.frequency);
        vibratoOsc.start(startTime);
        vibratoOsc.stop(startTime + duration + 0.05);
      }

      // Envelope ADSR
      const attack = options.attack ?? 0.005;
      const decay = options.decay ?? 0.08;
      const sustain = options.sustain ?? 0.6;
      const release = options.release ?? 0.05;

      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(volume, startTime + attack);
      gain.gain.linearRampToValueAtTime(volume * sustain, startTime + attack + decay);

      const releaseStart = Math.max(startTime + attack + decay, startTime + duration - release);
      gain.gain.setValueAtTime(volume * sustain, releaseStart);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      // Optional filter (e.g. lowpass for subterranean / dark vibe)
      if (options.filterCutoff) {
        const filter = this.ctx.createBiquadFilter();
        filter.type = options.filterType ?? 'lowpass';
        filter.frequency.setValueAtTime(options.filterCutoff, startTime);
        osc.connect(gain);
        gain.connect(filter);
        filter.connect(destination);
      } else {
        osc.connect(gain);
        gain.connect(destination);
      }

      osc.start(startTime);
      osc.stop(startTime + duration + 0.05);
    } catch {
      // Audio graph creation error ignored
    }
  }

  /**
   * Plays chiptune noise burst (percussion / hit / explosion).
   */
  public playNoise(
    destination: AudioNode,
    options: {
      startTime?: number;
      duration?: number;
      volume?: number;
      filterCutoff?: number;
      filterType?: BiquadFilterType;
      decay?: number;
      periodic?: boolean;
    } = {}
  ): void {
    if (!this.ctx) return;

    const buffer = options.periodic && this.periodicNoiseBuffer
      ? this.periodicNoiseBuffer
      : this.noiseBuffer;

    if (!buffer) return;

    try {
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;

      const gain = this.ctx.createGain();
      const startTime = options.startTime ?? this.ctx.currentTime;
      const duration = options.duration ?? 0.1;
      const volume = options.volume ?? 0.3;
      const decay = options.decay ?? duration;

      gain.gain.setValueAtTime(volume, startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + decay);

      if (options.filterCutoff) {
        const filter = this.ctx.createBiquadFilter();
        filter.type = options.filterType ?? 'lowpass';
        filter.frequency.setValueAtTime(options.filterCutoff, startTime);
        source.connect(filter);
        filter.connect(gain);
      } else {
        source.connect(gain);
      }

      gain.connect(destination);
      source.start(startTime);
      source.stop(startTime + duration);
    } catch {
      // Audio error ignored
    }
  }
}
