import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ScoreCalculator } from '../../src/game/scoring/ScoreCalculator';
import { ScoreManager } from '../../src/game/scoring/ScoreManager';
import { EventBus } from '../../src/core/events/EngineEvents';

describe('ScoreCalculator (US-06 / TASK-06-02)', () => {
  describe('calculateCreepKillScore', () => {
    it('should calculate base score with default 1.0 multipliers', () => {
      const score = ScoreCalculator.calculateCreepKillScore(20);
      expect(score).toBe(20);
    });

    it('should return 0 for non-positive base score values', () => {
      expect(ScoreCalculator.calculateCreepKillScore(0)).toBe(0);
      expect(ScoreCalculator.calculateCreepKillScore(-10)).toBe(0);
    });

    it('should apply speedMultiplier correctly', () => {
      const scoreNormal = ScoreCalculator.calculateCreepKillScore(50, { speedMultiplier: 1.0 });
      const scoreFast = ScoreCalculator.calculateCreepKillScore(50, { speedMultiplier: 2.0 });
      const scoreHalf = ScoreCalculator.calculateCreepKillScore(50, { speedMultiplier: 0.5 });

      expect(scoreNormal).toBe(50);
      expect(scoreFast).toBe(100);
      expect(scoreHalf).toBe(25);
    });

    it('should apply difficultyMultiplier correctly', () => {
      const scoreHard = ScoreCalculator.calculateCreepKillScore(40, { difficultyMultiplier: 1.5 });
      expect(scoreHard).toBe(60);
    });

    it('should combine speed, difficulty, bonusMultiplier and streakBonus', () => {
      // 30 * 2.0 (speed) * 1.5 (diff) * 1.2 (bonus) + 10 (streak)
      // 30 * 2 * 1.5 * 1.2 = 108; + 10 = 118
      const score = ScoreCalculator.calculateCreepKillScore(30, {
        speedMultiplier: 2.0,
        difficultyMultiplier: 1.5,
        bonusMultiplier: 1.2,
        streakBonus: 10,
      });
      expect(score).toBe(118);
    });
  });

  describe('calculateWaveClearScore', () => {
    it('should calculate wave clear score with default multipliers', () => {
      // 100 * wave 1 = 100
      const score = ScoreCalculator.calculateWaveClearScore(1);
      expect(score).toBe(100);
    });

    it('should return 0 for non-positive wave indices', () => {
      expect(ScoreCalculator.calculateWaveClearScore(0)).toBe(0);
      expect(ScoreCalculator.calculateWaveClearScore(-1)).toBe(0);
    });

    it('should scale by wave index and remaining lives', () => {
      // wave 3: base 100 * 3 = 300; remainingLives: 15 * 10 = 150 -> 450
      const score = ScoreCalculator.calculateWaveClearScore(3, { remainingLives: 15 });
      expect(score).toBe(450);
    });

    it('should apply perfectClear bonus multiplier and difficulty', () => {
      // wave 2: base 100 * 2 * 1.5 (perfect) = 300; lives: 20 * 10 = 200; total raw = 500
      // diff = 1.5 -> 750
      const score = ScoreCalculator.calculateWaveClearScore(2, {
        remainingLives: 20,
        perfectClear: true,
        difficultyMultiplier: 1.5,
      });
      expect(score).toBe(750);
    });
  });
});

describe('ScoreManager (US-06 / TASK-06-02 & TASK-06-03)', () => {
  let eventBus: EventBus;
  let scoreManager: ScoreManager;

  beforeEach(() => {
    eventBus = new EventBus();
    scoreManager = new ScoreManager(0, { eventBus });
  });

  describe('Initialization and Multipliers', () => {
    it('should initialize with score 0 and default multipliers', () => {
      expect(scoreManager.getScore()).toBe(0);
      expect(scoreManager.getKillCount()).toBe(0);
      expect(scoreManager.getSpeedMultiplier()).toBe(1.0);
      expect(scoreManager.getDifficultyMultiplier()).toBe(1.0);
    });

    it('should accept initial configuration options', () => {
      const customManager = new ScoreManager(100, {
        speedMultiplier: 2.0,
        difficultyMultiplier: 1.5,
      });
      expect(customManager.getScore()).toBe(100);
      expect(customManager.getSpeedMultiplier()).toBe(2.0);
      expect(customManager.getDifficultyMultiplier()).toBe(1.5);
    });

    it('should throw error when initial score or multipliers are negative', () => {
      expect(() => new ScoreManager(-10)).toThrow('Initial score cannot be negative');
      expect(() => scoreManager.setSpeedMultiplier(-1)).toThrow('Speed multiplier cannot be negative');
      expect(() => scoreManager.setDifficultyMultiplier(-0.5)).toThrow('Difficulty multiplier cannot be negative');
    });

    it('should update and get state snapshot', () => {
      scoreManager.setSpeedMultiplier(1.5);
      scoreManager.setDifficultyMultiplier(1.2);
      expect(scoreManager.getState()).toEqual({
        score: 0,
        killCount: 0,
        speedMultiplier: 1.5,
        difficultyMultiplier: 1.2,
      });
    });
  });

  describe('Score Accumulation & Kills', () => {
    it('should add creep kill score and increment kill count', () => {
      const points1 = scoreManager.addCreepKillScore(20);
      expect(points1).toBe(20);
      expect(scoreManager.getScore()).toBe(20);
      expect(scoreManager.getKillCount()).toBe(1);

      const points2 = scoreManager.addCreepKillScore(40);
      expect(points2).toBe(40);
      expect(scoreManager.getScore()).toBe(60);
      expect(scoreManager.getKillCount()).toBe(2);
    });

    it('should calculate creep kill score taking current multipliers into account', () => {
      scoreManager.setSpeedMultiplier(2.0);
      scoreManager.setDifficultyMultiplier(1.5);

      // base 50 * 2.0 * 1.5 = 150
      const awarded = scoreManager.addCreepKillScore(50);
      expect(awarded).toBe(150);
      expect(scoreManager.getScore()).toBe(150);
    });

    it('should add wave clear score to total', () => {
      const awarded = scoreManager.addWaveClearScore(1, { remainingLives: 10 });
      // 100 * 1 + 10 * 10 = 200
      expect(awarded).toBe(200);
      expect(scoreManager.getScore()).toBe(200);
    });

    it('should support direct addScore and setScore', () => {
      scoreManager.addScore(500, 'bonus');
      expect(scoreManager.getScore()).toBe(500);

      scoreManager.setScore(1000);
      expect(scoreManager.getScore()).toBe(1000);
    });

    it('should throw error on negative addScore or setScore', () => {
      expect(() => scoreManager.addScore(-5)).toThrow('Score to add cannot be negative');
      expect(() => scoreManager.setScore(-10)).toThrow('Score cannot be negative');
    });

    it('should reset score and kill count', () => {
      scoreManager.addCreepKillScore(50);
      scoreManager.addCreepKillScore(30);
      expect(scoreManager.getKillCount()).toBe(2);

      scoreManager.reset(0);
      expect(scoreManager.getScore()).toBe(0);
      expect(scoreManager.getKillCount()).toBe(0);
    });
  });

  describe('Event Bus & Callback Notifications', () => {
    it('should invoke direct listeners when score changes', () => {
      const listener = vi.fn();
      scoreManager.onScoreChanged(listener);

      scoreManager.addScore(50, 'bonus');
      expect(listener).toHaveBeenCalledWith(50, 50, 'bonus');

      scoreManager.addCreepKillScore(20);
      expect(listener).toHaveBeenCalledWith(70, 20, 'creep_kill');
    });

    it('should emit SCORE_CHANGED events through EventBus', () => {
      let emittedData: any = null;
      eventBus.on('SCORE_CHANGED', (data) => {
        emittedData = data;
      });

      scoreManager.addCreepKillScore(25);
      expect(emittedData).toEqual({
        currentScore: 25,
        delta: 25,
        source: 'creep_kill',
      });
    });
  });
});
