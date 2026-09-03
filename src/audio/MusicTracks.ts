/**
 * MusicTracks
 * 8-Bit Chiptune compositions for each level in the game, evoking the somber,
 * archaic, and decaying atmosphere of Gene Wolfe's 'The Book of the New Sun'
 * and the Dying Earth genre.
 */

import { MusicTrack } from './types';

// ============================================================================
// LEVEL 1: Emerald Plains ("The Verdant Necropolis of Gyoll")
// Mood: Somber, ancient moss-covered ruins beneath a dim red sun.
// Key: E Minor / Dorian | BPM: 92 | Steps: 32 (2 bars of 16 steps)
// ============================================================================
export const TRACK_LEVEL_1: MusicTrack = {
  id: 'level-1',
  name: 'Verdant Necropolis',
  subtitle: 'Lament for Gyoll',
  bpm: 92,
  stepsPerBeat: 4,
  loop: true,
  channels: [
    // Lead Channel (Melancholy flute/spire melody)
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
    // Arpeggio / Harmony Channel (Ancient broken chords)
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
    // Bass Channel (Deep archaic triangle drone)
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
    // Percussion Channel (Gentle decaying noise rustle)
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

// ============================================================================
// LEVEL 2: Sunbaked Dunes ("Salt Wastes of Nessus")
// Mood: Desolate, wind-swept sands, buried titanium starship hulls.
// Key: D Phrygian | BPM: 100 | Steps: 64
// ============================================================================
export const TRACK_LEVEL_2: MusicTrack = {
  id: 'level-2',
  name: 'Salt Wastes of Nessus',
  subtitle: 'Echoes of Buried Hulls',
  bpm: 100,
  stepsPerBeat: 4,
  loop: true,
  channels: [
    // Lead Channel (Arid Phrygian desert motif with eerie half-steps)
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
    // Ostinato / Harmony Channel
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
    // Bass Channel (Hollow resonant desert drone)
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
    // Percussion Channel (Scuttling sand clicks and dry kicks)
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

// ============================================================================
// LEVEL 3: Crag Canyon ("Sanguine Gorge of Thrax")
// Mood: Menacing, blood-red chasm, heavy march of chthonic automata.
// Key: C Minor / Locrian | BPM: 116 | Steps: 64
// ============================================================================
export const TRACK_LEVEL_3: MusicTrack = {
  id: 'level-3',
  name: 'Sanguine Gorge of Thrax',
  subtitle: 'March of the Executioners',
  bpm: 116,
  stepsPerBeat: 4,
  loop: true,
  channels: [
    // Lead Channel (Aggressive, jagged minor leaps)
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
    // Arp Channel (Relentless mechanical stabs)
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
    // Bass Channel (Heavy driving march)
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
    // Percussion Channel (Driving military snare & kick)
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

// ============================================================================
// LEVEL 4: Iron Stronghold ("Citadel of the Guild")
// Mood: Stately, ceremonial gothic hymn, fuligin-clad grandeur.
// Key: A Minor / Dorian #4 | BPM: 84 | Steps: 64
// ============================================================================
export const TRACK_LEVEL_4: MusicTrack = {
  id: 'level-4',
  name: 'Citadel of the Guild',
  subtitle: 'Hymn of the Fuligin Robes',
  bpm: 84,
  stepsPerBeat: 4,
  loop: true,
  channels: [
    // Lead Channel (Gothic organ-like counterpoint)
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
    // Harmony Channel (Baroque solemn polyphony)
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
    // Bass Channel (Deliberate walking bass)
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
    // Percussion Channel (Measured ceremonial pacing)
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

// ============================================================================
// LEVEL 5: Infernal Caldera ("Typhon's Crucible")
// Mood: Blistering battle speed, magma core, apocalyptic titan showdown.
// Key: F# Locrian / Diminished | BPM: 132 | Steps: 64
// ============================================================================
export const TRACK_LEVEL_5: MusicTrack = {
  id: 'level-5',
  name: 'Infernal Caldera',
  subtitle: "Typhon's Awakening",
  bpm: 132,
  stepsPerBeat: 4,
  loop: true,
  channels: [
    // Lead Channel (Blistering fast runs & apocalyptic urgency)
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
    // Arp Channel (Pulsing high-speed technomantic energy)
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
    // Bass Channel (Double-time galloping battle bass)
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
    // Percussion Channel (Relentless battle beat)
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

// ============================================================================
// Catalog of all Level Tracks
// ============================================================================
export const LEVEL_TRACKS: Record<string, MusicTrack> = {
  'level-1': TRACK_LEVEL_1,
  'level-2': TRACK_LEVEL_2,
  'level-3': TRACK_LEVEL_3,
  'level-4': TRACK_LEVEL_4,
  'level-5': TRACK_LEVEL_5,
};

export function getTrackForLevel(levelId: string): MusicTrack {
  return LEVEL_TRACKS[levelId] ?? TRACK_LEVEL_1;
}
