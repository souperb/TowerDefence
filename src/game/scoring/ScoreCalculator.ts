export interface CreepScoreOptions {
  speedMultiplier?: number;
  difficultyMultiplier?: number;
  bonusMultiplier?: number;
  streakBonus?: number;
}

export interface WaveClearScoreOptions {
  remainingLives?: number;
  perfectClear?: boolean;
  baseWavePoints?: number;
  speedMultiplier?: number;
  difficultyMultiplier?: number;
}

/**
 * Utility class for computing deterministic score awards based on creep value,
 * game speed multipliers, difficulty modifiers, and clear bonuses.
 */
export class ScoreCalculator {
  /**
   * Calculates score points for defeating a creep.
   */
  public static calculateCreepKillScore(
    baseScoreValue: number,
    options: CreepScoreOptions = {}
  ): number {
    if (baseScoreValue <= 0) return 0;

    const speed = options.speedMultiplier ?? 1.0;
    const difficulty = options.difficultyMultiplier ?? 1.0;
    const bonus = options.bonusMultiplier ?? 1.0;
    const streak = options.streakBonus ?? 0;

    const scaledScore = baseScoreValue * speed * difficulty * bonus + streak;
    return Math.max(0, Math.round(scaledScore));
  }

  /**
   * Calculates bonus score points for completing a wave.
   */
  public static calculateWaveClearScore(
    waveIndex: number,
    options: WaveClearScoreOptions = {}
  ): number {
    if (waveIndex <= 0) return 0;

    const basePoints = options.baseWavePoints ?? 100;
    const speed = options.speedMultiplier ?? 1.0;
    const difficulty = options.difficultyMultiplier ?? 1.0;
    const livesBonus = (options.remainingLives ?? 0) * 10;
    const perfectMultiplier = options.perfectClear ? 1.5 : 1.0;

    const rawScore = (basePoints * waveIndex * perfectMultiplier + livesBonus) * speed * difficulty;
    return Math.max(0, Math.round(rawScore));
  }
}
