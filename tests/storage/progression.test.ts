import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  StorageService,
  MemoryStorageProvider,
  DEFAULT_PROGRESS,
} from '@/storage';
import { ProgressionManager } from '@/game';

describe('ProgressionManager', () => {
  let memoryProvider: MemoryStorageProvider;
  let storageService: StorageService;
  let progression: ProgressionManager;

  beforeEach(() => {
    memoryProvider = new MemoryStorageProvider();
    storageService = new StorageService(memoryProvider);
    progression = new ProgressionManager(storageService);
  });

  it('should initialize with default progression', () => {
    const progress = progression.getProgress();
    expect(progress.completedLevels).toEqual([]);
    expect(progress.unlockedLevels).toContain('level-1');
    expect(progress.unlockedTowers).toContain('archer');
    expect(progress.unlockedTowers).toContain('cannon');
    expect(progress.unlockedTowers).toContain('mage');
    expect(progression.getHighScore('level-1')).toBe(0);
    expect(progression.getStarRating('level-1')).toBe(0);
    expect(progression.isLevelUnlocked('level-1')).toBe(true);
    expect(progression.isLevelCompleted('level-1')).toBe(false);
  });

  it('should record high scores and only update when beaten', () => {
    const beatenFirstTime = progression.recordScore('map-forest', 1200);
    expect(beatenFirstTime).toBe(true);
    expect(progression.getHighScore('map-forest')).toBe(1200);

    // Lower score should not update
    const beatenLower = progression.recordScore('map-forest', 800);
    expect(beatenLower).toBe(false);
    expect(progression.getHighScore('map-forest')).toBe(1200);

    // Equal score should not update
    const beatenEqual = progression.recordScore('map-forest', 1200);
    expect(beatenEqual).toBe(false);
    expect(progression.getHighScore('map-forest')).toBe(1200);

    // Higher score should update
    const beatenHigher = progression.recordScore('map-forest', 2500);
    expect(beatenHigher).toBe(true);
    expect(progression.getHighScore('map-forest')).toBe(2500);
  });

  it('should record star ratings and clamp between 0 and 3', () => {
    expect(progression.setStarRating('level-1', 2)).toBe(true);
    expect(progression.getStarRating('level-1')).toBe(2);

    // Lower star rating should not overwrite higher
    expect(progression.setStarRating('level-1', 1)).toBe(false);
    expect(progression.getStarRating('level-1')).toBe(2);

    // Higher star rating updates
    expect(progression.setStarRating('level-1', 3)).toBe(true);
    expect(progression.getStarRating('level-1')).toBe(3);

    // Star rating clamped to 3 max
    expect(progression.setStarRating('level-2', 5)).toBe(true);
    expect(progression.getStarRating('level-2')).toBe(3);
  });

  it('should unlock levels and towers', () => {
    expect(progression.isLevelUnlocked('level-2')).toBe(false);
    expect(progression.unlockLevel('level-2')).toBe(true);
    expect(progression.isLevelUnlocked('level-2')).toBe(true);
    expect(progression.unlockLevel('level-2')).toBe(false); // already unlocked

    expect(progression.isTowerUnlocked('tesla')).toBe(false);
    expect(progression.unlockTower('tesla')).toBe(true);
    expect(progression.isTowerUnlocked('tesla')).toBe(true);
    expect(progression.unlockTower('tesla')).toBe(false);
  });

  it('should record level victory and update completion, high score, star rating, and unlock next level', () => {
    const result = progression.recordVictory('level-1', 3000, 3, 'level-2');

    expect(result.isNewHighScore).toBe(true);
    expect(result.starsAwarded).toBe(3);
    expect(result.newlyUnlockedLevel).toBe('level-2');

    expect(progression.isLevelCompleted('level-1')).toBe(true);
    expect(progression.getHighScore('level-1')).toBe(3000);
    expect(progression.getStarRating('level-1')).toBe(3);
    expect(progression.isLevelUnlocked('level-2')).toBe(true);

    // Replay with lower score
    const replayResult = progression.recordVictory('level-1', 2000, 2, 'level-2');
    expect(replayResult.isNewHighScore).toBe(false);
    expect(replayResult.starsAwarded).toBe(3); // previous higher rating maintained
    expect(replayResult.newlyUnlockedLevel).toBeUndefined();
    expect(progression.getHighScore('level-1')).toBe(3000);
  });

  it('should persist progression across reloads / new instances', () => {
    progression.recordVictory('level-1', 4500, 3, 'level-2');
    progression.unlockTower('sniper');

    // Instantiate a fresh ProgressionManager using the same storage service
    const reloadedProgression = new ProgressionManager(storageService);
    expect(reloadedProgression.isLevelCompleted('level-1')).toBe(true);
    expect(reloadedProgression.getHighScore('level-1')).toBe(4500);
    expect(reloadedProgression.getStarRating('level-1')).toBe(3);
    expect(reloadedProgression.isLevelUnlocked('level-2')).toBe(true);
    expect(reloadedProgression.isTowerUnlocked('sniper')).toBe(true);
  });

  it('should notify subscribers when progression changes', () => {
    const listener = vi.fn();
    const unsubscribe = progression.subscribe(listener);

    progression.recordScore('level-1', 1000);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        highScores: expect.objectContaining({ 'level-1': 1000 }),
      })
    );

    progression.unlockTower('laser');
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    progression.unlockTower('mortar');
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('should reset progress to defaults', () => {
    progression.recordVictory('level-1', 5000, 3, 'level-2');
    progression.unlockTower('super_tower');

    progression.resetProgress();
    expect(progression.isLevelCompleted('level-1')).toBe(false);
    expect(progression.getHighScore('level-1')).toBe(0);
    expect(progression.isLevelUnlocked('level-2')).toBe(false);
    expect(progression.isTowerUnlocked('super_tower')).toBe(false);
    expect(progression.getProgress().unlockedLevels).toEqual(DEFAULT_PROGRESS.unlockedLevels);
  });
});
