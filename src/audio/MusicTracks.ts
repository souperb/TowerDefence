/**
 * MusicTracks
 * Dual-soundtrack compositions for each level in Tower Defence:
 * 1. Modern Electronic / Synthwave / Cinematic OST (rich synth pads, detuned leads, punchy 808 kicks, crisp snares)
 * 2. Authentic 8-Bit Chiptune OST (NES/GameBoy style pulse, triangle bass, retro arpeggios, LFSR noise)
 *
 * Inspired by the decaying, archaic, and neon-tinged atmosphere of Gene Wolfe's
 * 'The Book of the New Sun' and the Dying Earth genre.
 */

import { MusicTrack, SoundtrackMode } from './types';

// ============================================================================
// 8-BIT CHIPTUNE SOUNDTRACK (ORIGINAL RETRO SOUNDTRACK)
// ============================================================================

// Level 1: Emerald Plains ("The Verdant Necropolis of Gyoll") - 8-Bit
export const CHIPTUNE_TRACK_LEVEL_1: MusicTrack = {
  id: 'level-1',
  name: 'Verdant Necropolis',
  subtitle: 'Lament for Gyoll (8-Bit)',
  bpm: 92,
  stepsPerBeat: 4,
  loop: true,
  style: 'chiptune',
  channels: [
    {
      name: 'Pulse 1 - Lead',
      waveform: 'square',
      volume: 0.38,
      notes: [
        'E4', null, 'G4', null, 'B4', null, 'A4', null,
        'G4', null, 'F#4', null, 'E4', null, null, null,
        'D4', null, 'F#4', null, 'A4', null, 'B4', null,
        'C5', null, 'B4', 'A4', 'G4', 'F#4', 'E4', null,

        'B4', null, 'D5', null, 'E5', null, 'D5', null,
        'B4', null, 'G4', null, 'A4', null, null, null,
        'F#4', null, 'G4', null, 'A4', null, 'B4', null,
        'G4', null, 'F#4', null, 'E4', null, null, null,
      ],
    },
    {
      name: 'Pulse 2 - Arp',
      waveform: 'pulse',
      volume: 0.22,
      notes: [
        'E3', 'G3', 'B3', 'E4', 'E3', 'G3', 'B3', 'E4',
        'C3', 'E3', 'G3', 'C4', 'C3', 'E3', 'G3', 'C4',
        'D3', 'F#3', 'A3', 'D4', 'D3', 'F#3', 'A3', 'D4',
        'B2', 'D#3', 'F#3', 'B3', 'B2', 'D#3', 'F#3', 'B3',

        'G3', 'B3', 'D4', 'G4', 'G3', 'B3', 'D4', 'G4',
        'A3', 'C4', 'E4', 'A4', 'A3', 'C4', 'E4', 'A4',
        'D3', 'F#3', 'A3', 'D4', 'B2', 'D#3', 'F#3', 'B3',
        'E3', 'G3', 'B3', 'E4', 'E3', 'G3', 'B3', null,
      ],
    },
    {
      name: 'Triangle - Bass',
      waveform: 'triangle',
      volume: 0.55,
      notes: [
        'E2', null, null, null, 'E2', null, null, null,
        'C2', null, null, null, 'C2', null, null, null,
        'D2', null, null, null, 'D2', null, null, null,
        'B1', null, null, null, 'B1', null, null, null,

        'G2', null, null, null, 'G2', null, null, null,
        'A2', null, null, null, 'A2', null, null, null,
        'D2', null, null, null, 'B1', null, null, null,
        'E2', null, null, null, 'E2', null, null, null,
      ],
    },
    {
      name: 'Noise - Percussion',
      waveform: 'noise',
      volume: 0.18,
      notes: [
        'C4', null, null, null, 'G4', null, null, null,
        'C4', null, null, null, 'G4', null, null, 'C4',
        'C4', null, null, null, 'G4', null, null, null,
        'C4', null, null, null, 'G4', null, 'C4', null,

        'C4', null, null, null, 'G4', null, null, null,
        'C4', null, null, null, 'G4', null, null, 'C4',
        'C4', null, null, null, 'G4', null, null, null,
        'C4', null, 'G4', null, 'G4', null, 'C4', null,
      ],
    },
  ],
};

// Level 2: Sunbaked Dunes ("Salt Wastes of Nessus") - 8-Bit
export const CHIPTUNE_TRACK_LEVEL_2: MusicTrack = {
  id: 'level-2',
  name: 'Salt Wastes of Nessus',
  subtitle: 'Echoes of Buried Hulls (8-Bit)',
  bpm: 100,
  stepsPerBeat: 4,
  loop: true,
  style: 'chiptune',
  channels: [
    {
      name: 'Pulse 1 - Lead',
      waveform: 'square',
      volume: 0.36,
      notes: [
        'D4', null, 'Eb4', null, 'G4', null, 'F4', null,
        'Eb4', null, 'D4', null, 'Eb4', null, 'C4', null,
        'D4', null, 'Eb4', null, 'G4', null, 'A4', null,
        'Bb4', null, 'A4', null, 'G4', 'F4', 'Eb4', 'D4',

        'F4', null, 'G4', null, 'A4', null, 'Bb4', null,
        'C5', null, 'Bb4', null, 'A4', null, 'G4', null,
        'F4', null, 'Eb4', null, 'D4', null, 'C#4', null,
        'D4', null, null, null, null, null, null, null,
      ],
    },
    {
      name: 'Pulse 2 - Ostinato',
      waveform: 'pulse',
      volume: 0.2,
      notes: [
        'D3', 'Eb3', 'D3', 'A3', 'D3', 'Eb3', 'D3', 'G3',
        'D3', 'Eb3', 'D3', 'F3', 'D3', 'Eb3', 'C3', 'Eb3',
        'D3', 'Eb3', 'D3', 'A3', 'D3', 'Eb3', 'D3', 'Bb3',
        'D3', 'Eb3', 'D3', 'A3', 'G3', 'F3', 'Eb3', 'C3',

        'F3', 'A3', 'C4', 'F4', 'G3', 'Bb3', 'D4', 'G4',
        'A3', 'C4', 'Eb4', 'A4', 'G3', 'Bb3', 'D4', 'G4',
        'F3', 'A3', 'C4', 'Eb4', 'Eb3', 'G3', 'Bb3', 'Eb4',
        'D3', 'F#3', 'A3', 'D4', 'D3', null, null, null,
      ],
    },
    {
      name: 'Triangle - Bass',
      waveform: 'triangle',
      volume: 0.55,
      notes: [
        'D2', null, 'D2', null, 'Eb2', null, 'D2', null,
        'D2', null, 'D2', null, 'C2', null, 'C2', null,
        'D2', null, 'D2', null, 'Eb2', null, 'D2', null,
        'G2', null, 'F2', null, 'Eb2', null, 'C2', null,

        'F2', null, 'F2', null, 'G2', null, 'G2', null,
        'A2', null, 'A2', null, 'G2', null, 'G2', null,
        'F2', null, 'F2', null, 'Eb2', null, 'Eb2', null,
        'D2', null, 'D2', null, 'D2', null, null, null,
      ],
    },
    {
      name: 'Noise - Percussion',
      waveform: 'noise',
      volume: 0.22,
      notes: [
        'C4', 'G4', null, 'G4', 'C4', 'G4', 'G4', null,
        'C4', 'G4', null, 'G4', 'C4', 'G4', 'G4', 'C4',
        'C4', 'G4', null, 'G4', 'C4', 'G4', 'G4', null,
        'C4', 'G4', 'G4', 'G4', 'C4', 'G4', 'C4', 'G4',

        'C4', 'G4', null, 'G4', 'C4', 'G4', 'G4', null,
        'C4', 'G4', null, 'G4', 'C4', 'G4', 'G4', 'C4',
        'C4', 'G4', null, 'G4', 'C4', 'G4', 'G4', null,
        'C4', 'C4', 'G4', 'G4', 'C4', null, null, null,
      ],
    },
  ],
};

// Level 3: Crag Canyon ("Sanguine Gorge of Thrax") - 8-Bit
export const CHIPTUNE_TRACK_LEVEL_3: MusicTrack = {
  id: 'level-3',
  name: 'Sanguine Gorge of Thrax',
  subtitle: 'March of the Executioners (8-Bit)',
  bpm: 116,
  stepsPerBeat: 4,
  loop: true,
  style: 'chiptune',
  channels: [
    {
      name: 'Pulse 1 - Lead',
      waveform: 'square',
      volume: 0.38,
      notes: [
        'C4', null, 'Eb4', null, 'G4', null, 'Ab4', null,
        'G4', null, 'Eb4', null, 'F#4', null, 'G4', null,
        'C4', null, 'Eb4', null, 'Ab4', null, 'B4', null,
        'C5', null, 'B4', 'Ab4', 'G4', 'F4', 'Eb4', 'D4',

        'Eb4', null, 'F4', null, 'G4', null, 'Ab4', null,
        'Bb4', null, 'Ab4', null, 'G4', null, 'F4', null,
        'Eb4', null, 'D4', null, 'C4', null, 'B3', null,
        'C4', null, null, null, null, null, null, null,
      ],
    },
    {
      name: 'Pulse 2 - Arp',
      waveform: 'pulse',
      volume: 0.24,
      notes: [
        'C3', 'Eb3', 'G3', 'C4', 'C3', 'Eb3', 'G3', 'C4',
        'Ab2', 'C3', 'Eb3', 'Ab3', 'G2', 'B2', 'D3', 'G3',
        'C3', 'Eb3', 'G3', 'C4', 'C3', 'Eb3', 'G3', 'C4',
        'F2', 'Ab2', 'C3', 'F3', 'G2', 'B2', 'D3', 'G3',

        'Eb3', 'G3', 'Bb3', 'Eb4', 'F3', 'Ab3', 'C4', 'F4',
        'G3', 'Bb3', 'D4', 'G4', 'Ab3', 'C4', 'Eb4', 'Ab4',
        'Eb3', 'G3', 'C4', 'Eb4', 'D3', 'F3', 'B3', 'D4',
        'C3', 'Eb3', 'G3', 'C4', 'C3', null, null, null,
      ],
    },
    {
      name: 'Triangle - Bass',
      waveform: 'triangle',
      volume: 0.58,
      notes: [
        'C2', 'C2', null, 'C2', 'C2', 'C2', null, 'C2',
        'Ab1', 'Ab1', null, 'Ab1', 'G1', 'G1', null, 'G1',
        'C2', 'C2', null, 'C2', 'C2', 'C2', null, 'C2',
        'F1', 'F1', null, 'F1', 'G1', 'G1', null, 'G1',

        'Eb2', 'Eb2', null, 'Eb2', 'F2', 'F2', null, 'F2',
        'G2', 'G2', null, 'G2', 'Ab2', 'Ab2', null, 'Ab2',
        'Eb2', 'Eb2', null, 'Eb2', 'G1', 'G1', null, 'G1',
        'C2', 'C2', null, 'C2', 'C2', null, null, null,
      ],
    },
    {
      name: 'Noise - Drums',
      waveform: 'noise',
      volume: 0.28,
      notes: [
        'C4', null, 'G4', null, 'C4', 'C4', 'G4', null,
        'C4', null, 'G4', null, 'C4', null, 'G4', 'G4',
        'C4', null, 'G4', null, 'C4', 'C4', 'G4', null,
        'C4', null, 'G4', 'C4', 'G4', 'G4', 'G4', 'G4',

        'C4', null, 'G4', null, 'C4', 'C4', 'G4', null,
        'C4', null, 'G4', null, 'C4', null, 'G4', 'G4',
        'C4', null, 'G4', null, 'C4', 'C4', 'G4', null,
        'C4', 'C4', 'G4', 'G4', 'C4', null, null, null,
      ],
    },
  ],
};

// Level 4: Iron Stronghold ("Citadel of the Guild") - 8-Bit
export const CHIPTUNE_TRACK_LEVEL_4: MusicTrack = {
  id: 'level-4',
  name: 'Citadel of the Guild',
  subtitle: 'Hymn of the Fuligin Robes (8-Bit)',
  bpm: 84,
  stepsPerBeat: 4,
  loop: true,
  style: 'chiptune',
  channels: [
    {
      name: 'Pulse 1 - Organ Lead',
      waveform: 'square',
      volume: 0.38,
      notes: [
        'A4', null, 'B4', null, 'C5', null, 'E5', null,
        'D#5', null, 'E5', null, 'B4', null, null, null,
        'C5', null, 'D5', null, 'E5', null, 'A5', null,
        'G#5', null, 'E5', null, 'A5', null, null, null,

        'F5', null, 'E5', null, 'D5', null, 'C5', null,
        'B4', null, 'C5', null, 'D5', null, 'B4', null,
        'C5', null, 'B4', null, 'A4', null, 'G#4', null,
        'A4', null, null, null, null, null, null, null,
      ],
    },
    {
      name: 'Pulse 2 - Harmony',
      waveform: 'sawtooth',
      volume: 0.22,
      notes: [
        'E4', null, 'G4', null, 'A4', null, 'C5', null,
        'B4', null, 'C5', null, 'G#4', null, null, null,
        'A4', null, 'B4', null, 'C5', null, 'E5', null,
        'E5', null, 'B4', null, 'C5', null, null, null,

        'D5', null, 'C5', null, 'B4', null, 'A4', null,
        'G#4', null, 'A4', null, 'B4', null, 'G#4', null,
        'A4', null, 'G#4', null, 'F4', null, 'E4', null,
        'E4', null, null, null, null, null, null, null,
      ],
    },
    {
      name: 'Triangle - Bass',
      waveform: 'triangle',
      volume: 0.58,
      notes: [
        'A2', null, 'A2', null, 'A2', null, 'C3', null,
        'F#2', null, 'F#2', null, 'E2', null, 'E2', null,
        'A2', null, 'B2', null, 'C3', null, 'C3', null,
        'E3', null, 'E2', null, 'A2', null, 'A2', null,

        'D3', null, 'D3', null, 'D3', null, 'F3', null,
        'E3', null, 'E3', null, 'E3', null, 'E2', null,
        'F2', null, 'F2', null, 'E2', null, 'E2', null,
        'A1', null, 'A2', null, 'A1', null, null, null,
      ],
    },
    {
      name: 'Noise - Percussion',
      waveform: 'noise',
      volume: 0.18,
      notes: [
        'C4', null, null, null, 'G4', null, null, null,
        'C4', null, null, null, 'G4', null, null, null,
        'C4', null, null, null, 'G4', null, null, null,
        'C4', null, 'G4', null, 'G4', null, null, null,

        'C4', null, null, null, 'G4', null, null, null,
        'C4', null, null, null, 'G4', null, null, null,
        'C4', null, null, null, 'G4', null, null, null,
        'C4', null, 'G4', null, 'C4', null, null, null,
      ],
    },
  ],
};

// Level 5: Infernal Caldera ("Typhon's Crucible") - 8-Bit
export const CHIPTUNE_TRACK_LEVEL_5: MusicTrack = {
  id: 'level-5',
  name: 'Infernal Caldera',
  subtitle: "Typhon's Awakening (8-Bit)",
  bpm: 132,
  stepsPerBeat: 4,
  loop: true,
  style: 'chiptune',
  channels: [
    {
      name: 'Pulse 1 - Battle Lead',
      waveform: 'square',
      volume: 0.4,
      notes: [
        'F#4', 'G4', 'A4', 'C5', 'F#4', 'G4', 'A4', 'C5',
        'Eb5', 'D5', 'C5', 'A4', 'G4', 'F#4', 'G4', 'Eb4',
        'F#4', 'A4', 'C5', 'Eb5', 'F#5', 'Eb5', 'C5', 'A4',
        'C5', 'A4', 'F#4', 'Eb4', 'D4', 'C4', 'B3', 'C4',

        'D5', 'C5', 'Bb4', 'A4', 'G4', 'F4', 'Eb4', 'D4',
        'Eb5', 'D5', 'C5', 'Bb4', 'A4', 'G4', 'F#4', 'G4',
        'F#5', 'Eb5', 'C5', 'A4', 'G4', 'F#4', 'Eb4', 'C4',
        'F#4', null, null, null, null, null, null, null,
      ],
    },
    {
      name: 'Pulse 2 - Energy Arp',
      waveform: 'pulse',
      volume: 0.25,
      notes: [
        'F#3', 'A3', 'C4', 'Eb4', 'F#3', 'A3', 'C4', 'Eb4',
        'G3', 'Bb3', 'D4', 'F4', 'G3', 'Bb3', 'D4', 'F4',
        'F#3', 'A3', 'C4', 'Eb4', 'F#3', 'A3', 'C4', 'Eb4',
        'C3', 'Eb3', 'F#3', 'A3', 'D3', 'F#3', 'A3', 'C4',

        'Bb3', 'D4', 'F4', 'Bb4', 'A3', 'C4', 'Eb4', 'A4',
        'G3', 'Bb3', 'D4', 'G4', 'Eb3', 'G3', 'Bb3', 'Eb4',
        'F#3', 'A3', 'C4', 'Eb4', 'C3', 'Eb3', 'F#3', 'A3',
        'F#3', 'A3', 'C4', 'F#4', 'F#3', null, null, null,
      ],
    },
    {
      name: 'Triangle - Gallop Bass',
      waveform: 'triangle',
      volume: 0.6,
      notes: [
        'F#2', 'F#2', 'F#2', 'F#2', 'F#2', 'F#2', 'F#2', 'F#2',
        'G2', 'G2', 'G2', 'G2', 'Eb2', 'Eb2', 'Eb2', 'Eb2',
        'F#2', 'F#2', 'F#2', 'F#2', 'F#2', 'F#2', 'F#2', 'F#2',
        'C2', 'C2', 'Eb2', 'Eb2', 'D2', 'D2', 'C2', 'C2',

        'Bb2', 'Bb2', 'Bb2', 'Bb2', 'A2', 'A2', 'A2', 'A2',
        'G2', 'G2', 'G2', 'G2', 'Eb2', 'Eb2', 'Eb2', 'Eb2',
        'F#2', 'F#2', 'F#2', 'F#2', 'C2', 'C2', 'C2', 'C2',
        'F#1', 'F#1', 'F#2', 'F#2', 'F#1', null, null, null,
      ],
    },
    {
      name: 'Noise - Battle Drums',
      waveform: 'noise',
      volume: 0.32,
      notes: [
        'C4', 'G4', 'C4', 'G4', 'C4', 'G4', 'C4', 'G4',
        'C4', 'G4', 'C4', 'G4', 'C4', 'C4', 'G4', 'G4',
        'C4', 'G4', 'C4', 'G4', 'C4', 'G4', 'C4', 'G4',
        'C4', 'G4', 'C4', 'C4', 'G4', 'G4', 'G4', 'G4',

        'C4', 'G4', 'C4', 'G4', 'C4', 'G4', 'C4', 'G4',
        'C4', 'G4', 'C4', 'G4', 'C4', 'C4', 'G4', 'G4',
        'C4', 'G4', 'C4', 'G4', 'C4', 'G4', 'C4', 'G4',
        'C4', 'C4', 'G4', 'G4', 'C4', null, null, null,
      ],
    },
  ],
};

// Aliases for retro tracks (full backward compatibility)
export const TRACK_LEVEL_1 = CHIPTUNE_TRACK_LEVEL_1;
export const TRACK_LEVEL_2 = CHIPTUNE_TRACK_LEVEL_2;
export const TRACK_LEVEL_3 = CHIPTUNE_TRACK_LEVEL_3;
export const TRACK_LEVEL_4 = CHIPTUNE_TRACK_LEVEL_4;
export const TRACK_LEVEL_5 = CHIPTUNE_TRACK_LEVEL_5;

// ============================================================================
// MODERN SOUNDTRACK (RICH SYNTHWAVE / AMBIENT ELECTRO / CINEMATIC OST)
// ============================================================================

// Level 1: Emerald Plains - Modern Synthwave ("Verdant Neon Ruins")
export const MODERN_TRACK_LEVEL_1: MusicTrack = {
  id: 'level-1',
  name: 'Verdant Neon Ruins',
  subtitle: 'Lament for Gyoll (Modern Synth)',
  bpm: 100,
  stepsPerBeat: 4,
  loop: true,
  style: 'modern',
  channels: [
    // Soaring Supersaw Lead
    {
      name: 'Modern Lead - Melody',
      waveform: 'sawtooth',
      instrument: 'modern-lead',
      volume: 0.35,
      filterCutoff: 3800,
      filterQ: 2.5,
      notes: [
        { note: 'E4', duration: 2 }, null, { note: 'G4', duration: 2 }, null,
        { note: 'B4', duration: 2 }, null, { note: 'A4', duration: 2 }, null,
        { note: 'G4', duration: 2 }, null, { note: 'F#4', duration: 2 }, null,
        { note: 'E4', duration: 4 }, null, null, null,

        { note: 'D4', duration: 2 }, null, { note: 'F#4', duration: 2 }, null,
        { note: 'A4', duration: 2 }, null, { note: 'B4', duration: 2 }, null,
        { note: 'C5', duration: 2 }, { note: 'B4', duration: 1 }, { note: 'A4', duration: 1 },
        { note: 'G4', duration: 1 }, { note: 'F#4', duration: 1 }, { note: 'E4', duration: 2 }, null,

        { note: 'B4', duration: 2 }, null, { note: 'D5', duration: 2 }, null,
        { note: 'E5', duration: 2 }, null, { note: 'D5', duration: 2 }, null,
        { note: 'B4', duration: 2 }, null, { note: 'G4', duration: 2 }, null,
        { note: 'A4', duration: 4 }, null, null, null,

        { note: 'F#4', duration: 2 }, null, { note: 'G4', duration: 2 }, null,
        { note: 'A4', duration: 2 }, null, { note: 'B4', duration: 2 }, null,
        { note: 'G4', duration: 2 }, null, { note: 'F#4', duration: 2 }, null,
        { note: 'E4', duration: 4 }, null, null, null,
      ],
    },
    // Warm Analog Synth Pad Chords
    {
      name: 'Modern Pad - Chords',
      waveform: 'sine',
      instrument: 'modern-pad',
      volume: 0.28,
      filterCutoff: 1800,
      notes: [
        { note: 'E3', duration: 16 }, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
        { note: 'C3', duration: 16 }, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
        { note: 'G3', duration: 16 }, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
        { note: 'D3', duration: 16 }, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
      ],
    },
    // Resonant Synth Pluck Arpeggio
    {
      name: 'Modern Pluck - Arp',
      waveform: 'sawtooth',
      instrument: 'modern-pluck',
      volume: 0.22,
      filterCutoff: 2400,
      notes: [
        'E3', 'G3', 'B3', 'E4', 'G3', 'B3', 'E4', 'G4',
        'C3', 'E3', 'G3', 'C4', 'E3', 'G3', 'C4', 'E4',
        'G3', 'B3', 'D4', 'G4', 'B3', 'D4', 'G4', 'B4',
        'D3', 'F#3', 'A3', 'D4', 'B2', 'D#3', 'F#3', 'B3',

        'E3', 'G3', 'B3', 'E4', 'G3', 'B3', 'E4', 'G4',
        'A3', 'C4', 'E4', 'A4', 'C4', 'E4', 'A4', 'C5',
        'D3', 'F#3', 'A3', 'D4', 'B2', 'D#3', 'F#3', 'B3',
        'E3', 'G3', 'B3', 'E4', 'E3', 'G3', 'B3', null,
      ],
    },
    // Modern Deep Sub Bass
    {
      name: 'Modern Bass - Sub',
      waveform: 'triangle',
      instrument: 'modern-sub',
      volume: 0.55,
      filterCutoff: 700,
      notes: [
        'E2', null, 'E2', 'E2', null, 'E2', null, 'E2',
        'C2', null, 'C2', 'C2', null, 'C2', null, 'C2',
        'G2', null, 'G2', 'G2', null, 'G2', null, 'G2',
        'D2', null, 'D2', 'D2', 'B1', null, 'B1', null,

        'E2', null, 'E2', 'E2', null, 'E2', null, 'E2',
        'A2', null, 'A2', 'A2', null, 'A2', null, 'A2',
        'D2', null, 'D2', 'D2', 'B1', null, 'B1', null,
        'E2', null, 'E2', 'E2', 'E2', null, null, null,
      ],
    },
    // Modern Electronic Drums: 808 Kick, Layered Snare, Crisp Hi-Hats
    {
      name: 'Modern Drums - Kick & Snare',
      waveform: 'sine',
      instrument: 'modern-kick',
      volume: 0.5,
      notes: [
        { note: 'C2', instrument: 'modern-kick' }, null, null, null,
        { note: 'D2', instrument: 'modern-snare' }, null, null, null,
        { note: 'C2', instrument: 'modern-kick' }, null, { note: 'C2', instrument: 'modern-kick' }, null,
        { note: 'D2', instrument: 'modern-snare' }, null, null, null,

        { note: 'C2', instrument: 'modern-kick' }, null, null, null,
        { note: 'D2', instrument: 'modern-snare' }, null, null, null,
        { note: 'C2', instrument: 'modern-kick' }, null, { note: 'C2', instrument: 'modern-kick' }, null,
        { note: 'D2', instrument: 'modern-snare' }, null, null, { note: 'D2', instrument: 'modern-snare' },

        { note: 'C2', instrument: 'modern-kick' }, null, null, null,
        { note: 'D2', instrument: 'modern-snare' }, null, null, null,
        { note: 'C2', instrument: 'modern-kick' }, null, { note: 'C2', instrument: 'modern-kick' }, null,
        { note: 'D2', instrument: 'modern-snare' }, null, null, null,

        { note: 'C2', instrument: 'modern-kick' }, null, { note: 'C2', instrument: 'modern-kick' }, null,
        { note: 'D2', instrument: 'modern-snare' }, null, null, null,
        { note: 'C2', instrument: 'modern-kick' }, null, { note: 'C2', instrument: 'modern-kick' }, null,
        { note: 'D2', instrument: 'modern-snare' }, null, { note: 'D2', instrument: 'modern-snare' }, null,
      ],
    },
    // Hi-Hat groove
    {
      name: 'Modern Drums - Hi-Hats',
      waveform: 'noise',
      instrument: 'modern-hihat',
      volume: 0.3,
      notes: [
        'C4', 'C4', 'C4', 'C4', 'C4', 'C4', 'C4', 'C4',
        'C4', 'C4', 'C4', 'C4', 'C4', 'C4', 'C4', { note: 'C4', instrument: 'modern-openhat' },
        'C4', 'C4', 'C4', 'C4', 'C4', 'C4', 'C4', 'C4',
        'C4', 'C4', 'C4', 'C4', 'C4', 'C4', 'C4', { note: 'C4', instrument: 'modern-openhat' },

        'C4', 'C4', 'C4', 'C4', 'C4', 'C4', 'C4', 'C4',
        'C4', 'C4', 'C4', 'C4', 'C4', 'C4', 'C4', { note: 'C4', instrument: 'modern-openhat' },
        'C4', 'C4', 'C4', 'C4', 'C4', 'C4', 'C4', 'C4',
        'C4', 'C4', 'C4', 'C4', { note: 'C4', instrument: 'modern-openhat' }, null, 'C4', null,
      ],
    },
  ],
};

// Level 2: Sunbaked Dunes - Modern Cinematic Desert Synth ("Echoes of Buried Hulls")
export const MODERN_TRACK_LEVEL_2: MusicTrack = {
  id: 'level-2',
  name: 'Salt Wastes of Nessus',
  subtitle: 'Echoes of Buried Hulls (Modern Synth)',
  bpm: 104,
  stepsPerBeat: 4,
  loop: true,
  style: 'modern',
  channels: [
    // Phrygian Exotic Synth Lead
    {
      name: 'Modern Lead - Desert Motif',
      waveform: 'sawtooth',
      instrument: 'modern-lead',
      volume: 0.35,
      filterCutoff: 3400,
      filterQ: 2.0,
      notes: [
        { note: 'D4', duration: 2 }, null, { note: 'Eb4', duration: 2 }, null,
        { note: 'G4', duration: 2 }, null, { note: 'F4', duration: 2 }, null,
        { note: 'Eb4', duration: 2 }, null, { note: 'D4', duration: 2 }, null,
        { note: 'Eb4', duration: 2 }, null, { note: 'C4', duration: 2 }, null,

        { note: 'D4', duration: 2 }, null, { note: 'Eb4', duration: 2 }, null,
        { note: 'G4', duration: 2 }, null, { note: 'A4', duration: 2 }, null,
        { note: 'Bb4', duration: 2 }, null, { note: 'A4', duration: 2 }, null,
        { note: 'G4', duration: 1 }, { note: 'F4', duration: 1 }, { note: 'Eb4', duration: 1 }, { note: 'D4', duration: 1 },

        { note: 'F4', duration: 2 }, null, { note: 'G4', duration: 2 }, null,
        { note: 'A4', duration: 2 }, null, { note: 'Bb4', duration: 2 }, null,
        { note: 'C5', duration: 2 }, null, { note: 'Bb4', duration: 2 }, null,
        { note: 'A4', duration: 2 }, null, { note: 'G4', duration: 2 }, null,

        { note: 'F4', duration: 2 }, null, { note: 'Eb4', duration: 2 }, null,
        { note: 'D4', duration: 2 }, null, { note: 'C#4', duration: 2 }, null,
        { note: 'D4', duration: 6 }, null, null, null, null, null, null, null,
      ],
    },
    // Atmospheric Desert Pad
    {
      name: 'Modern Pad - Dunes',
      waveform: 'sine',
      instrument: 'modern-pad',
      volume: 0.25,
      filterCutoff: 1500,
      notes: [
        { note: 'D3', duration: 16 }, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
        { note: 'Eb3', duration: 16 }, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
        { note: 'F3', duration: 16 }, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
        { note: 'D3', duration: 16 }, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
      ],
    },
    // Driving Midtempo Bass
    {
      name: 'Modern Bass - Resonant Saw',
      waveform: 'sawtooth',
      instrument: 'modern-bass',
      volume: 0.48,
      filterCutoff: 900,
      notes: [
        'D2', null, 'D2', 'Eb2', null, 'D2', 'D2', null,
        'D2', null, 'D2', 'C2', null, 'C2', 'C2', null,
        'D2', null, 'D2', 'Eb2', null, 'D2', 'D2', null,
        'G2', null, 'F2', 'Eb2', null, 'C2', 'D2', null,

        'F2', null, 'F2', 'F2', null, 'G2', 'G2', null,
        'A2', null, 'A2', 'A2', null, 'G2', 'G2', null,
        'F2', null, 'F2', 'Eb2', null, 'Eb2', 'Eb2', null,
        'D2', null, 'D2', 'D2', 'D2', null, null, null,
      ],
    },
    // Modern Drums
    {
      name: 'Modern Drums - Beat',
      waveform: 'sine',
      instrument: 'modern-kick',
      volume: 0.48,
      notes: [
        { note: 'C2', instrument: 'modern-kick' }, null, null, null,
        { note: 'D2', instrument: 'modern-snare' }, null, null, null,
        { note: 'C2', instrument: 'modern-kick' }, null, { note: 'C2', instrument: 'modern-kick' }, null,
        { note: 'D2', instrument: 'modern-snare' }, null, null, null,

        { note: 'C2', instrument: 'modern-kick' }, null, null, null,
        { note: 'D2', instrument: 'modern-snare' }, null, null, null,
        { note: 'C2', instrument: 'modern-kick' }, null, { note: 'C2', instrument: 'modern-kick' }, null,
        { note: 'D2', instrument: 'modern-snare' }, null, { note: 'D2', instrument: 'modern-snare' }, null,

        { note: 'C2', instrument: 'modern-kick' }, null, null, null,
        { note: 'D2', instrument: 'modern-snare' }, null, null, null,
        { note: 'C2', instrument: 'modern-kick' }, null, { note: 'C2', instrument: 'modern-kick' }, null,
        { note: 'D2', instrument: 'modern-snare' }, null, null, null,

        { note: 'C2', instrument: 'modern-kick' }, null, null, null,
        { note: 'D2', instrument: 'modern-snare' }, null, null, null,
        { note: 'C2', instrument: 'modern-kick' }, null, { note: 'C2', instrument: 'modern-kick' }, { note: 'C2', instrument: 'modern-kick' },
        { note: 'D2', instrument: 'modern-snare' }, null, null, null,
      ],
    },
    // Hi-Hats & Shakers
    {
      name: 'Modern Drums - Shimmer Hats',
      waveform: 'noise',
      instrument: 'modern-hihat',
      volume: 0.28,
      notes: [
        'C4', null, 'C4', 'C4', 'C4', null, 'C4', 'C4',
        'C4', null, 'C4', 'C4', 'C4', null, 'C4', { note: 'C4', instrument: 'modern-openhat' },
        'C4', null, 'C4', 'C4', 'C4', null, 'C4', 'C4',
        'C4', null, 'C4', 'C4', 'C4', 'C4', 'C4', { note: 'C4', instrument: 'modern-openhat' },

        'C4', null, 'C4', 'C4', 'C4', null, 'C4', 'C4',
        'C4', null, 'C4', 'C4', 'C4', null, 'C4', { note: 'C4', instrument: 'modern-openhat' },
        'C4', null, 'C4', 'C4', 'C4', null, 'C4', 'C4',
        'C4', 'C4', 'C4', 'C4', { note: 'C4', instrument: 'modern-openhat' }, null, null, null,
      ],
    },
  ],
};

// Level 3: Crag Canyon - Modern Cyberpunk / Industrial Electro ("March of the Cyber-Executioners")
export const MODERN_TRACK_LEVEL_3: MusicTrack = {
  id: 'level-3',
  name: 'Sanguine Gorge of Thrax',
  subtitle: 'March of the Cyber-Executioners (Modern Synth)',
  bpm: 120,
  stepsPerBeat: 4,
  loop: true,
  style: 'modern',
  channels: [
    // Aggressive Cyber Lead
    {
      name: 'Modern Lead - Cyber Stabs',
      waveform: 'sawtooth',
      instrument: 'modern-lead',
      volume: 0.38,
      filterCutoff: 4200,
      filterQ: 3.0,
      notes: [
        { note: 'C4', duration: 2 }, null, { note: 'Eb4', duration: 2 }, null,
        { note: 'G4', duration: 2 }, null, { note: 'Ab4', duration: 2 }, null,
        { note: 'G4', duration: 2 }, null, { note: 'Eb4', duration: 2 }, null,
        { note: 'F#4', duration: 2 }, null, { note: 'G4', duration: 2 }, null,

        { note: 'C4', duration: 2 }, null, { note: 'Eb4', duration: 2 }, null,
        { note: 'Ab4', duration: 2 }, null, { note: 'B4', duration: 2 }, null,
        { note: 'C5', duration: 2 }, { note: 'B4', duration: 1 }, { note: 'Ab4', duration: 1 },
        { note: 'G4', duration: 1 }, { note: 'F4', duration: 1 }, { note: 'Eb4', duration: 1 }, { note: 'D4', duration: 1 },

        { note: 'Eb4', duration: 2 }, null, { note: 'F4', duration: 2 }, null,
        { note: 'G4', duration: 2 }, null, { note: 'Ab4', duration: 2 }, null,
        { note: 'Bb4', duration: 2 }, null, { note: 'Ab4', duration: 2 }, null,
        { note: 'G4', duration: 2 }, null, { note: 'F4', duration: 2 }, null,

        { note: 'Eb4', duration: 2 }, null, { note: 'D4', duration: 2 }, null,
        { note: 'C4', duration: 2 }, null, { note: 'B3', duration: 2 }, null,
        { note: 'C4', duration: 6 }, null, null, null, null, null, null, null,
      ],
    },
    // Heavy Industrial Bassline (Pumping sidechain style)
    {
      name: 'Modern Bass - Industrial Saw',
      waveform: 'sawtooth',
      instrument: 'modern-bass',
      volume: 0.55,
      filterCutoff: 1100,
      notes: [
        'C2', 'C2', 'C2', 'C2', 'C2', 'C2', 'C2', 'C2',
        'Ab1', 'Ab1', 'Ab1', 'Ab1', 'G1', 'G1', 'G1', 'G1',
        'C2', 'C2', 'C2', 'C2', 'C2', 'C2', 'C2', 'C2',
        'F1', 'F1', 'F1', 'F1', 'G1', 'G1', 'G1', 'G1',

        'Eb2', 'Eb2', 'Eb2', 'Eb2', 'F2', 'F2', 'F2', 'F2',
        'G2', 'G2', 'G2', 'G2', 'Ab2', 'Ab2', 'Ab2', 'Ab2',
        'Eb2', 'Eb2', 'Eb2', 'Eb2', 'G1', 'G1', 'G1', 'G1',
        'C2', 'C2', 'C2', 'C2', 'C2', null, null, null,
      ],
    },
    // High-Energy Arpeggiated Plucks
    {
      name: 'Modern Pluck - Energy Arp',
      waveform: 'sawtooth',
      instrument: 'modern-pluck',
      volume: 0.26,
      filterCutoff: 2800,
      notes: [
        'C3', 'Eb3', 'G3', 'C4', 'C3', 'Eb3', 'G3', 'C4',
        'Ab2', 'C3', 'Eb3', 'Ab3', 'G2', 'B2', 'D3', 'G3',
        'C3', 'Eb3', 'G3', 'C4', 'C3', 'Eb3', 'G3', 'C4',
        'F2', 'Ab2', 'C3', 'F3', 'G2', 'B2', 'D3', 'G3',

        'Eb3', 'G3', 'Bb3', 'Eb4', 'F3', 'Ab3', 'C4', 'F4',
        'G3', 'Bb3', 'D4', 'G4', 'Ab3', 'C4', 'Eb4', 'Ab4',
        'Eb3', 'G3', 'C4', 'Eb4', 'D3', 'F3', 'B3', 'D4',
        'C3', 'Eb3', 'G3', 'C4', 'C3', null, null, null,
      ],
    },
    // Driving 4-on-the-floor Electro Drums
    {
      name: 'Modern Drums - 4-on-the-Floor',
      waveform: 'sine',
      instrument: 'modern-kick',
      volume: 0.52,
      notes: [
        { note: 'C2', instrument: 'modern-kick' }, null, null, null,
        { note: 'D2', instrument: 'modern-snare' }, null, null, null,
        { note: 'C2', instrument: 'modern-kick' }, null, null, null,
        { note: 'D2', instrument: 'modern-snare' }, null, null, null,

        { note: 'C2', instrument: 'modern-kick' }, null, null, null,
        { note: 'D2', instrument: 'modern-snare' }, null, null, null,
        { note: 'C2', instrument: 'modern-kick' }, null, null, null,
        { note: 'D2', instrument: 'modern-snare' }, null, { note: 'C2', instrument: 'modern-kick' }, { note: 'D2', instrument: 'modern-snare' },

        { note: 'C2', instrument: 'modern-kick' }, null, null, null,
        { note: 'D2', instrument: 'modern-snare' }, null, null, null,
        { note: 'C2', instrument: 'modern-kick' }, null, null, null,
        { note: 'D2', instrument: 'modern-snare' }, null, null, null,

        { note: 'C2', instrument: 'modern-kick' }, null, null, null,
        { note: 'D2', instrument: 'modern-snare' }, null, null, null,
        { note: 'C2', instrument: 'modern-kick' }, null, { note: 'C2', instrument: 'modern-kick' }, null,
        { note: 'D2', instrument: 'modern-snare' }, { note: 'D2', instrument: 'modern-snare' }, { note: 'D2', instrument: 'modern-snare' }, null,
      ],
    },
    // Hi-Hats
    {
      name: 'Modern Drums - Cyber Hats',
      waveform: 'noise',
      instrument: 'modern-hihat',
      volume: 0.32,
      notes: [
        null, null, { note: 'C4', instrument: 'modern-openhat' }, null,
        null, null, { note: 'C4', instrument: 'modern-openhat' }, null,
        null, null, { note: 'C4', instrument: 'modern-openhat' }, null,
        null, null, { note: 'C4', instrument: 'modern-openhat' }, 'C4',

        null, null, { note: 'C4', instrument: 'modern-openhat' }, null,
        null, null, { note: 'C4', instrument: 'modern-openhat' }, null,
        null, null, { note: 'C4', instrument: 'modern-openhat' }, null,
        'C4', 'C4', { note: 'C4', instrument: 'modern-openhat' }, null,

        null, null, { note: 'C4', instrument: 'modern-openhat' }, null,
        null, null, { note: 'C4', instrument: 'modern-openhat' }, null,
        null, null, { note: 'C4', instrument: 'modern-openhat' }, null,
        null, null, { note: 'C4', instrument: 'modern-openhat' }, 'C4',

        null, null, { note: 'C4', instrument: 'modern-openhat' }, null,
        null, null, { note: 'C4', instrument: 'modern-openhat' }, null,
        'C4', 'C4', 'C4', 'C4',
        'C4', 'C4', { note: 'C4', instrument: 'modern-openhat' }, null,
      ],
    },
  ],
};

// Level 4: Iron Stronghold - Modern Darkwave / Gothic Requiem ("Hymn of the Fuligin Robes")
export const MODERN_TRACK_LEVEL_4: MusicTrack = {
  id: 'level-4',
  name: 'Citadel of the Guild',
  subtitle: 'Hymn of the Fuligin Robes (Modern Darkwave)',
  bpm: 92,
  stepsPerBeat: 4,
  loop: true,
  style: 'modern',
  channels: [
    // Soaring Gothic Synth Lead
    {
      name: 'Modern Lead - Gothic Synth',
      waveform: 'sawtooth',
      instrument: 'modern-lead',
      volume: 0.36,
      filterCutoff: 3600,
      filterQ: 2.2,
      notes: [
        { note: 'A4', duration: 2 }, null, { note: 'B4', duration: 2 }, null,
        { note: 'C5', duration: 2 }, null, { note: 'E5', duration: 2 }, null,
        { note: 'D#5', duration: 2 }, null, { note: 'E5', duration: 2 }, null,
        { note: 'B4', duration: 4 }, null, null, null,

        { note: 'C5', duration: 2 }, null, { note: 'D5', duration: 2 }, null,
        { note: 'E5', duration: 2 }, null, { note: 'A5', duration: 2 }, null,
        { note: 'G#5', duration: 2 }, null, { note: 'E5', duration: 2 }, null,
        { note: 'A5', duration: 4 }, null, null, null,

        { note: 'F5', duration: 2 }, null, { note: 'E5', duration: 2 }, null,
        { note: 'D5', duration: 2 }, null, { note: 'C5', duration: 2 }, null,
        { note: 'B4', duration: 2 }, null, { note: 'C5', duration: 2 }, null,
        { note: 'D5', duration: 2 }, null, { note: 'B4', duration: 2 }, null,

        { note: 'C5', duration: 2 }, null, { note: 'B4', duration: 2 }, null,
        { note: 'A4', duration: 2 }, null, { note: 'G#4', duration: 2 }, null,
        { note: 'A4', duration: 6 }, null, null, null, null, null, null, null,
      ],
    },
    // Lush Cathedral Organ & Supersaw Pad
    {
      name: 'Modern Pad - Cathedral',
      waveform: 'sine',
      instrument: 'modern-pad',
      volume: 0.28,
      filterCutoff: 2000,
      notes: [
        { note: 'A3', duration: 16 }, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
        { note: 'F3', duration: 16 }, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
        { note: 'D3', duration: 16 }, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
        { note: 'E3', duration: 16 }, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
      ],
    },
    // Heavy Resonant Bass
    {
      name: 'Modern Bass - Deep Pulse',
      waveform: 'triangle',
      instrument: 'modern-sub',
      volume: 0.55,
      filterCutoff: 800,
      notes: [
        'A2', null, 'A2', 'A2', null, 'A2', 'C3', null,
        'F#2', null, 'F#2', 'F#2', null, 'E2', 'E2', null,
        'A2', null, 'B2', 'B2', 'C3', null, 'C3', null,
        'E3', null, 'E2', 'E2', 'A2', null, 'A2', null,

        'D3', null, 'D3', 'D3', null, 'D3', 'F3', null,
        'E3', null, 'E3', 'E3', null, 'E3', 'E2', null,
        'F2', null, 'F2', 'F2', null, 'E2', 'E2', null,
        'A1', null, 'A2', 'A2', 'A1', null, null, null,
      ],
    },
    // Modern Slow Heavy Electronic Drums
    {
      name: 'Modern Drums - Heavy Beat',
      waveform: 'sine',
      instrument: 'modern-kick',
      volume: 0.5,
      notes: [
        { note: 'C2', instrument: 'modern-kick' }, null, null, null,
        { note: 'D2', instrument: 'modern-snare' }, null, null, null,
        { note: 'C2', instrument: 'modern-kick' }, null, { note: 'C2', instrument: 'modern-kick' }, null,
        { note: 'D2', instrument: 'modern-snare' }, null, null, null,

        { note: 'C2', instrument: 'modern-kick' }, null, null, null,
        { note: 'D2', instrument: 'modern-snare' }, null, null, null,
        { note: 'C2', instrument: 'modern-kick' }, null, { note: 'C2', instrument: 'modern-kick' }, null,
        { note: 'D2', instrument: 'modern-snare' }, null, null, null,

        { note: 'C2', instrument: 'modern-kick' }, null, null, null,
        { note: 'D2', instrument: 'modern-snare' }, null, null, null,
        { note: 'C2', instrument: 'modern-kick' }, null, { note: 'C2', instrument: 'modern-kick' }, null,
        { note: 'D2', instrument: 'modern-snare' }, null, null, null,

        { note: 'C2', instrument: 'modern-kick' }, null, null, null,
        { note: 'D2', instrument: 'modern-snare' }, null, null, null,
        { note: 'C2', instrument: 'modern-kick' }, null, { note: 'C2', instrument: 'modern-kick' }, null,
        { note: 'D2', instrument: 'modern-snare' }, null, { note: 'D2', instrument: 'modern-snare' }, null,
      ],
    },
  ],
};

// Level 5: Infernal Caldera - Modern High-Octane Darksynth ("Typhon's Awakening")
export const MODERN_TRACK_LEVEL_5: MusicTrack = {
  id: 'level-5',
  name: 'Infernal Caldera',
  subtitle: "Typhon's Awakening (Peak Overdrive Electro)",
  bpm: 136,
  stepsPerBeat: 4,
  loop: true,
  style: 'modern',
  channels: [
    // Blistering Fast Electro Lead
    {
      name: 'Modern Lead - Overdrive Synth',
      waveform: 'sawtooth',
      instrument: 'modern-lead',
      volume: 0.4,
      filterCutoff: 4500,
      filterQ: 3.2,
      notes: [
        'F#4', 'G4', 'A4', 'C5', 'F#4', 'G4', 'A4', 'C5',
        'Eb5', 'D5', 'C5', 'A4', 'G4', 'F#4', 'G4', 'Eb4',
        'F#4', 'A4', 'C5', 'Eb5', 'F#5', 'Eb5', 'C5', 'A4',
        'C5', 'A4', 'F#4', 'Eb4', 'D4', 'C4', 'B3', 'C4',

        'D5', 'C5', 'Bb4', 'A4', 'G4', 'F4', 'Eb4', 'D4',
        'Eb5', 'D5', 'C5', 'Bb4', 'A4', 'G4', 'F#4', 'G4',
        'F#5', 'Eb5', 'C5', 'A4', 'G4', 'F#4', 'Eb4', 'C4',
        'F#4', null, null, null, null, null, null, null,
      ],
    },
    // High-Voltage Synth Arp
    {
      name: 'Modern Pluck - Overdrive Arp',
      waveform: 'sawtooth',
      instrument: 'modern-pluck',
      volume: 0.28,
      filterCutoff: 3200,
      notes: [
        'F#3', 'A3', 'C4', 'Eb4', 'F#3', 'A3', 'C4', 'Eb4',
        'G3', 'Bb3', 'D4', 'F4', 'G3', 'Bb3', 'D4', 'F4',
        'F#3', 'A3', 'C4', 'Eb4', 'F#3', 'A3', 'C4', 'Eb4',
        'C3', 'Eb3', 'F#3', 'A3', 'D3', 'F#3', 'A3', 'C4',

        'Bb3', 'D4', 'F4', 'Bb4', 'A3', 'C4', 'Eb4', 'A4',
        'G3', 'Bb3', 'D4', 'G4', 'Eb3', 'G3', 'Bb3', 'Eb4',
        'F#3', 'A3', 'C4', 'Eb4', 'C3', 'Eb3', 'F#3', 'A3',
        'F#3', 'A3', 'C4', 'F#4', 'F#3', null, null, null,
      ],
    },
    // Galloping Modern Synth Bass
    {
      name: 'Modern Bass - Pumping Bass',
      waveform: 'sawtooth',
      instrument: 'modern-bass',
      volume: 0.58,
      filterCutoff: 1200,
      notes: [
        'F#2', 'F#2', 'F#2', 'F#2', 'F#2', 'F#2', 'F#2', 'F#2',
        'G2', 'G2', 'G2', 'G2', 'Eb2', 'Eb2', 'Eb2', 'Eb2',
        'F#2', 'F#2', 'F#2', 'F#2', 'F#2', 'F#2', 'F#2', 'F#2',
        'C2', 'C2', 'Eb2', 'Eb2', 'D2', 'D2', 'C2', 'C2',

        'Bb2', 'Bb2', 'Bb2', 'Bb2', 'A2', 'A2', 'A2', 'A2',
        'G2', 'G2', 'G2', 'G2', 'Eb2', 'Eb2', 'Eb2', 'Eb2',
        'F#2', 'F#2', 'F#2', 'F#2', 'C2', 'C2', 'C2', 'C2',
        'F#1', 'F#1', 'F#2', 'F#2', 'F#1', null, null, null,
      ],
    },
    // Furious Modern Beat
    {
      name: 'Modern Drums - Fast Groove',
      waveform: 'sine',
      instrument: 'modern-kick',
      volume: 0.55,
      notes: [
        { note: 'C2', instrument: 'modern-kick' }, null, { note: 'C2', instrument: 'modern-kick' }, null,
        { note: 'D2', instrument: 'modern-snare' }, null, { note: 'C2', instrument: 'modern-kick' }, null,
        { note: 'C2', instrument: 'modern-kick' }, null, { note: 'C2', instrument: 'modern-kick' }, null,
        { note: 'D2', instrument: 'modern-snare' }, { note: 'D2', instrument: 'modern-snare' }, { note: 'C2', instrument: 'modern-kick' }, null,

        { note: 'C2', instrument: 'modern-kick' }, null, { note: 'C2', instrument: 'modern-kick' }, null,
        { note: 'D2', instrument: 'modern-snare' }, null, { note: 'C2', instrument: 'modern-kick' }, null,
        { note: 'C2', instrument: 'modern-kick' }, null, { note: 'C2', instrument: 'modern-kick' }, null,
        { note: 'D2', instrument: 'modern-snare' }, { note: 'C2', instrument: 'modern-kick' }, { note: 'D2', instrument: 'modern-snare' }, { note: 'D2', instrument: 'modern-snare' },

        { note: 'C2', instrument: 'modern-kick' }, null, { note: 'C2', instrument: 'modern-kick' }, null,
        { note: 'D2', instrument: 'modern-snare' }, null, { note: 'C2', instrument: 'modern-kick' }, null,
        { note: 'C2', instrument: 'modern-kick' }, null, { note: 'C2', instrument: 'modern-kick' }, null,
        { note: 'D2', instrument: 'modern-snare' }, { note: 'D2', instrument: 'modern-snare' }, { note: 'C2', instrument: 'modern-kick' }, null,

        { note: 'C2', instrument: 'modern-kick' }, null, { note: 'C2', instrument: 'modern-kick' }, null,
        { note: 'D2', instrument: 'modern-snare' }, null, { note: 'C2', instrument: 'modern-kick' }, null,
        { note: 'C2', instrument: 'modern-kick' }, { note: 'C2', instrument: 'modern-kick' }, { note: 'D2', instrument: 'modern-snare' }, { note: 'D2', instrument: 'modern-snare' },
        { note: 'C2', instrument: 'modern-kick' }, null, null, null,
      ],
    },
    // Relentless 16th Hi-Hats
    {
      name: 'Modern Drums - Fast Hats',
      waveform: 'noise',
      instrument: 'modern-hihat',
      volume: 0.35,
      notes: [
        'C4', 'C4', 'C4', 'C4', 'C4', 'C4', 'C4', 'C4',
        'C4', 'C4', 'C4', 'C4', 'C4', 'C4', 'C4', { note: 'C4', instrument: 'modern-openhat' },
        'C4', 'C4', 'C4', 'C4', 'C4', 'C4', 'C4', 'C4',
        'C4', 'C4', 'C4', 'C4', 'C4', 'C4', 'C4', { note: 'C4', instrument: 'modern-openhat' },

        'C4', 'C4', 'C4', 'C4', 'C4', 'C4', 'C4', 'C4',
        'C4', 'C4', 'C4', 'C4', 'C4', 'C4', 'C4', { note: 'C4', instrument: 'modern-openhat' },
        'C4', 'C4', 'C4', 'C4', 'C4', 'C4', 'C4', 'C4',
        'C4', 'C4', 'C4', 'C4', { note: 'C4', instrument: 'modern-openhat' }, null, 'C4', null,
      ],
    },
  ],
};

// ============================================================================
// Track Catalogs & Lookup
// ============================================================================

export const CHIPTUNE_LEVEL_TRACKS: Record<string, MusicTrack> = {
  'level-1': CHIPTUNE_TRACK_LEVEL_1,
  'level-2': CHIPTUNE_TRACK_LEVEL_2,
  'level-3': CHIPTUNE_TRACK_LEVEL_3,
  'level-4': CHIPTUNE_TRACK_LEVEL_4,
  'level-5': CHIPTUNE_TRACK_LEVEL_5,
};

export const MODERN_LEVEL_TRACKS: Record<string, MusicTrack> = {
  'level-1': MODERN_TRACK_LEVEL_1,
  'level-2': MODERN_TRACK_LEVEL_2,
  'level-3': MODERN_TRACK_LEVEL_3,
  'level-4': MODERN_TRACK_LEVEL_4,
  'level-5': MODERN_TRACK_LEVEL_5,
};

// Default LEVEL_TRACKS catalog (supports both or defaults to modern)
export const LEVEL_TRACKS: Record<string, MusicTrack> = {
  'level-1': MODERN_TRACK_LEVEL_1,
  'level-2': MODERN_TRACK_LEVEL_2,
  'level-3': MODERN_TRACK_LEVEL_3,
  'level-4': MODERN_TRACK_LEVEL_4,
  'level-5': MODERN_TRACK_LEVEL_5,
};

/**
 * Retrieves the track for a level based on the selected soundtrack mode ('modern' or '8bit').
 */
export function getTrackForLevel(
  levelId: string,
  mode: SoundtrackMode = 'modern'
): MusicTrack {
  const catalog = mode === '8bit' ? CHIPTUNE_LEVEL_TRACKS : MODERN_LEVEL_TRACKS;
  return catalog[levelId] ?? (mode === '8bit' ? CHIPTUNE_TRACK_LEVEL_1 : MODERN_TRACK_LEVEL_1);
}
