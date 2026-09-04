/**
 * Audio types and interfaces for the chiptune and modern synthesizer audio system.
 */

export type SfxName =
  | 'tower_place'
  | 'tower_sell'
  | 'tower_upgrade'
  | 'tower_fire_archer'
  | 'tower_fire_cannon'
  | 'tower_fire_mage'
  | 'projectile_hit'
  | 'creep_death'
  | 'creep_death_boss'
  | 'base_breach'
  | 'wave_start'
  | 'wave_complete'
  | 'ui_click'
  | 'ui_select'
  | 'victory'
  | 'game_over';

export type WaveformType = 'square' | 'sawtooth' | 'triangle' | 'sine' | 'noise' | 'pulse';

export type SoundtrackMode = 'modern' | '8bit';

export type ModernInstrumentType =
  | 'modern-lead'
  | 'modern-pad'
  | 'modern-bass'
  | 'modern-sub'
  | 'modern-pluck'
  | 'modern-kick'
  | 'modern-snare'
  | 'modern-hihat'
  | 'modern-openhat';

export interface NoteEvent {
  note: string | number | null; // e.g. "C4", "D#4", 60 (MIDI), or null for rest
  duration?: number; // duration in step subdivisions (default: 1)
  volume?: number; // 0.0 to 1.0
  slide?: string | number; // Target note to slide pitch to
  vibrato?: { speed: number; depth: number };
  arpeggio?: number[]; // Semitone offsets e.g. [0, 3, 7] for minor chord
  detune?: number; // Detune in cents
  filterCutoff?: number;
  filterType?: BiquadFilterType;
  filterQ?: number;
  attack?: number;
  decay?: number;
  sustain?: number;
  release?: number;
  instrument?: ModernInstrumentType | string;
}

export interface TrackChannel {
  name: string;
  waveform: WaveformType;
  volume?: number;
  dutyCycle?: number; // For pulse wave simulation
  pan?: number; // -1.0 to 1.0
  filterCutoff?: number;
  filterType?: BiquadFilterType;
  filterQ?: number;
  attack?: number;
  decay?: number;
  sustain?: number;
  release?: number;
  detune?: number;
  instrument?: ModernInstrumentType | string;
  notes: Array<NoteEvent | string | number | null>;
}

export interface MusicTrack {
  id: string;
  name: string;
  subtitle?: string;
  bpm: number;
  stepsPerBeat?: number; // Default: 4 (16th notes)
  loop?: boolean;
  style?: 'chiptune' | 'modern';
  channels: TrackChannel[];
}

export interface AudioSettingsState {
  masterVolume: number;
  sfxVolume: number;
  bgmVolume: number;
  muted: boolean;
  soundtrack: SoundtrackMode;
}
