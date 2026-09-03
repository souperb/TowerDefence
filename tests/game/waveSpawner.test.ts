import { describe, it, expect, beforeEach } from 'vitest';
import { World } from '../../src/core/ecs/World';
import { EventBus } from '../../src/core/events/EngineEvents';
import {
  WaveDefinition,
  getTotalCreepsInWave,
  getWaveDurationSeconds,
  DEFAULT_WAVES,
} from '../../src/game/waves/WaveDefinition';
import { WaveSpawnerSystem } from '../../src/game/systems/WaveSpawnerSystem';
import {
  CREEP_COMPONENT,
  HEALTH_COMPONENT,
  POSITION_COMPONENT,
  CreepComponent,
  HealthComponent,
  PositionComponent,
} from '../../src/game/creeps/CreepComponents';

describe('Wave Definitions', () => {
  it('should calculate total creep count and wave duration correctly', () => {
    const wave: WaveDefinition = {
      waveNumber: 1,
      spawnGroups: [
        {
          creepType: 'basic',
          count: 5,
          intervalSeconds: 1.0,
          startDelaySeconds: 0,
        },
        {
          creepType: 'fast',
          count: 3,
          intervalSeconds: 0.5,
          startDelaySeconds: 4.0,
        },
      ],
    };

    expect(getTotalCreepsInWave(wave)).toBe(8);
    // Group 1: 0 to 4.0s (5 creeps: t=0, 1, 2, 3, 4)
    // Group 2: 4.0s to 5.0s (3 creeps: t=4.0, 4.5, 5.0)
    expect(getWaveDurationSeconds(wave)).toBe(5.0);
  });

  it('should have valid default waves', () => {
    expect(DEFAULT_WAVES.length).toBeGreaterThanOrEqual(3);
    for (const wave of DEFAULT_WAVES) {
      expect(wave.waveNumber).toBeGreaterThan(0);
      expect(wave.spawnGroups.length).toBeGreaterThan(0);
      expect(getTotalCreepsInWave(wave)).toBeGreaterThan(0);
    }
  });
});

describe('WaveSpawnerSystem (TASK-03-03)', () => {
  let world: World;
  let eventBus: EventBus;
  let spawnerSystem: WaveSpawnerSystem;

  const testWaypoints = [
    { x: 32, y: 64 },
    { x: 128, y: 64 },
    { x: 128, y: 256 },
  ];

  const testWaves: WaveDefinition[] = [
    {
      waveNumber: 1,
      spawnGroups: [
        {
          creepType: 'basic',
          count: 3,
          intervalSeconds: 1.0,
          startDelaySeconds: 0,
        },
      ],
    },
    {
      waveNumber: 2,
      spawnGroups: [
        {
          creepType: 'basic',
          count: 2,
          intervalSeconds: 1.0,
          startDelaySeconds: 0,
        },
        {
          creepType: 'fast',
          count: 2,
          intervalSeconds: 0.5,
          startDelaySeconds: 2.0,
        },
      ],
    },
  ];

  beforeEach(() => {
    world = new World();
    eventBus = new EventBus();
    spawnerSystem = new WaveSpawnerSystem(testWaves, testWaypoints, eventBus);
    world.addSystem(spawnerSystem);
  });

  it('should start wave, emit WAVE_STARTED and spawn initial creep at t=0', () => {
    let waveStartedData: any = null;
    let spawnedCreeps: any[] = [];

    eventBus.on('WAVE_STARTED', (data) => {
      waveStartedData = data;
    });

    eventBus.on('CREEP_SPAWNED', (data) => {
      spawnedCreeps.push(data);
    });

    const started = spawnerSystem.startWave(0);
    expect(started).toBe(true);
    expect(spawnerSystem.isSpawningActive()).toBe(true);
    expect(waveStartedData).toEqual({
      waveIndex: 0,
      waveNumber: 1,
      totalWaves: 2,
      totalCreeps: 3,
    });

    // Before tick, no entities spawned yet
    expect(spawnedCreeps.length).toBe(0);

    // Tick at t = 0.01s -> triggers first creep (at t=0)
    world.update(0.01);
    expect(spawnedCreeps.length).toBe(1);
    expect(spawnedCreeps[0].creepType).toBe('basic');
    expect(spawnedCreeps[0].position).toEqual({ x: 32, y: 64 });

    const entity = spawnedCreeps[0].entity;
    expect(world.isAlive(entity)).toBe(true);

    const pos = world.getComponent<PositionComponent>(entity, POSITION_COMPONENT)!;
    expect(pos.x).toBe(32);
    expect(pos.y).toBe(64);

    const creep = world.getComponent<CreepComponent>(entity, CREEP_COMPONENT)!;
    expect(creep.creepType).toBe('basic');

    const health = world.getComponent<HealthComponent>(entity, HEALTH_COMPONENT)!;
    expect(health.current).toBe(100);
  });

  it('should accurately space spawns across configured intervals and complete wave', () => {
    const spawnedCreeps: any[] = [];
    let waveCompletedData: any = null;

    eventBus.on('CREEP_SPAWNED', (data) => {
      spawnedCreeps.push(data);
    });
    eventBus.on('WAVE_SPAWNING_COMPLETED', (data) => {
      waveCompletedData = data;
    });

    spawnerSystem.startWave(0); // 3 basic creeps at interval 1.0s (t=0, t=1.0, t=2.0)

    // t = 0.1s -> 1st creep spawned
    world.update(0.1);
    expect(spawnedCreeps.length).toBe(1);
    expect(spawnerSystem.getTotalSpawnedInWave()).toBe(1);
    expect(spawnerSystem.getRemainingCreepsInWave()).toBe(2);
    expect(spawnerSystem.isWaveSpawningComplete()).toBe(false);

    // t = 0.8s (elapsed 0.9s) -> still 1 creep
    world.update(0.8);
    expect(spawnedCreeps.length).toBe(1);

    // t = 0.2s (elapsed 1.1s) -> 2nd creep spawned
    world.update(0.2);
    expect(spawnedCreeps.length).toBe(2);
    expect(spawnerSystem.getTotalSpawnedInWave()).toBe(2);

    // t = 0.9s (elapsed 2.0s) -> 3rd creep spawned
    world.update(0.9);
    expect(spawnedCreeps.length).toBe(3);
    expect(spawnerSystem.getTotalSpawnedInWave()).toBe(3);
    expect(spawnerSystem.getRemainingCreepsInWave()).toBe(0);
    expect(spawnerSystem.isWaveSpawningComplete()).toBe(true);
    expect(spawnerSystem.isSpawningActive()).toBe(false);

    expect(waveCompletedData).toEqual({
      waveIndex: 0,
    });
  });

  it('should handle multi-group waves with start delays correctly', () => {
    const spawnedCreeps: any[] = [];
    eventBus.on('CREEP_SPAWNED', (data) => {
      spawnedCreeps.push(data);
    });

    // Wave 2:
    // Group 0: 2 basic (t=0, t=1.0)
    // Group 1: 2 fast with delay 2.0s (t=2.0, t=2.5)
    spawnerSystem.startWave(1);

    // Advance 1.5s -> Group 0 spawned both (2 basic), Group 1 hasn't started yet
    world.update(1.5);
    expect(spawnedCreeps.length).toBe(2);
    expect(spawnedCreeps.every((c) => c.creepType === 'basic')).toBe(true);

    // Advance to 2.1s -> Group 1 spawns 1st fast creep
    world.update(0.6);
    expect(spawnedCreeps.length).toBe(3);
    expect(spawnedCreeps[2].creepType).toBe('fast');

    // Advance to 2.6s -> Group 1 spawns 2nd fast creep -> all 4 spawned
    world.update(0.5);
    expect(spawnedCreeps.length).toBe(4);
    expect(spawnerSystem.isWaveSpawningComplete()).toBe(true);
  });

  it('should spawn multiple creeps deterministically on large delta time ticks', () => {
    const spawnedCreeps: any[] = [];
    eventBus.on('CREEP_SPAWNED', (data) => {
      spawnedCreeps.push(data);
    });

    spawnerSystem.startWave(0); // 3 creeps at 1.0s interval
    // Tick 5.0 seconds at once
    world.update(5.0);

    expect(spawnedCreeps.length).toBe(3);
    expect(spawnerSystem.isWaveSpawningComplete()).toBe(true);
  });

  it('should track completion across multiple waves', () => {
    expect(spawnerSystem.isAllWavesComplete()).toBe(false);

    // Wave 0
    spawnerSystem.startWave(0);
    world.update(10.0);
    expect(spawnerSystem.isWaveSpawningComplete()).toBe(true);
    expect(spawnerSystem.isAllWavesComplete()).toBe(false);

    // Wave 1
    spawnerSystem.startWave(1);
    world.update(10.0);
    expect(spawnerSystem.isWaveSpawningComplete()).toBe(true);
    expect(spawnerSystem.isAllWavesComplete()).toBe(true);
  });

  it('should not allow starting another wave while currently spawning', () => {
    expect(spawnerSystem.startWave(0)).toBe(true);
    expect(spawnerSystem.startWave(1)).toBe(false);
  });
});
