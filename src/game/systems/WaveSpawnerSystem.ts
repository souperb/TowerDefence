import { World } from '../../core/ecs/World';
import { System } from '../../core/ecs/System';
import { IVector2 } from '../../core/math/Vector2';
import { EventBus, engineEvents } from '../../core/events/EngineEvents';
import { WaveDefinition, getTotalCreepsInWave } from '../waves/WaveDefinition';
import { CreepFactory } from '../creeps/CreepFactory';
import { CreepType } from '../creeps/CreepComponents';

interface SpawnGroupState {
  creepType: CreepType;
  count: number;
  intervalSeconds: number;
  startDelaySeconds: number;
  spawnedCount: number;
  nextSpawnTime: number;
}

export class WaveSpawnerSystem implements System {
  public name = 'WaveSpawnerSystem';
  public priority = 5;

  private waves: WaveDefinition[] = [];
  private waypoints: IVector2[] = [];
  private eventBus: EventBus;

  private currentWaveIndex: number = 0;
  private isSpawning: boolean = false;
  private waveTime: number = 0;
  private groupStates: SpawnGroupState[] = [];
  private completedWaves: Set<number> = new Set();

  constructor(
    waves: WaveDefinition[] = [],
    waypoints: IVector2[] = [],
    eventBus: EventBus = engineEvents
  ) {
    this.waves = [...waves];
    this.waypoints = waypoints.map((wp) => ({ x: wp.x, y: wp.y }));
    this.eventBus = eventBus;
  }

  public setWaves(waves: WaveDefinition[]): void {
    this.waves = [...waves];
  }

  public getWaves(): readonly WaveDefinition[] {
    return this.waves;
  }

  public setWaypoints(waypoints: IVector2[]): void {
    this.waypoints = waypoints.map((wp) => ({ x: wp.x, y: wp.y }));
  }

  public getWaypoints(): readonly IVector2[] {
    return this.waypoints;
  }

  public setEventBus(bus: EventBus): void {
    this.eventBus = bus;
  }

  public getCurrentWave(): WaveDefinition | null {
    return this.waves[this.currentWaveIndex] ?? null;
  }

  public getCurrentWaveIndex(): number {
    return this.currentWaveIndex;
  }

  public isSpawningActive(): boolean {
    return this.isSpawning;
  }

  public isWaveSpawningComplete(): boolean {
    if (this.groupStates.length === 0) {
      return !this.isSpawning;
    }
    return this.groupStates.every((g) => g.spawnedCount >= g.count);
  }

  public isAllWavesComplete(): boolean {
    return this.waves.length > 0 && this.completedWaves.size >= this.waves.length;
  }

  public getWaveElapsedTime(): number {
    return this.waveTime;
  }

  public getTotalSpawnedInWave(): number {
    return this.groupStates.reduce((sum, g) => sum + g.spawnedCount, 0);
  }

  public getRemainingCreepsInWave(): number {
    const currentWave = this.getCurrentWave();
    if (!currentWave) return 0;
    const total = getTotalCreepsInWave(currentWave);
    return Math.max(0, total - this.getTotalSpawnedInWave());
  }

  /**
   * Starts spawning for a given wave index.
   */
  public startWave(waveIndex: number = this.currentWaveIndex): boolean {
    if (this.isSpawning) {
      return false;
    }
    if (waveIndex < 0 || waveIndex >= this.waves.length) {
      return false;
    }

    this.currentWaveIndex = waveIndex;
    const wave = this.waves[waveIndex];
    this.waveTime = 0;
    this.groupStates = wave.spawnGroups.map((group) => {
      const delay = group.startDelaySeconds ?? 0;
      return {
        creepType: group.creepType,
        count: group.count,
        intervalSeconds: group.intervalSeconds,
        startDelaySeconds: delay,
        spawnedCount: 0,
        nextSpawnTime: delay,
      };
    });

    this.isSpawning = true;

    this.eventBus.emit('WAVE_STARTED', {
      waveIndex: this.currentWaveIndex,
      waveNumber: this.currentWaveIndex + 1,
      totalWaves: this.waves.length,
      totalCreeps: getTotalCreepsInWave(wave),
    });

    return true;
  }

  public stopWave(): void {
    this.isSpawning = false;
  }

  public reset(): void {
    this.currentWaveIndex = 0;
    this.isSpawning = false;
    this.waveTime = 0;
    this.groupStates = [];
    this.completedWaves.clear();
  }

  public update(world: World, dt: number): void {
    if (!this.isSpawning || dt <= 0) {
      return;
    }

    this.waveTime += dt;
    let allGroupsFinished = true;

    for (let i = 0; i < this.groupStates.length; i++) {
      const group = this.groupStates[i];

      while (group.spawnedCount < group.count && this.waveTime >= group.nextSpawnTime) {
        const entity = CreepFactory.createCreep(world, group.creepType, this.waypoints);

        const spawnPos: IVector2 = this.waypoints.length > 0
          ? { ...this.waypoints[0] }
          : { x: 0, y: 0 };

        this.eventBus.emit('CREEP_SPAWNED', {
          entity,
          creepType: group.creepType,
          waveIndex: this.currentWaveIndex,
          spawnGroupIndex: i,
          position: spawnPos,
        });

        group.spawnedCount++;
        group.nextSpawnTime += group.intervalSeconds;
      }

      if (group.spawnedCount < group.count) {
        allGroupsFinished = false;
      }
    }

    if (allGroupsFinished) {
      this.isSpawning = false;
      this.completedWaves.add(this.currentWaveIndex);

      this.eventBus.emit('WAVE_SPAWNING_COMPLETED', {
        waveIndex: this.currentWaveIndex,
      });
    }
  }
}
