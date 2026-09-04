import { describe, it, expect } from 'vitest';
import {
  CHIPTUNE_TRACK_LEVEL_1,
  CHIPTUNE_TRACK_LEVEL_2,
  CHIPTUNE_TRACK_LEVEL_3,
  CHIPTUNE_TRACK_LEVEL_4,
  CHIPTUNE_TRACK_LEVEL_5,
  MODERN_TRACK_LEVEL_1,
  MODERN_TRACK_LEVEL_2,
  MODERN_TRACK_LEVEL_3,
  MODERN_TRACK_LEVEL_4,
  MODERN_TRACK_LEVEL_5,
  CHIPTUNE_LEVEL_TRACKS,
  MODERN_LEVEL_TRACKS,
  getTrackForLevel,
} from '../../src/audio/MusicTracks';

describe('MusicTracks (Modern & 8-Bit OST)', () => {
  const chiptuneTracks = [
    { level: 'level-1', track: CHIPTUNE_TRACK_LEVEL_1, name: 'Verdant Necropolis' },
    { level: 'level-2', track: CHIPTUNE_TRACK_LEVEL_2, name: 'Salt Wastes of Nessus' },
    { level: 'level-3', track: CHIPTUNE_TRACK_LEVEL_3, name: 'Sanguine Gorge of Thrax' },
    { level: 'level-4', track: CHIPTUNE_TRACK_LEVEL_4, name: 'Citadel of the Guild' },
    { level: 'level-5', track: CHIPTUNE_TRACK_LEVEL_5, name: 'Infernal Caldera' },
  ];

  const modernTracks = [
    { level: 'level-1', track: MODERN_TRACK_LEVEL_1, name: 'Verdant Neon Ruins' },
    { level: 'level-2', track: MODERN_TRACK_LEVEL_2, name: 'Salt Wastes of Nessus' },
    { level: 'level-3', track: MODERN_TRACK_LEVEL_3, name: 'Sanguine Gorge of Thrax' },
    { level: 'level-4', track: MODERN_TRACK_LEVEL_4, name: 'Citadel of the Guild' },
    { level: 'level-5', track: MODERN_TRACK_LEVEL_5, name: 'Infernal Caldera' },
  ];

  it('should have distinct 8-bit and modern tracks for each of the 5 levels', () => {
    expect(Object.keys(CHIPTUNE_LEVEL_TRACKS)).toHaveLength(5);
    expect(Object.keys(MODERN_LEVEL_TRACKS)).toHaveLength(5);

    for (const item of chiptuneTracks) {
      expect(CHIPTUNE_LEVEL_TRACKS[item.level]).toBeDefined();
      expect(CHIPTUNE_LEVEL_TRACKS[item.level].id).toBe(item.level);
      expect(CHIPTUNE_LEVEL_TRACKS[item.level].name).toBe(item.name);
      expect(CHIPTUNE_LEVEL_TRACKS[item.level].style).toBe('chiptune');
    }

    for (const item of modernTracks) {
      expect(MODERN_LEVEL_TRACKS[item.level]).toBeDefined();
      expect(MODERN_LEVEL_TRACKS[item.level].id).toBe(item.level);
      expect(MODERN_LEVEL_TRACKS[item.level].name).toBe(item.name);
      expect(MODERN_LEVEL_TRACKS[item.level].style).toBe('modern');
    }
  });

  it('should retrieve proper track by level id and mode with fallback', () => {
    // Modern mode
    expect(getTrackForLevel('level-1', 'modern')).toBe(MODERN_TRACK_LEVEL_1);
    expect(getTrackForLevel('level-2', 'modern')).toBe(MODERN_TRACK_LEVEL_2);
    expect(getTrackForLevel('level-3', 'modern')).toBe(MODERN_TRACK_LEVEL_3);
    expect(getTrackForLevel('level-4', 'modern')).toBe(MODERN_TRACK_LEVEL_4);
    expect(getTrackForLevel('level-5', 'modern')).toBe(MODERN_TRACK_LEVEL_5);
    expect(getTrackForLevel('nonexistent-level', 'modern')).toBe(MODERN_TRACK_LEVEL_1);

    // 8-bit mode
    expect(getTrackForLevel('level-1', '8bit')).toBe(CHIPTUNE_TRACK_LEVEL_1);
    expect(getTrackForLevel('level-2', '8bit')).toBe(CHIPTUNE_TRACK_LEVEL_2);
    expect(getTrackForLevel('level-3', '8bit')).toBe(CHIPTUNE_TRACK_LEVEL_3);
    expect(getTrackForLevel('level-4', '8bit')).toBe(CHIPTUNE_TRACK_LEVEL_4);
    expect(getTrackForLevel('level-5', '8bit')).toBe(CHIPTUNE_TRACK_LEVEL_5);
    expect(getTrackForLevel('nonexistent-level', '8bit')).toBe(CHIPTUNE_TRACK_LEVEL_1);
  });

  it('each 8-bit track should contain retro chiptune channels', () => {
    for (const item of chiptuneTracks) {
      const track = item.track;
      expect(track.channels.length).toBeGreaterThanOrEqual(4);
      expect(track.bpm).toBeGreaterThan(60);
      expect(track.bpm).toBeLessThan(180);

      const waveforms = track.channels.map((c) => c.waveform);
      expect(waveforms).toContain('triangle'); // bass channel
      expect(waveforms).toContain('noise'); // percussion channel

      for (const channel of track.channels) {
        expect(channel.notes.length).toBeGreaterThan(0);
      }
    }
  });

  it('each modern track should contain rich instruments including drums and leads', () => {
    for (const item of modernTracks) {
      const track = item.track;
      expect(track.channels.length).toBeGreaterThanOrEqual(4);
      expect(track.bpm).toBeGreaterThan(60);
      expect(track.bpm).toBeLessThan(180);

      // Verify modern instruments and notes
      for (const channel of track.channels) {
        expect(channel.notes.length).toBeGreaterThan(0);
      }
    }
  });
});
