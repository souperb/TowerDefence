/**
 * ModernSynth
 * Modern procedural synthesizer for rich electronic, synthwave, ambient, and
 * cinematic soundtracks using the Web Audio API.
 *
 * Features:
 * - Dual-oscillator detuned unison for warm supersaw leads and lush pads
 * - Resonant multi-mode biquad filtering with dynamic filter envelopes
 * - Dedicated modern electronic drum synthesis (punchy 808-style kicks, crisp layered snares, metallic hats)
 * - Smooth exponential ADSR envelopes and subtle vibrato / pitch bends
 */

import { WaveformType, ModernInstrumentType } from './types';

export interface ModernToneOptions {
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
  filterQ?: number;
  detune?: number;
  instrument?: ModernInstrumentType | string;
}

export class ModernSynth {
  private ctx: AudioContext;
  private noiseBuffer: AudioBuffer | null = null;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.initNoiseBuffer();
  }

  private initNoiseBuffer(): void {
    if (!this.ctx) return;
    try {
      const bufferSize = this.ctx.sampleRate * 2;
      this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
    } catch {
      // Audio context error in test environment
    }
  }

  /**
   * Plays a modern synth voice or electronic drum hit.
   */
  public playTone(
    freq: number,
    destination: AudioNode,
    options: ModernToneOptions = {}
  ): void {
    if (!this.ctx) return;

    const instrument = options.instrument;

    // Route dedicated modern drum instruments
    if (
      instrument === 'modern-kick' ||
      instrument === 'modern-snare' ||
      instrument === 'modern-hihat' ||
      instrument === 'modern-openhat'
    ) {
      this.playModernDrum(destination, instrument, options);
      return;
    }

    if (options.waveform === 'noise') {
      this.playModernNoise(destination, options);
      return;
    }

    if (freq <= 0) return;

    const startTime = options.startTime ?? this.ctx.currentTime;
    const duration = options.duration ?? 0.25;
    const volume = Math.max(0, Math.min(1, options.volume ?? 0.5));
    const waveform = options.waveform ?? 'sawtooth';

    try {
      const mainGain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // Configure Filter
      const defaultCutoff =
        waveform === 'sine' || waveform === 'triangle'
          ? 2000
          : instrument === 'modern-pad'
          ? 1600
          : instrument === 'modern-bass' || instrument === 'modern-sub'
          ? 800
          : 3500;

      filter.type = options.filterType ?? 'lowpass';
      const cutoffFreq = options.filterCutoff ?? defaultCutoff;
      filter.frequency.setValueAtTime(cutoffFreq, startTime);
      filter.Q.setValueAtTime(options.filterQ ?? (waveform === 'sawtooth' ? 2 : 1), startTime);

      // ADSR Envelopes
      let attack = options.attack ?? (instrument === 'modern-pad' ? 0.08 : 0.01);
      let decay = options.decay ?? 0.12;
      let sustain = options.sustain ?? 0.65;
      let release = options.release ?? (instrument === 'modern-pad' ? 0.12 : 0.06);

      if (instrument === 'modern-pluck') {
        attack = 0.005;
        decay = 0.1;
        sustain = 0.15;
        release = 0.08;
        // Dynamic filter pluck envelope
        filter.frequency.setValueAtTime(cutoffFreq * 2.5, startTime);
        filter.frequency.exponentialRampToValueAtTime(
          Math.max(100, cutoffFreq * 0.4),
          startTime + Math.min(duration, 0.15)
        );
      }

      mainGain.gain.setValueAtTime(0.0001, startTime);
      mainGain.gain.linearRampToValueAtTime(volume, startTime + attack);
      mainGain.gain.linearRampToValueAtTime(volume * sustain, startTime + attack + decay);

      const releaseStart = Math.max(startTime + attack + decay, startTime + duration - release);
      mainGain.gain.setValueAtTime(volume * sustain, releaseStart);
      mainGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      // Oscillators (Dual-oscillator detuned unison for modern rich width)
      const oscType: OscillatorType =
        waveform === 'pulse' ? 'sawtooth' : (waveform as OscillatorType);

      const osc1 = this.ctx.createOscillator();
      osc1.type = oscType;
      osc1.frequency.setValueAtTime(freq, startTime);

      // Handle pitch slides
      if (options.pitchSlide) {
        const slideDur = options.pitchSlide.duration ?? duration;
        osc1.frequency.exponentialRampToValueAtTime(
          Math.max(10, options.pitchSlide.targetFreq),
          startTime + slideDur
        );
      }

      // Handle arpeggios
      if (options.arpeggio && options.arpeggio.intervals.length > 0) {
        const intervals = options.arpeggio.intervals;
        const arpSpeed = options.arpeggio.speed ?? 0.04;
        let t = startTime;
        let step = 0;
        while (t < startTime + duration) {
          const semitone = intervals[step % intervals.length];
          const arpFreq = freq * Math.pow(2, semitone / 12);
          osc1.frequency.setValueAtTime(arpFreq, t);
          t += arpSpeed;
          step++;
        }
      }

      // Vibrato
      if (options.vibrato) {
        const vibOsc = this.ctx.createOscillator();
        const vibGain = this.ctx.createGain();
        vibOsc.frequency.setValueAtTime(options.vibrato.rate, startTime);
        vibGain.gain.setValueAtTime(options.vibrato.depth, startTime);
        vibOsc.connect(vibGain);
        vibGain.connect(osc1.frequency);
        vibOsc.start(startTime);
        vibOsc.stop(startTime + duration + 0.05);
      }

      osc1.connect(filter);
      osc1.start(startTime);
      osc1.stop(startTime + duration + 0.05);

      // Dual detuned unison layer for saw / lead / pad
      const shouldUnison =
        waveform === 'sawtooth' ||
        instrument === 'modern-lead' ||
        instrument === 'modern-pad';

      if (shouldUnison) {
        const osc2 = this.ctx.createOscillator();
        osc2.type = oscType;
        const detuneAmount = options.detune ?? (instrument === 'modern-pad' ? 8 : 6);
        const detunedFreq = freq * Math.pow(2, detuneAmount / 1200);
        osc2.frequency.setValueAtTime(detunedFreq, startTime);

        if (options.pitchSlide) {
          const slideDur = options.pitchSlide.duration ?? duration;
          const targetDetuned = options.pitchSlide.targetFreq * Math.pow(2, detuneAmount / 1200);
          osc2.frequency.exponentialRampToValueAtTime(
            Math.max(10, targetDetuned),
            startTime + slideDur
          );
        }

        osc2.connect(filter);
        osc2.start(startTime);
        osc2.stop(startTime + duration + 0.05);
      }

      filter.connect(mainGain);
      mainGain.connect(destination);
    } catch {
      // Audio graph error handled gracefully
    }
  }

  /**
   * Synthesizes modern electronic drums: punchy 808 kick, layered snare, hi-hats.
   */
  public playModernDrum(
    destination: AudioNode,
    drumType: ModernInstrumentType | string,
    options: ModernToneOptions = {}
  ): void {
    if (!this.ctx) return;

    const startTime = options.startTime ?? this.ctx.currentTime;
    const volume = Math.max(0, Math.min(1, options.volume ?? 0.5));

    try {
      if (drumType === 'modern-kick') {
        // Modern 808 Kick: Sub-sine pitch drop from 160Hz -> 42Hz + click transient
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(160, startTime);
        osc.frequency.exponentialRampToValueAtTime(42, startTime + 0.07);

        gain.gain.setValueAtTime(volume * 1.2, startTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.28);

        osc.connect(gain);
        gain.connect(destination);

        osc.start(startTime);
        osc.stop(startTime + 0.3);
      } else if (drumType === 'modern-snare') {
        // Modern Snare: Tonal body punch + Crisp band-passed noise snap
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(190, startTime);
        osc.frequency.exponentialRampToValueAtTime(75, startTime + 0.06);

        oscGain.gain.setValueAtTime(volume * 0.7, startTime);
        oscGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.12);

        osc.connect(oscGain);
        oscGain.connect(destination);
        osc.start(startTime);
        osc.stop(startTime + 0.15);

        if (this.noiseBuffer) {
          const noise = this.ctx.createBufferSource();
          noise.buffer = this.noiseBuffer;
          const noiseGain = this.ctx.createGain();
          const filter = this.ctx.createBiquadFilter();

          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(2400, startTime);
          filter.Q.setValueAtTime(1.5, startTime);

          noiseGain.gain.setValueAtTime(volume * 0.8, startTime);
          noiseGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.18);

          noise.connect(filter);
          filter.connect(noiseGain);
          noiseGain.connect(destination);

          noise.start(startTime);
          noise.stop(startTime + 0.2);
        }
      } else if (drumType === 'modern-hihat' || drumType === 'modern-openhat') {
        // Modern Hi-Hat: Crisp highpass noise
        if (this.noiseBuffer) {
          const noise = this.ctx.createBufferSource();
          noise.buffer = this.noiseBuffer;
          const noiseGain = this.ctx.createGain();
          const filter = this.ctx.createBiquadFilter();

          const isOpen = drumType === 'modern-openhat';
          const decay = isOpen ? 0.22 : 0.045;

          filter.type = 'highpass';
          filter.frequency.setValueAtTime(6500, startTime);

          noiseGain.gain.setValueAtTime(volume * (isOpen ? 0.45 : 0.35), startTime);
          noiseGain.gain.exponentialRampToValueAtTime(0.0001, startTime + decay);

          noise.connect(filter);
          filter.connect(noiseGain);
          noiseGain.connect(destination);

          noise.start(startTime);
          noise.stop(startTime + decay + 0.02);
        }
      }
    } catch {
      // Drum playback error handled gracefully
    }
  }

  /**
   * Plays filtered modern noise (e.g. sweeps or ambient risers).
   */
  public playModernNoise(
    destination: AudioNode,
    options: ModernToneOptions = {}
  ): void {
    if (!this.ctx || !this.noiseBuffer) return;

    const startTime = options.startTime ?? this.ctx.currentTime;
    const duration = options.duration ?? 0.15;
    const volume = options.volume ?? 0.3;

    try {
      const source = this.ctx.createBufferSource();
      source.buffer = this.noiseBuffer;

      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      filter.type = options.filterType ?? 'highpass';
      filter.frequency.setValueAtTime(options.filterCutoff ?? 3000, startTime);

      gain.gain.setValueAtTime(volume, startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(destination);

      source.start(startTime);
      source.stop(startTime + duration + 0.02);
    } catch {
      // Ignored in test mocks
    }
  }
}
