import {
  type GameProgress,
  DEFAULT_PROGRESS,
} from '@/storage/StorageSchema';
import { StorageService } from '@/storage/StorageService';

export interface VictoryResult {
  isNewHighScore: boolean;
  starsAwarded: number;
  newlyUnlockedLevel?: string;
}

export type ProgressListener = (progress: Readonly<GameProgress>) => void;

export class ProgressionManager {
  private readonly storageService: StorageService;
  private currentProgress: GameProgress;
  private readonly listeners: Set<ProgressListener> = new Set();

  constructor(storageService?: StorageService) {
    this.storageService = storageService ?? new StorageService();
    this.currentProgress = { ...this.storageService.getProgress() };
  }

  public getProgress(): Readonly<GameProgress> {
    return {
      highScores: { ...this.currentProgress.highScores },
      completedLevels: [...this.currentProgress.completedLevels],
      unlockedTowers: [...this.currentProgress.unlockedTowers],
      starRatings: { ...this.currentProgress.starRatings },
      unlockedLevels: [...this.currentProgress.unlockedLevels],
    };
  }

  public getHighScore(mapId: string): number {
    return this.currentProgress.highScores[mapId] ?? 0;
  }

  public getStarRating(mapId: string): number {
    return this.currentProgress.starRatings[mapId] ?? 0;
  }

  public isLevelCompleted(mapId: string): boolean {
    return this.currentProgress.completedLevels.includes(mapId);
  }

  public isLevelUnlocked(mapId: string): boolean {
    return this.currentProgress.unlockedLevels.includes(mapId);
  }

  public isTowerUnlocked(towerId: string): boolean {
    return this.currentProgress.unlockedTowers.includes(towerId);
  }

  public recordScore(mapId: string, score: number): boolean {
    const currentHigh = this.getHighScore(mapId);
    if (score > currentHigh) {
      this.currentProgress.highScores[mapId] = score;
      this.persistAndNotify();
      return true;
    }
    return false;
  }

  public setStarRating(mapId: string, stars: number): boolean {
    const clampedStars = Math.max(0, Math.min(3, Math.floor(stars)));
    const currentStars = this.getStarRating(mapId);
    if (clampedStars > currentStars) {
      this.currentProgress.starRatings[mapId] = clampedStars;
      this.persistAndNotify();
      return true;
    }
    return false;
  }

  public unlockLevel(mapId: string): boolean {
    if (!this.currentProgress.unlockedLevels.includes(mapId)) {
      this.currentProgress.unlockedLevels.push(mapId);
      this.persistAndNotify();
      return true;
    }
    return false;
  }

  public unlockTower(towerId: string): boolean {
    if (!this.currentProgress.unlockedTowers.includes(towerId)) {
      this.currentProgress.unlockedTowers.push(towerId);
      this.persistAndNotify();
      return true;
    }
    return false;
  }

  public recordVictory(
    mapId: string,
    score: number,
    stars: number = 1,
    nextLevelId?: string
  ): VictoryResult {
    let isNewHighScore = false;
    const currentHigh = this.getHighScore(mapId);
    if (score > currentHigh) {
      this.currentProgress.highScores[mapId] = score;
      isNewHighScore = true;
    }

    if (!this.currentProgress.completedLevels.includes(mapId)) {
      this.currentProgress.completedLevels.push(mapId);
    }

    const clampedStars = Math.max(1, Math.min(3, Math.floor(stars)));
    const currentStars = this.getStarRating(mapId);
    let starsAwarded = currentStars;
    if (clampedStars > currentStars) {
      this.currentProgress.starRatings[mapId] = clampedStars;
      starsAwarded = clampedStars;
    }

    let newlyUnlockedLevel: string | undefined;
    if (nextLevelId && !this.currentProgress.unlockedLevels.includes(nextLevelId)) {
      this.currentProgress.unlockedLevels.push(nextLevelId);
      newlyUnlockedLevel = nextLevelId;
    }

    this.persistAndNotify();

    return {
      isNewHighScore,
      starsAwarded,
      newlyUnlockedLevel,
    };
  }

  public resetProgress(): void {
    this.currentProgress = {
      highScores: { ...DEFAULT_PROGRESS.highScores },
      completedLevels: [...DEFAULT_PROGRESS.completedLevels],
      unlockedTowers: [...DEFAULT_PROGRESS.unlockedTowers],
      starRatings: { ...DEFAULT_PROGRESS.starRatings },
      unlockedLevels: [...DEFAULT_PROGRESS.unlockedLevels],
    };
    this.persistAndNotify();
  }

  public subscribe(listener: ProgressListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private persistAndNotify(): void {
    this.storageService.saveProgress(this.currentProgress);

    const snapshot = this.getProgress();
    for (const listener of this.listeners) {
      try {
        listener(snapshot);
      } catch (err) {
        console.error('[ProgressionManager] Error in progress listener:', err);
      }
    }
  }
}
