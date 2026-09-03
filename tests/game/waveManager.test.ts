import { describe, it, expect, beforeEach } from 'vitest';
import { World } from '../../src/core/ecs/World';
import { EventBus } from '../../src/core/events/EngineEvents';
import { WaveDefinition } from '../../src/game/waves/WaveDefinition';
import { WaveSequence } from '../../src/game/waves/WaveSequence';
import { WaveSpawnerSystem } from '../../src/game/systems/WaveSpawnerSystem';
import { GameStateMachine, GameState } from '../../src/game/state/GameStateMachine';
import { WaveManager } from '../../src/game/state/WaveManager';
import { EconomyManager } from '../../src/game/economy/EconomyManager';
import { ScoreManager } from '../../src/game/scoring/ScoreManager';
import {
  CREEP_COMPONENT,
} from '../../src/game/creeps/CreepComponents';

describe('WaveSequence & WaveManager (TASK-08-01)', () => {
  let world: World;
  let eventBus: EventBus;
  let stateMachine: GameStateMachine;
  let economyManager: EconomyManager;
  let scoreManager: ScoreManager;
  let waveManager: WaveManager;
  let spawnerSystem: WaveSpawnerSystem;

  const testWaypoints = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
  ];

  const testWaves: WaveDefinition[] = [
    {
      waveNumber: 1,
      rewardGold: 50,
      rewardScore: 100,
      spawnGroups: [
        {
          creepType: 'basic',
          count: 2,
          intervalSeconds: 0.5,
          startDelaySeconds: 0,
        },
      ],
    },
    {
      waveNumber: 2,
      rewardGold: 75,
      rewardScore: 200,
      spawnGroups: [
        {
          creepType: 'fast',
          count: 3,
          intervalSeconds: 0.4,
          startDelaySeconds: 0,
        },
      ],
    },
  ];

  beforeEach(() => {
    world = new World();
    eventBus = new EventBus();
    stateMachine = new GameStateMachine({ eventBus });
    economyManager = new EconomyManager(300, eventBus);
    scoreManager = new ScoreManager(0, { eventBus });
    spawnerSystem = new WaveSpawnerSystem(testWaves, testWaypoints, eventBus);
    world.addSystem(spawnerSystem);

    waveManager = new WaveManager({
      sequence: testWaves,
      spawnerSystem,
      stateMachine,
      economyManager,
      scoreManager,
      eventBus,
      autoStartDelaySeconds: 5.0,
      autoStartEnabled: true,
      requireManualFirstWave: false,
    });
  });

  describe('WaveSequence', () => {
    it('should initialize and validate wave definitions', () => {
      const sequence = new WaveSequence(testWaves);
      expect(sequence.getTotalWaves()).toBe(2);
      expect(sequence.getTotalCreeps()).toBe(5);
      expect(sequence.getWave(0)?.waveNumber).toBe(1);
      expect(sequence.getWave(1)?.waveNumber).toBe(2);
      expect(sequence.getWave(2)).toBeNull();
      expect(sequence.isLastWave(0)).toBe(false);
      expect(sequence.isLastWave(1)).toBe(true);
      expect(sequence.validate()).toBe(true);
    });

    it('should correctly report invalid sequences', () => {
      const emptySeq = new WaveSequence([]);
      expect(emptySeq.validate()).toBe(false);

      const invalidSeq = new WaveSequence([
        {
          waveNumber: 0,
          spawnGroups: [],
        },
      ]);
      expect(invalidSeq.validate()).toBe(false);
    });
  });

  describe('WaveManager Preparation and Countdown', () => {
    it('should require manual start on wave 1 by default when requireManualFirstWave is true', () => {
      const defaultManager = new WaveManager({
        sequence: testWaves,
        spawnerSystem,
        stateMachine,
        eventBus,
        autoStartDelaySeconds: 5.0,
        autoStartEnabled: true,
      });

      expect(defaultManager.isRequireManualFirstWave()).toBe(true);
      expect(stateMachine.getState()).toBe(GameState.PREPARATION);
      expect(defaultManager.getCurrentWaveIndex()).toBe(0);
      expect(defaultManager.getCountdownRemaining()).toBe(0);

      // Updating world dt should not start wave 1 automatically
      defaultManager.update(world, 10.0);
      expect(stateMachine.getState()).toBe(GameState.PREPARATION);
      expect(spawnerSystem.isSpawningActive()).toBe(false);

      // Must be started manually
      defaultManager.startWaveNow();
      expect(stateMachine.getState()).toBe(GameState.SPAWNING);
      expect(spawnerSystem.isSpawningActive()).toBe(true);
    });

    it('should start with countdown timer when requireManualFirstWave is false', () => {
      expect(stateMachine.getState()).toBe(GameState.PREPARATION);
      expect(waveManager.getCurrentWaveIndex()).toBe(0);
      expect(waveManager.getCurrentWaveNumber()).toBe(1);
      expect(waveManager.getTotalWaves()).toBe(2);
      expect(waveManager.getCountdownRemaining()).toBe(5.0);
    });

    it('should decrement countdown timer on update and emit countdown ticks', () => {
      let tickData: any = null;
      eventBus.on('WAVE_COUNTDOWN_TICK', (data) => {
        tickData = data;
      });

      waveManager.update(world, 1.5);
      expect(waveManager.getCountdownRemaining()).toBeCloseTo(3.5, 2);
      expect(tickData).toEqual({
        remainingSeconds: expect.closeTo(3.5, 2),
        totalDuration: 5.0,
        waveIndex: 0,
      });
    });

    it('should automatically start wave when countdown expires with autoStart enabled', () => {
      // Countdown is 5.0s, update with 5.1s
      waveManager.update(world, 5.1);

      expect(waveManager.getCountdownRemaining()).toBe(0);
      expect(stateMachine.getState()).toBe(GameState.SPAWNING);
      expect(spawnerSystem.isSpawningActive()).toBe(true);
    });

    it('should not auto-start wave if autoStart is disabled', () => {
      waveManager.setAutoStartEnabled(false);
      waveManager.update(world, 6.0);

      expect(waveManager.getCountdownRemaining()).toBe(0);
      expect(stateMachine.getState()).toBe(GameState.PREPARATION);
      expect(spawnerSystem.isSpawningActive()).toBe(false);
    });

    it('should allow manual immediate wave start via startWaveNow()', () => {
      expect(stateMachine.getState()).toBe(GameState.PREPARATION);
      const started = waveManager.startWaveNow();

      expect(started).toBe(true);
      expect(stateMachine.getState()).toBe(GameState.SPAWNING);
      expect(waveManager.getCountdownRemaining()).toBe(0);
      expect(spawnerSystem.isSpawningActive()).toBe(true);
    });

    it('should reject startWaveNow when wave is already active or game paused', () => {
      waveManager.startWaveNow();
      expect(waveManager.startWaveNow()).toBe(false);

      stateMachine.reset(GameState.PAUSED);
      expect(waveManager.startWaveNow()).toBe(false);
    });

    it('should toggle autoStart state via toggleAutoStart()', () => {
      const listener = vi.fn();
      eventBus.on('AUTO_WAVE_CHANGED', listener);

      expect(waveManager.isAutoStartEnabled()).toBe(true);

      const off = waveManager.toggleAutoStart();
      expect(off).toBe(false);
      expect(waveManager.isAutoStartEnabled()).toBe(false);
      expect(listener).toHaveBeenCalledWith({ enabled: false });

      const on = waveManager.toggleAutoStart();
      expect(on).toBe(true);
      expect(waveManager.isAutoStartEnabled()).toBe(true);
      expect(listener).toHaveBeenCalledWith({ enabled: true });
    });
  });

  describe('Wave Progression & Completion Evaluation', () => {
    it('should transition from SPAWNING to IN_PROGRESS when spawns finish but creeps are alive', () => {
      waveManager.startWaveNow(); // Wave 1: 2 basic creeps
      expect(stateMachine.getState()).toBe(GameState.SPAWNING);

      // Tick world to spawn both creeps (at t=0 and t=0.5)
      world.update(1.0);
      expect(spawnerSystem.isWaveSpawningComplete()).toBe(true);
      expect(world.query([CREEP_COMPONENT]).length).toBe(2);

      // Update WaveManager -> evaluates that creeps are alive -> transitions to IN_PROGRESS
      waveManager.update(world, 0.1);
      expect(stateMachine.getState()).toBe(GameState.IN_PROGRESS);
    });

    it('should transition from IN_PROGRESS to WAVE_COMPLETED and prepare next wave when all creeps defeated', () => {
      waveManager.startWaveNow();
      world.update(1.0); // Spawns 2 creeps
      waveManager.update(world, 0.1);
      expect(stateMachine.getState()).toBe(GameState.IN_PROGRESS);

      const creeps = world.query([CREEP_COMPONENT]);
      expect(creeps.length).toBe(2);

      // Defeat both creeps
      for (const creep of creeps) {
        world.destroyEntity(creep);
      }
      expect(world.query([CREEP_COMPONENT]).length).toBe(0);

      // Update WaveManager -> evaluates wave completed, awards gold/score, advances to Wave 2
      const initialGold = economyManager.getGold(); // 300
      const initialScore = scoreManager.getScore(); // 0

      waveManager.update(world, 0.1);

      // Should award wave 1 rewards (50 gold, 100 score)
      expect(economyManager.getGold()).toBe(initialGold + 50);
      expect(scoreManager.getScore()).toBeGreaterThanOrEqual(initialScore + 100);

      // Advances to wave index 1 (Wave 2) and enters PREPARATION
      expect(waveManager.getCurrentWaveIndex()).toBe(1);
      expect(waveManager.getCurrentWaveNumber()).toBe(2);
      expect(stateMachine.getState()).toBe(GameState.PREPARATION);
      expect(waveManager.getCountdownRemaining()).toBe(5.0);
    });

    it('should mark allWavesCleared when final wave is completed', () => {
      // Complete Wave 1
      waveManager.startWaveNow();
      world.update(1.0);
      for (const c of world.query([CREEP_COMPONENT])) world.destroyEntity(c);
      waveManager.update(world, 0.1);

      expect(waveManager.getCurrentWaveIndex()).toBe(1); // Wave 2 (final)

      // Start Wave 2
      waveManager.startWaveNow();
      world.update(1.5); // Spawns all 3 fast creeps
      waveManager.update(world, 0.1);
      expect(stateMachine.getState()).toBe(GameState.IN_PROGRESS);

      // Defeat all creeps of final wave
      for (const c of world.query([CREEP_COMPONENT])) world.destroyEntity(c);

      waveManager.update(world, 0.1);

      expect(stateMachine.getState()).toBe(GameState.WAVE_COMPLETED);
      expect(waveManager.isAllWavesCleared()).toBe(true);
      expect(waveManager.getCurrentWaveIndex()).toBe(1); // Stays on final wave
    });
  });

  describe('Reset and Pause behaviors', () => {
    it('should cleanly reset wave manager to initial state', () => {
      waveManager.startWaveNow();
      world.update(1.0);
      waveManager.update(world, 0.1);

      waveManager.reset();

      expect(waveManager.getCurrentWaveIndex()).toBe(0);
      expect(waveManager.getCurrentWaveNumber()).toBe(1);
      expect(waveManager.isAllWavesCleared()).toBe(false);
      expect(waveManager.getCountdownRemaining()).toBe(5.0);
      expect(stateMachine.getState()).toBe(GameState.PREPARATION);
    });

    it('should freeze countdown timer while game is paused', () => {
      stateMachine.pause();
      expect(stateMachine.isPaused()).toBe(true);

      const timerBefore = waveManager.getCountdownRemaining();
      waveManager.update(world, 2.0);
      expect(waveManager.getCountdownRemaining()).toBe(timerBefore);

      stateMachine.resume();
      expect(stateMachine.isPaused()).toBe(false);
      waveManager.update(world, 1.0);
      expect(waveManager.getCountdownRemaining()).toBeLessThan(timerBefore);
    });
  });
});
