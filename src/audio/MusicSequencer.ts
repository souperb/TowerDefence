/**
 * MusicSequencer
 * High-precision Web Audio tracker sequencer for multi-channel 8-bit chiptune BGM.
 * Uses a lookahead scheduler to schedule notes accurately on the AudioContext clock.
 */

import { AudioContextManager } from './AudioContextManager';
import { ChiptuneSynth, noteToFrequency } from './ChiptuneSynth';
import { MusicTrack, NoteEvent } from './types';

export class MusicSequencer {
  private audioManager: AudioContextManager;
  private synth: ChiptuneSynth | null = null;

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

  private getSynth(): ChiptuneSynth | null {
    const ctx = this.audioManager.getContext();
    if (!ctx) return null;
    if (!this.synth) {
      this.synth = new ChiptuneSynth(ctx);
    }
    return this.synth;
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

    // If same track is already playing, do not restart
    if (this.currentTrack?.id === track.id && this.isPlayingTrack && !this.isPaused) {
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
    const synth = this.getSynth();
    if (!bgmGain || !synth) return;

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
      this.scheduleStep(this.currentStep, this.nextStepTime, stepDuration, bgmGain, synth);

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
    synth: ChiptuneSynth
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

      if (typeof rawNote === 'object' && rawNote !== null) {
        const noteObj = rawNote as NoteEvent;
        noteVal = noteObj.note;
        durationSteps = noteObj.duration ?? 1;
        if (noteObj.volume !== undefined) {
          noteVol *= noteObj.volume;
        }
        arpeggio = noteObj.arpeggio;
        slideTarget = noteObj.slide;
      } else {
        noteVal = rawNote;
      }

      if (noteVal === null || noteVal === '-') continue;

      const freq = noteToFrequency(noteVal);
      if (freq <= 0 && channel.waveform !== 'noise') continue;

      const noteDuration = stepDuration * durationSteps * 0.95;

      synth.playTone(freq, dest, {
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

  public destroy(): void {
    this.stop();
    this.currentTrack = null;
    this.synth = null;
  }
}
