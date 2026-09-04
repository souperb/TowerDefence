import { describe, it, expect, beforeEach } from 'vitest';
import { World } from '../../src/core/ecs/World';
import { EventBus } from '../../src/core/events/EngineEvents';
import { CreepDeathSystem } from '../../src/game/systems/CreepDeathSystem';
import { EconomyManager } from '../../src/game/economy/EconomyManager';
import { ScoreManager } from '../../src/game/scoring/ScoreManager';
import { CreepFactory } from '../../src/game/creeps/CreepFactory';
import {
  HEALTH_COMPONENT,
  CREEP_COMPONENT,
  HealthComponent,
  CreepComponent,
} from '../../src/game/creeps/CreepComponents';

describe('CreepDeathSystem (US-06 / TASK-06-01 & TASK-06-03)', () => {
  let world: World;
  let eventBus: EventBus;
  let economyManager: EconomyManager;
  let scoreManager: ScoreManager;
  let deathSystem: CreepDeathSystem;

  beforeEach(() => {
    world = new World();
    eventBus = new EventBus();
    economyManager = new EconomyManager(300, eventBus);
    scoreManager = new ScoreManager(0, { eventBus });
    deathSystem = new CreepDeathSystem({
      economyManager,
      scoreManager,
      eventBus,
    });
    world.addSystem(deathSystem);
  });

  it('should ignore creep entities that still have health > 0', () => {
    const creep = CreepFactory.createBasicCreep(world, [{ x: 50, y: 50 }]);
    const health = world.getComponent<HealthComponent>(creep, HEALTH_COMPONENT)!;
    expect(health.current).toBe(100);

    world.update(0.016);

    expect(world.isAlive(creep)).toBe(true);
    expect(economyManager.getGold()).toBe(300);
    expect(scoreManager.getScore()).toBe(0);
    expect(deathSystem.getDeathCount()).toBe(0);
  });

  it('should process dead creep (health <= 0), award bounty gold and score, and remove from world', () => {
    const creep = CreepFactory.createBasicCreep(world, [{ x: 50, y: 50 }]);
    const health = world.getComponent<HealthComponent>(creep, HEALTH_COMPONENT)!;
    const creepComp = world.getComponent<CreepComponent>(creep, CREEP_COMPONENT)!;

    // Set creep to dead
    health.current = 0;

    const initialGold = economyManager.getGold();
    const bounty = creepComp.bountyGold; // 10
    const scoreVal = creepComp.scoreValue; // 20

    let killedEventPayload: any = null;
    let deathEventPayload: any = null;

    eventBus.on('CREEP_KILLED', (data) => {
      killedEventPayload = data;
    });
    eventBus.on('CREEP_DEATH', (data) => {
      deathEventPayload = data;
    });

    world.update(0.016);

    // Creep entity should be destroyed from world
    expect(world.isAlive(creep)).toBe(false);
    expect(world.query([CREEP_COMPONENT]).length).toBe(0);

    // Bounty gold should be credited to EconomyManager
    expect(economyManager.getGold()).toBe(initialGold + bounty);

    // Score should be credited to ScoreManager
    expect(scoreManager.getScore()).toBe(scoreVal);
    expect(scoreManager.getKillCount()).toBe(1);

    // System stats tracking
    expect(deathSystem.getDeathCount()).toBe(1);
    expect(deathSystem.getTotalGoldAwarded()).toBe(bounty);
    expect(deathSystem.getTotalScoreAwarded()).toBe(scoreVal);

    // Events emitted with correct payloads
    expect(killedEventPayload).toEqual({
      entity: creep,
      creepType: 'basic',
      bountyGold: bounty,
      scoreValue: scoreVal,
      position: { x: 50, y: 50 },
      totalScoreAwarded: scoreVal,
    });

    expect(deathEventPayload).toEqual({
      entity: creep,
      creepType: 'basic',
      bountyGold: bounty,
      scoreValue: scoreVal,
      position: { x: 50, y: 50 },
    });
  });

  it('should award correct bounty and score for different creep types', () => {
    // Fast creep: bounty 6, score 25
    const fastCreep = CreepFactory.createFastCreep(world, [{ x: 10, y: 10 }]);
    const fastHealth = world.getComponent<HealthComponent>(fastCreep, HEALTH_COMPONENT)!;
    fastHealth.current = -5; // negative health also handled

    world.update(0.016);

    expect(world.isAlive(fastCreep)).toBe(false);
    expect(economyManager.getGold()).toBe(300 + 6);
    expect(scoreManager.getScore()).toBe(25);
  });

  it('should scale score according to scoreManager multipliers on creep death', () => {
    scoreManager.setSpeedMultiplier(2.0);
    scoreManager.setDifficultyMultiplier(1.5);

    // Basic creep base score = 20 -> 20 * 2.0 * 1.5 = 60
    const creep = CreepFactory.createBasicCreep(world, [{ x: 100, y: 100 }]);
    world.getComponent<HealthComponent>(creep, HEALTH_COMPONENT)!.current = 0;

    world.update(0.016);

    expect(scoreManager.getScore()).toBe(60);
    expect(deathSystem.getTotalScoreAwarded()).toBe(60);
  });

  it('should process multiple dead creeps in the same frame', () => {
    const creep1 = CreepFactory.createBasicCreep(world, [{ x: 10, y: 10 }]);
    const creep2 = CreepFactory.createFastCreep(world, [{ x: 20, y: 20 }]);
    const creep3 = CreepFactory.createTankCreep(world, [{ x: 30, y: 30 }]);

    world.getComponent<HealthComponent>(creep1, HEALTH_COMPONENT)!.current = 0;
    world.getComponent<HealthComponent>(creep2, HEALTH_COMPONENT)!.current = 0;
    world.getComponent<HealthComponent>(creep3, HEALTH_COMPONENT)!.current = 50; // Alive!

    world.update(0.016);

    expect(world.isAlive(creep1)).toBe(false);
    expect(world.isAlive(creep2)).toBe(false);
    expect(world.isAlive(creep3)).toBe(true);

    // bounty: 8 (basic) + 6 (fast) = 14
    expect(economyManager.getGold()).toBe(314);
    // score: 20 (basic) + 25 (fast) = 45
    expect(scoreManager.getScore()).toBe(45);
    expect(deathSystem.getDeathCount()).toBe(2);
  });

  it('should invoke onCreepKilled registered callback', () => {
    const creep = CreepFactory.createBasicCreep(world, [{ x: 40, y: 80 }]);
    world.getComponent<HealthComponent>(creep, HEALTH_COMPONENT)!.current = 0;

    let callbackCalled = false;
    deathSystem.onCreepKilled((entity, creepComp, pos, scoreAwarded) => {
      callbackCalled = true;
      expect(entity).toBe(creep);
      expect(creepComp.creepType).toBe('basic');
      expect(pos).toEqual({ x: 40, y: 80 });
      expect(scoreAwarded).toBe(20);
    });

    world.update(0.016);

    expect(callbackCalled).toBe(true);
  });

  it('should operate safely when economyManager and scoreManager are omitted', () => {
    const standaloneSystem = new CreepDeathSystem();
    const standaloneWorld = new World();
    standaloneWorld.addSystem(standaloneSystem);

    const creep = CreepFactory.createBasicCreep(standaloneWorld, [{ x: 10, y: 10 }]);
    standaloneWorld.getComponent<HealthComponent>(creep, HEALTH_COMPONENT)!.current = 0;

    expect(() => standaloneWorld.update(0.016)).not.toThrow();
    expect(standaloneWorld.isAlive(creep)).toBe(false);
  });

  it('should reset stats correctly', () => {
    const creep = CreepFactory.createBasicCreep(world, [{ x: 10, y: 10 }]);
    world.getComponent<HealthComponent>(creep, HEALTH_COMPONENT)!.current = 0;

    world.update(0.016);
    expect(deathSystem.getDeathCount()).toBe(1);

    deathSystem.resetStats();
    expect(deathSystem.getDeathCount()).toBe(0);
    expect(deathSystem.getTotalGoldAwarded()).toBe(0);
    expect(deathSystem.getTotalScoreAwarded()).toBe(0);
  });
});
