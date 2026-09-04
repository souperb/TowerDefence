/**
 * MusicSequencer
 * High-precision Web Audio tracker sequencer for multi-channel BGM.
 * Supports both modern electronic / synthwave synthesis and authentic 8-bit chiptune playback.
 * Uses a lookahead scheduler to schedule notes accurately on the AudioContext clock.
 */

import { AudioContextManager } from './AudioContextManager';
import { ChiptuneSynth, noteToFrequency } from './ChiptuneSynth';
import { ModernSynth } from './ModernSynth';
import { MusicTrack, NoteEvent } from './types';

export class MusicSequencer {
  private audioManager: AudioContextManager;
  private chiptuneSynth: ChiptuneSynth | null = null;
  private modernSynth: ModernSynth | null = null;

  private currentTrack: MusicTrack | null = null;
  private isPlayingTrack: boolean = false;
  private isPaused: boolean = false;

  // Sequencer playback state
  private currentStep: number = 0;
  private nextStepTime: number = 0;
  private scheduleIntervalId: any = null;

  // Timing configuration
  private readonly lookaheadMs = 35; // How frequently scheduler checks (ms)
  private readonly scheduleAheadTime = 0.12; // How far ahead to schedule audio (seconds)

  constructor(audioManager: AudioContextManager) {
    this.audioManager = audioManager;
  }

  private getChiptuneSynth(): ChiptuneSynth | null {
    const ctx = this.audioManager.getContext();
    if (!ctx) return null;
    if (!this.chiptuneSynth) {
      this.chiptuneSynth = new ChiptuneSynth(ctx);
    }
    return this.chiptuneSynth;
  }

  private getModernSynth(): ModernSynth | null {
    const ctx = this.audioManager.getContext();
    if (!ctx) return null;
    if (!this.modernSynth) {
      this.modernSynth = new ModernSynth(ctx);
    }
    return this.modernSynth;
  }

  /**
   * Starts playing a music track. If a track is already playing, switches to the new one.
   */
  public playTrack(track: MusicTrack): void {
    const ctx = this.audioManager.getContext();
    if (!ctx) {
      this.currentTrack = track;
      this.isPlayingTrack = true;
      return;
    }

    // If same track object is already playing, do not restart
    if (this.currentTrack?.id === track.id && this.currentTrack?.style === track.style && this.isPlayingTrack && !this.isPaused) {
      return;
    }

    this.stop();
    this.currentTrack = track;
    this.isPlayingTrack = true;
    this.isPaused = false;
    this.currentStep = 0;
    this.nextStepTime = ctx.currentTime + 0.05;

    this.startScheduler();
  }

  /**
   * Pauses the music sequencer.
   */
  public pause(): void {
    if (!this.isPlayingTrack || this.isPaused) return;
    this.isPaused = true;
    this.stopScheduler();
  }

  /**
   * Resumes the music sequencer from paused state.
   */
  public resume(): void {
    if (!this.isPlayingTrack || !this.isPaused) return;
    const ctx = this.audioManager.getContext();
    if (ctx) {
      this.nextStepTime = ctx.currentTime + 0.05;
    }
    this.isPaused = false;
    this.startScheduler();
  }

  /**
   * Stops playback completely and resets position.
   */
  public stop(): void {
    this.stopScheduler();
    this.isPlayingTrack = false;
    this.isPaused = false;
    this.currentStep = 0;
  }

  public isPlaying(): boolean {
    return this.isPlayingTrack && !this.isPaused;
  }

  public getCurrentTrack(): MusicTrack | null {
    return this.currentTrack;
  }

  private startScheduler(): void {
    this.stopScheduler();
    this.scheduleIntervalId = setInterval(() => {
      this.schedulerTick();
    }, this.lookaheadMs);
  }

  private stopScheduler(): void {
    if (this.scheduleIntervalId !== null) {
      clearInterval(this.scheduleIntervalId);
      this.scheduleIntervalId = null;
    }
  }

  private schedulerTick(): void {
    const ctx = this.audioManager.getContext();
    if (!ctx || !this.currentTrack || !this.isPlayingTrack || this.isPaused) {
      return;
    }

    const bgmGain = this.audioManager.getBgmGain();
    if (!bgmGain) return;

    const isModern = this.currentTrack.style === 'modern';
    const chiptuneSynth = this.getChiptuneSynth();
    const modernSynth = this.getModernSynth();

    if (!chiptuneSynth || !modernSynth) return;

    const stepsPerBeat = this.currentTrack.stepsPerBeat ?? 4;
    const secondsPerBeat = 60 / this.currentTrack.bpm;
    const stepDuration = secondsPerBeat / stepsPerBeat;

    // Find the max step count across all channels
    let maxSteps = 0;
    for (const channel of this.currentTrack.channels) {
      if (channel.notes.length > maxSteps) {
        maxSteps = channel.notes.length;
      }
    }
    if (maxSteps === 0) return;

    // Schedule all notes within the lookahead window
    while (this.nextStepTime < ctx.currentTime + this.scheduleAheadTime) {
      this.scheduleStep(
        this.currentStep,
        this.nextStepTime,
        stepDuration,
        bgmGain,
        isModern,
        chiptuneSynth,
        modernSynth
      );

      this.nextStepTime += stepDuration;
      this.currentStep++;

      if (this.currentStep >= maxSteps) {
        if (this.currentTrack.loop !== false) {
          this.currentStep = 0;
        } else {
          this.stop();
          break;
        }
      }
    }
  }

  private scheduleStep(
    step: number,
    time: number,
    stepDuration: number,
    dest: AudioNode,
    isModernTrack: boolean,
    chiptuneSynth: ChiptuneSynth,
    modernSynth: ModernSynth
  ): void {
    if (!this.currentTrack) return;

    for (const channel of this.currentTrack.channels) {
      if (step >= channel.notes.length) continue;
      const rawNote = channel.notes[step];
      if (rawNote === null || rawNote === undefined || rawNote === '') continue;

      let noteVal: string | number | null = null;
      let durationSteps = 1;
      let noteVol = channel.volume ?? 0.3;
      let arpeggio: number[] | undefined;
      let slideTarget: string | number | undefined;
      let instrument = channel.instrument;
      let filterCutoff = channel.filterCutoff;
      let filterType = channel.filterType;
      let filterQ = channel.filterQ;
      let detune = channel.detune;
      let attack = channel.attack;
      let decay = channel.decay;
      let sustain = channel.sustain;
      let release = channel.release;

      if (typeof rawNote === 'object' && rawNote !== null) {
        const noteObj = rawNote as NoteEvent;
        noteVal = noteObj.note;
        durationSteps = noteObj.duration ?? 1;
        if (noteObj.volume !== undefined) {
          noteVol *= noteObj.volume;
        }
        arpeggio = noteObj.arpeggio;
        slideTarget = noteObj.slide;
        if (noteObj.instrument) instrument = noteObj.instrument;
        if (noteObj.filterCutoff !== undefined) filterCutoff = noteObj.filterCutoff;
        if (noteObj.filterType !== undefined) filterType = noteObj.filterType;
        if (noteObj.filterQ !== undefined) filterQ = noteObj.filterQ;
        if (noteObj.detune !== undefined) detune = noteObj.detune;
        if (noteObj.attack !== undefined) attack = noteObj.attack;
        if (noteObj.decay !== undefined) decay = noteObj.decay;
        if (noteObj.sustain !== undefined) sustain = noteObj.sustain;
        if (noteObj.release !== undefined) release = noteObj.release;
      } else {
        noteVal = rawNote;
      }

      if (noteVal === null || noteVal === '-') continue;

      const freq = noteToFrequency(noteVal);
      const isDrum =
        instrument === 'modern-kick' ||
        instrument === 'modern-snare' ||
        instrument === 'modern-hihat' ||
        instrument === 'modern-openhat';

      if (freq <= 0 && channel.waveform !== 'noise' && !isDrum) continue;

      const noteDuration = stepDuration * durationSteps * 0.95;

      if (isModernTrack || isDrum || instrument) {
        modernSynth.playTone(freq, dest, {
          waveform: channel.waveform,
          startTime: time,
          duration: noteDuration,
          volume: noteVol,
          pitchSlide: slideTarget
            ? { targetFreq: noteToFrequency(slideTarget), duration: noteDuration }
            : undefined,
          arpeggio: arpeggio ? { intervals: arpeggio, speed: 0.04 } : undefined,
          attack,
          decay: decay ?? Math.min(noteDuration * 0.9, 0.3),
          sustain,
          release,
          filterCutoff,
          filterType,
          filterQ,
          detune,
          instrument,
        });
      } else {
        chiptuneSynth.playTone(freq, dest, {
          waveform: channel.waveform,
          startTime: time,
          duration: noteDuration,
          volume: noteVol,
          pitchSlide: slideTarget
            ? { targetFreq: noteToFrequency(slideTarget), duration: noteDuration }
            : undefined,
          arpeggio: arpeggio ? { intervals: arpeggio, speed: 0.03 } : undefined,
          decay: Math.min(noteDuration * 0.9, 0.25),
        });
      }
    }
  }

  public destroy(): void {
    this.stop();
    this.currentTrack = null;
    this.chiptuneSynth = null;
    this.modernSynth = null;
  }
}
