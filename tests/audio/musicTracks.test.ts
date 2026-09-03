import { describe, it, expect } from 'vitest';
import {
  TRACK_LEVEL_1,
  TRACK_LEVEL_2,
  TRACK_LEVEL_3,
  TRACK_LEVEL_4,
  TRACK_LEVEL_5,
  LEVEL_TRACKS,
  getTrackForLevel,
} from '../../src/audio/MusicTracks';

describe('MusicTracks (Dying Earth / Book of the New Sun OST)', () => {
  const allTracks = [
    { level: 'level-1', track: TRACK_LEVEL_1, name: 'Verdant Necropolis' },
    { level: 'level-2', track: TRACK_LEVEL_2, name: 'Salt Wastes of Nessus' },
    { level: 'level-3', track: TRACK_LEVEL_3, name: 'Sanguine Gorge of Thrax' },
    { level: 'level-4', track: TRACK_LEVEL_4, name: 'Citadel of the Guild' },
    { level: 'level-5', track: TRACK_LEVEL_5, name: 'Infernal Caldera' },
  ];

  it('should have a distinct track for each of the 5 levels', () => {
    expect(Object.keys(LEVEL_TRACKS)).toHaveLength(5);
    for (const item of allTracks) {
      expect(LEVEL_TRACKS[item.level]).toBeDefined();
      expect(LEVEL_TRACKS[item.level].id).toBe(item.level);
      expect(LEVEL_TRACKS[item.level].name).toBe(item.name);
    }
  });

  it('should retrieve proper track by level id with fallback', () => {
    expect(getTrackForLevel('level-1')).toBe(TRACK_LEVEL_1);
    expect(getTrackForLevel('level-2')).toBe(TRACK_LEVEL_2);
    expect(getTrackForLevel('level-3')).toBe(TRACK_LEVEL_3);
    expect(getTrackForLevel('level-4')).toBe(TRACK_LEVEL_4);
    expect(getTrackForLevel('level-5')).toBe(TRACK_LEVEL_5);
    expect(getTrackForLevel('nonexistent-level')).toBe(TRACK_LEVEL_1);
  });

  it('each level track should contain 4 chiptune channels (lead, harmony/arp, bass, noise)', () => {
    for (const item of allTracks) {
      const track = item.track;
      expect(track.channels.length).toBeGreaterThanOrEqual(4);
      expect(track.bpm).toBeGreaterThan(60);
      expect(track.bpm).toBeLessThan(180);

      const waveforms = track.channels.map((c) => c.waveform);
      expect(waveforms).toContain('triangle'); // bass channel
      expect(waveforms).toContain('noise'); // percussion channel
      expect(track.channels.some((c) => c.waveform === 'square' || c.waveform === 'sawtooth' || c.waveform === 'pulse')).toBe(true);

      for (const channel of track.channels) {
        expect(channel.notes.length).toBeGreaterThan(0);
      }
    }
  });
});
