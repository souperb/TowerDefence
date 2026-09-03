import { describe, it, expect, beforeEach, vi } from 'vitest';
import { World } from '../../src/core/ecs/World';
import { Vector2 } from '../../src/core/math/Vector2';
import { EventBus } from '../../src/core/events/EngineEvents';
import {
  CREEP_COMPONENT,
  PATH_FOLLOWER_COMPONENT,
  HEALTH_COMPONENT,
  POSITION_COMPONENT,
  VELOCITY_COMPONENT,
  SPRITE_COMPONENT,
  CreepComponent,
  PathFollowerComponent,
  HealthComponent,
  PositionComponent,
  VelocityComponent,
  SpriteComponent,
} from '../../src/game/creeps/CreepComponents';
import { CreepFactory, DEFAULT_CREEP_ARCHETYPES } from '../../src/game/creeps/CreepFactory';
import { MovementSystem } from '../../src/game/systems/MovementSystem';
import { BaseBreachSystem } from '../../src/game/systems/BaseBreachSystem';
import { CreepRenderer } from '../../src/rendering/CreepRenderer';

describe('Vector2 Math Helpers', () => {
  it('should initialize and perform basic arithmetic', () => {
    const v1 = new Vector2(3, 4);
    expect(v1.x).toBe(3);
    expect(v1.y).toBe(4);
    expect(v1.length()).toBe(5);
    expect(v1.lengthSquared()).toBe(25);

    const v2 = new Vector2(1, 2);
    v1.add(v2);
    expect(v1.x).toBe(4);
    expect(v1.y).toBe(6);

    v1.subtract(v2);
    expect(v1.x).toBe(3);
    expect(v1.y).toBe(4);

    v1.multiplyScalar(2);
    expect(v1.x).toBe(6);
    expect(v1.y).toBe(8);

    v1.divideScalar(2);
    expect(v1.x).toBe(3);
    expect(v1.y).toBe(4);
  });

  it('should compute distance, dot product, normalize, lerp and direction correctly', () => {
    const a = { x: 0, y: 0 };
    const b = { x: 3, y: 4 };

    expect(Vector2.distance(a, b)).toBe(5);
    expect(Vector2.distanceSquared(a, b)).toBe(25);
    expect(Vector2.dot(a, b)).toBe(0);

    const normalized = Vector2.normalize(b);
    expect(normalized.x).toBeCloseTo(0.6);
    expect(normalized.y).toBeCloseTo(0.8);
    expect(normalized.length()).toBeCloseTo(1.0);

    const zeroNorm = Vector2.normalize({ x: 0, y: 0 });
    expect(zeroNorm.x).toBe(0);
    expect(zeroNorm.y).toBe(0);

    const lerped = Vector2.lerp(a, b, 0.5);
    expect(lerped.x).toBe(1.5);
    expect(lerped.y).toBe(2.0);

    const dir = Vector2.direction(a, b);
    expect(dir.x).toBeCloseTo(0.6);
    expect(dir.y).toBeCloseTo(0.8);
  });

  it('should calculate angles and handle edge cases', () => {
    const right = new Vector2(1, 0);
    const up = new Vector2(0, 1);
    expect(right.angle()).toBeCloseTo(0);
    expect(up.angle()).toBeCloseTo(Math.PI / 2);

    expect(Vector2.angleBetween({ x: 0, y: 0 }, { x: 10, y: 10 })).toBeCloseTo(Math.PI / 4);

    const v = new Vector2(5, 5);
    v.divideScalar(0);
    expect(v.x).toBe(0);
    expect(v.y).toBe(0);
  });
});

describe('Creep ECS Components & CreepFactory (TASK-03-01)', () => {
  let world: World;
  const sampleWaypoints = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 100 },
  ];

  beforeEach(() => {
    world = new World();
    CreepFactory.resetArchetypes();
  });

  it('should create basic creep with correct default stats and components', () => {
    const entity = CreepFactory.createBasicCreep(world, sampleWaypoints);
    expect(world.isAlive(entity)).toBe(true);

    const creep = world.getComponent<CreepComponent>(entity, CREEP_COMPONENT);
    expect(creep).toBeDefined();
    expect(creep?.creepType).toBe('basic');
    expect(creep?.bountyGold).toBe(DEFAULT_CREEP_ARCHETYPES.basic.bountyGold);
    expect(creep?.damageToBase).toBe(DEFAULT_CREEP_ARCHETYPES.basic.damageToBase);
    expect(creep?.scoreValue).toBe(DEFAULT_CREEP_ARCHETYPES.basic.scoreValue);

    const health = world.getComponent<HealthComponent>(entity, HEALTH_COMPONENT);
    expect(health).toBeDefined();
    expect(health?.current).toBe(DEFAULT_CREEP_ARCHETYPES.basic.hp);
    expect(health?.max).toBe(DEFAULT_CREEP_ARCHETYPES.basic.hp);

    const vel = world.getComponent<VelocityComponent>(entity, VELOCITY_COMPONENT);
    expect(vel).toBeDefined();
    expect(vel?.speed).toBe(DEFAULT_CREEP_ARCHETYPES.basic.speed);

    const pos = world.getComponent<PositionComponent>(entity, POSITION_COMPONENT);
    expect(pos?.x).toBe(0);
    expect(pos?.y).toBe(0);

    const follower = world.getComponent<PathFollowerComponent>(entity, PATH_FOLLOWER_COMPONENT);
    expect(follower?.waypoints.length).toBe(3);
    expect(follower?.currentWaypointIndex).toBe(1);
    expect(follower?.distanceTraveled).toBe(0);
    expect(follower?.reachedEnd).toBe(false);

    const sprite = world.getComponent<SpriteComponent>(entity, SPRITE_COMPONENT);
    expect(sprite?.visible).toBe(true);
    expect(sprite?.color).toBe(DEFAULT_CREEP_ARCHETYPES.basic.color);
  });

  it('should create fast, tank, and boss creeps with distinct archetypes', () => {
    const fastEntity = CreepFactory.createFastCreep(world, sampleWaypoints);
    const fastCreep = world.getComponent<CreepComponent>(fastEntity, CREEP_COMPONENT)!;
    const fastVel = world.getComponent<VelocityComponent>(fastEntity, VELOCITY_COMPONENT)!;
    const fastHealth = world.getComponent<HealthComponent>(fastEntity, HEALTH_COMPONENT)!;
    expect(fastCreep.creepType).toBe('fast');
    expect(fastVel.speed).toBeGreaterThan(DEFAULT_CREEP_ARCHETYPES.basic.speed);
    expect(fastHealth.max).toBeLessThan(DEFAULT_CREEP_ARCHETYPES.basic.hp);

    const tankEntity = CreepFactory.createTankCreep(world, sampleWaypoints);
    const tankCreep = world.getComponent<CreepComponent>(tankEntity, CREEP_COMPONENT)!;
    const tankVel = world.getComponent<VelocityComponent>(tankEntity, VELOCITY_COMPONENT)!;
    const tankHealth = world.getComponent<HealthComponent>(tankEntity, HEALTH_COMPONENT)!;
    expect(tankCreep.creepType).toBe('tank');
    expect(tankVel.speed).toBeLessThan(DEFAULT_CREEP_ARCHETYPES.basic.speed);
    expect(tankHealth.max).toBeGreaterThan(DEFAULT_CREEP_ARCHETYPES.basic.hp);

    const bossEntity = CreepFactory.createBossCreep(world, sampleWaypoints);
    const bossCreep = world.getComponent<CreepComponent>(bossEntity, CREEP_COMPONENT)!;
    const bossHealth = world.getComponent<HealthComponent>(bossEntity, HEALTH_COMPONENT)!;
    expect(bossCreep.creepType).toBe('boss');
    expect(bossHealth.max).toBeGreaterThan(tankHealth.max);
    expect(bossCreep.damageToBase).toBeGreaterThan(1);
  });

  it('should support archetype stat overrides and registration', () => {
    const customEntity = CreepFactory.createCreep(world, 'basic', sampleWaypoints, {
      hp: 500,
      speed: 150,
      bountyGold: 99,
    });

    const health = world.getComponent<HealthComponent>(customEntity, HEALTH_COMPONENT)!;
    const vel = world.getComponent<VelocityComponent>(customEntity, VELOCITY_COMPONENT)!;
    const creep = world.getComponent<CreepComponent>(customEntity, CREEP_COMPONENT)!;

    expect(health.max).toBe(500);
    expect(health.current).toBe(500);
    expect(vel.speed).toBe(150);
    expect(creep.bountyGold).toBe(99);
  });
});

describe('Waypoint Navigation & MovementSystem (TASK-03-02)', () => {
  let world: World;
  let movementSystem: MovementSystem;

  beforeEach(() => {
    world = new World();
    movementSystem = new MovementSystem();
    world.addSystem(movementSystem);
  });

  it('should advance creep along waypoints proportional to speed and dt', () => {
    const waypoints = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
    ];
    const entity = CreepFactory.createBasicCreep(world, waypoints, { speed: 60 });
    const pos = world.getComponent<PositionComponent>(entity, POSITION_COMPONENT)!;
    const follower = world.getComponent<PathFollowerComponent>(entity, PATH_FOLLOWER_COMPONENT)!;

    // 0.5s at 60px/s = 30px
    world.update(0.5);

    expect(pos.x).toBeCloseTo(30);
    expect(pos.y).toBeCloseTo(0);
    expect(follower.distanceTraveled).toBeCloseTo(30);
    expect(follower.reachedEnd).toBe(false);

    // Another 0.5s = 30px -> total 60px
    world.update(0.5);
    expect(pos.x).toBeCloseTo(60);
    expect(follower.distanceTraveled).toBeCloseTo(60);
  });

  it('should perform exact corner turns and maintain constant movement speed across waypoints in a single tick', () => {
    // Path: (0, 0) -> (100, 0) -> (100, 100)
    // Total length: 200px
    const waypoints = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
    ];
    const entity = CreepFactory.createBasicCreep(world, waypoints, { speed: 80 });
    const pos = world.getComponent<PositionComponent>(entity, POSITION_COMPONENT)!;
    const vel = world.getComponent<VelocityComponent>(entity, VELOCITY_COMPONENT)!;
    const follower = world.getComponent<PathFollowerComponent>(entity, PATH_FOLLOWER_COMPONENT)!;
    const sprite = world.getComponent<SpriteComponent>(entity, SPRITE_COMPONENT)!;

    // Tick 1: 1.0s at 80px/s -> reaches (80, 0)
    world.update(1.0);
    expect(pos.x).toBeCloseTo(80);
    expect(pos.y).toBeCloseTo(0);
    expect(follower.distanceTraveled).toBeCloseTo(80);
    expect(follower.currentWaypointIndex).toBe(1);
    expect(vel.vx).toBeCloseTo(80);
    expect(vel.vy).toBeCloseTo(0);
    expect(sprite.rotation).toBeCloseTo(0);

    // Tick 2: 0.5s at 80px/s -> 40px total move distance.
    // Remaining distance to (100, 0) is 20px.
    // Should turn corner at (100, 0) and continue 20px downward to (100, 20).
    world.update(0.5);
    expect(pos.x).toBeCloseTo(100);
    expect(pos.y).toBeCloseTo(20);
    expect(follower.distanceTraveled).toBeCloseTo(120);
    expect(follower.currentWaypointIndex).toBe(2);
    expect(vel.vx).toBeCloseTo(0);
    expect(vel.vy).toBeCloseTo(80);
    expect(sprite.rotation).toBeCloseTo(Math.PI / 2);
  });

  it('should mark reachedEnd=true and halt velocity upon reaching final waypoint', () => {
    const waypoints = [
      { x: 0, y: 0 },
      { x: 50, y: 0 },
    ];
    const entity = CreepFactory.createBasicCreep(world, waypoints, { speed: 100 });
    const pos = world.getComponent<PositionComponent>(entity, POSITION_COMPONENT)!;
    const vel = world.getComponent<VelocityComponent>(entity, VELOCITY_COMPONENT)!;
    const follower = world.getComponent<PathFollowerComponent>(entity, PATH_FOLLOWER_COMPONENT)!;

    // 1.0s at 100px/s is more than 50px path
    world.update(1.0);

    expect(pos.x).toBeCloseTo(50);
    expect(pos.y).toBeCloseTo(0);
    expect(follower.reachedEnd).toBe(true);
    expect(follower.distanceTraveled).toBeCloseTo(50);
    expect(vel.vx).toBe(0);
    expect(vel.vy).toBe(0);

    // Further updates should not move the creep
    world.update(1.0);
    expect(pos.x).toBeCloseTo(50);
    expect(follower.distanceTraveled).toBeCloseTo(50);
  });
});

describe('Base Breach System (TASK-03-04)', () => {
  let world: World;
  let movementSystem: MovementSystem;
  let breachSystem: BaseBreachSystem;
  let eventBus: EventBus;

  beforeEach(() => {
    world = new World();
    eventBus = new EventBus();
    movementSystem = new MovementSystem();
    breachSystem = new BaseBreachSystem(eventBus);

    world.addSystem(movementSystem);
    world.addSystem(breachSystem);
  });

  it('should detect base breach when creep reaches final waypoint, dispatch event and remove entity', () => {
    const waypoints = [
      { x: 0, y: 0 },
      { x: 20, y: 0 },
    ];

    const entity = CreepFactory.createTankCreep(world, waypoints, { speed: 40, damageToBase: 3 });

    let breachPayload: any = null;
    eventBus.on('BASE_BREACH', (data) => {
      breachPayload = data;
    });

    // Tick 1: 0.25s -> moves 10px (halfway)
    world.update(0.25);
    expect(world.isAlive(entity)).toBe(true);
    expect(breachPayload).toBeNull();
    expect(breachSystem.getTotalBreaches()).toBe(0);

    // Tick 2: 0.5s -> moves 20px -> reaches end and triggers breach
    world.update(0.5);

    expect(breachPayload).not.toBeNull();
    expect(breachPayload.entity).toBe(entity);
    expect(breachPayload.creepType).toBe('tank');
    expect(breachPayload.damageToBase).toBe(3);
    expect(breachPayload.remainingHp).toBe(DEFAULT_CREEP_ARCHETYPES.tank.hp);

    expect(breachSystem.getTotalBreaches()).toBe(1);
    expect(breachSystem.getTotalBaseDamage()).toBe(3);

    // Entity is removed from world
    expect(world.isAlive(entity)).toBe(false);
  });
});

describe('Overhead Health Bar & CreepRenderer (TASK-03-04)', () => {
  let world: World;
  let renderer: CreepRenderer;
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    world = new World();
    renderer = new CreepRenderer(world);

    canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    ctx = canvas.getContext('2d')!;

    vi.spyOn(ctx, 'fillRect');
    vi.spyOn(ctx, 'strokeRect');
    vi.spyOn(ctx, 'beginPath');
    vi.spyOn(ctx, 'arc');
    vi.spyOn(ctx, 'fill');
    vi.spyOn(ctx, 'stroke');
  });

  it('should render creeps and overhead health bar reflecting remaining HP percentage', () => {
    const waypoints = [{ x: 100, y: 100 }, { x: 200, y: 100 }];
    const entity = CreepFactory.createBasicCreep(world, waypoints);
    const health = world.getComponent<HealthComponent>(entity, HEALTH_COMPONENT)!;

    // Full health (100 / 100)
    renderer.render(ctx);
    expect(ctx.fillRect).toHaveBeenCalled();

    // Damaged health (30 / 100) -> 30% fill width
    health.current = 30;

    const fillRectSpy = vi.spyOn(ctx, 'fillRect');
    renderer.renderHealthBar(ctx, 100, 80, health.current, health.max, 24, 4);

    // Check that background (24px) and foreground (24 * 0.3 = 7.2px) were rendered
    expect(fillRectSpy).toHaveBeenCalledWith(
      100 - 12, // startX = 88
      80,       // topY = 80
      24,       // barWidth = 24
      4         // barHeight = 4
    );
    expect(fillRectSpy).toHaveBeenCalledWith(
      88,
      80,
      expect.closeTo(7.2, 1),
      4
    );
  });

  it('should adjust health bar fill color dynamically based on health tier', () => {
    // > 50% health -> High color (Green)
    renderer.renderHealthBar(ctx, 50, 50, 80, 100, 20, 4);
    expect(ctx.fillStyle).toBe(renderer.getOptions().healthHighColor);

    // 25% - 50% health -> Mid color (Orange/Yellow)
    renderer.renderHealthBar(ctx, 50, 50, 40, 100, 20, 4);
    expect(ctx.fillStyle).toBe(renderer.getOptions().healthMidColor);

    // <= 25% health -> Low color (Red)
    renderer.renderHealthBar(ctx, 50, 50, 10, 100, 20, 4);
    expect(ctx.fillStyle).toBe(renderer.getOptions().healthLowColor);
  });

  it('should render distinct archetype body shapes and decorations', () => {
    const basicEntity = CreepFactory.createBasicCreep(world, [{ x: 50, y: 50 }]);
    const tankEntity = CreepFactory.createTankCreep(world, [{ x: 100, y: 100 }]);
    const fastEntity = CreepFactory.createFastCreep(world, [{ x: 150, y: 150 }]);
    const bossEntity = CreepFactory.createBossCreep(world, [{ x: 200, y: 200 }]);

    expect(world.isAlive(basicEntity)).toBe(true);
    expect(world.isAlive(tankEntity)).toBe(true);
    expect(world.isAlive(fastEntity)).toBe(true);
    expect(world.isAlive(bossEntity)).toBe(true);

    renderer.render(ctx);
    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.fill).toHaveBeenCalled();
  });
});
