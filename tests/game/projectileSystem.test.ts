import { describe, it, expect, beforeEach } from 'vitest';
import { World } from '../../src/core/ecs/World';
import { Entity } from '../../src/core/ecs/Component';
import {
  PROJECTILE_COMPONENT,
  POSITION_COMPONENT,
  SPRITE_COMPONENT,
  ProjectileComponent,
  PositionComponent,
  SpriteComponent,
} from '../../src/game/projectiles/ProjectileComponents';
import { ProjectileFactory } from '../../src/game/projectiles/ProjectileFactory';
import { ProjectileSystem } from '../../src/game/systems/ProjectileSystem';
import { CreepFactory } from '../../src/game/creeps/CreepFactory';
import {
  HEALTH_COMPONENT,
  POSITION_COMPONENT as CREEP_POS_COMP,
  HealthComponent,
  PositionComponent as CreepPositionComponent,
} from '../../src/game/creeps/CreepComponents';
import { ProjectileRenderer } from '../../src/rendering/ProjectileRenderer';

describe('ProjectileFactory (TASK-05-03 & TASK-05-04)', () => {
  let world: World;

  beforeEach(() => {
    world = new World();
  });

  it('should create an archer arrow projectile with correct components and attributes', () => {
    const start = { x: 10, y: 10 };
    const target = { x: 100, y: 10 };
    const entity = ProjectileFactory.createArcherArrow(world, start, target, 1 as Entity, 20, 350);

    expect(world.isAlive(entity)).toBe(true);

    const pos = world.getComponent<PositionComponent>(entity, POSITION_COMPONENT);
    expect(pos).toEqual({ x: 10, y: 10 });

    const proj = world.getComponent<ProjectileComponent>(entity, PROJECTILE_COMPONENT);
    expect(proj).toBeDefined();
    expect(proj?.towerType).toBe('archer');
    expect(proj?.damage).toBe(20);
    expect(proj?.speed).toBe(350);
    expect(proj?.splashRadius).toBe(0);
    expect(proj?.isHoming).toBe(true);
    expect(proj?.targetEntityId).toBe(1);

    const sprite = world.getComponent<SpriteComponent>(entity, SPRITE_COMPONENT);
    expect(sprite).toBeDefined();
    expect(sprite?.spriteId).toBe('projectile_arrow');
    expect(sprite?.rotation).toBe(0); // target is directly to the right along X axis
  });

  it('should create a cannonball with splash radius and non-homing flag', () => {
    const start = { x: 0, y: 0 };
    const target = { x: 0, y: 100 };
    const entity = ProjectileFactory.createCannonball(world, start, target, null, 50, 60, 220);

    const proj = world.getComponent<ProjectileComponent>(entity, PROJECTILE_COMPONENT);
    expect(proj?.towerType).toBe('cannon');
    expect(proj?.damage).toBe(50);
    expect(proj?.splashRadius).toBe(60);
    expect(proj?.isHoming).toBe(false);

    const sprite = world.getComponent<SpriteComponent>(entity, SPRITE_COMPONENT);
    expect(sprite?.spriteId).toBe('projectile_cannonball');
    expect(sprite?.rotation).toBeCloseTo(Math.PI / 2, 4); // pointing down
  });

  it('should create a mage bolt with high damage and homing flag', () => {
    const start = { x: 50, y: 50 };
    const target = { x: 100, y: 100 };
    const entity = ProjectileFactory.createMageBolt(world, start, target, 2 as Entity, 75, 280);

    const proj = world.getComponent<ProjectileComponent>(entity, PROJECTILE_COMPONENT);
    expect(proj?.towerType).toBe('mage');
    expect(proj?.damage).toBe(75);
    expect(proj?.isHoming).toBe(true);
  });
});

describe('ProjectileSystem (TASK-05-04)', () => {
  let world: World;
  let projectileSystem: ProjectileSystem;

  beforeEach(() => {
    world = new World();
    projectileSystem = new ProjectileSystem();
    world.addSystem(projectileSystem);
  });

  it('should advance projectile position toward target over time', () => {
    const start = { x: 0, y: 0 };
    const target = { x: 100, y: 0 };
    // speed 100 px/s -> in 0.5s should move 50 px
    const entity = ProjectileFactory.createArcherArrow(world, start, target, null, 15, 100);

    world.update(0.5);

    const pos = world.getComponent<PositionComponent>(entity, POSITION_COMPONENT)!;
    expect(pos.x).toBeCloseTo(50, 2);
    expect(pos.y).toBeCloseTo(0, 2);
  });

  it('should hit single-target creep, apply direct damage, and despawn projectile on arrival', () => {
    const creep = CreepFactory.createBasicCreep(world, [{ x: 50, y: 0 }]);
    const health = world.getComponent<HealthComponent>(creep, HEALTH_COMPONENT)!;
    expect(health.current).toBe(100);

    const start = { x: 0, y: 0 };
    const target = { x: 50, y: 0 };
    // speed 100 -> takes 0.5s to travel 50px
    const projEntity = ProjectileFactory.createArcherArrow(world, start, target, creep, 30, 100);

    let hitOccurred = false;
    projectileSystem.onProjectileHit((entity, impactPos, dmg, splash) => {
      hitOccurred = true;
      expect(entity).toBe(projEntity);
      expect(impactPos.x).toBeCloseTo(50, 1);
      expect(dmg).toBe(30);
      expect(splash).toBe(0);
    });

    world.update(0.6); // Travel past 50px

    expect(hitOccurred).toBe(true);
    // Projectile entity should be destroyed from world
    expect(world.isAlive(projEntity)).toBe(false);
    // Creep should have received 30 damage
    expect(health.current).toBe(70);
  });

  it('should hit ground location, apply splash damage to multiple creeps, and despawn', () => {
    // Creep 1 at (100, 0)
    const creep1 = CreepFactory.createBasicCreep(world, [{ x: 100, y: 0 }]);
    // Creep 2 at (110, 0)
    const creep2 = CreepFactory.createBasicCreep(world, [{ x: 110, y: 0 }]);
    // Creep 3 at (200, 0) - far away
    const creep3 = CreepFactory.createBasicCreep(world, [{ x: 200, y: 0 }]);

    const start = { x: 0, y: 0 };
    const target = { x: 100, y: 0 };
    const projEntity = ProjectileFactory.createCannonball(world, start, target, null, 40, 50, 200);

    world.update(0.6); // Reaches (100, 0)

    expect(world.isAlive(projEntity)).toBe(false);

    const health1 = world.getComponent<HealthComponent>(creep1, HEALTH_COMPONENT)!;
    const health2 = world.getComponent<HealthComponent>(creep2, HEALTH_COMPONENT)!;
    const health3 = world.getComponent<HealthComponent>(creep3, HEALTH_COMPONENT)!;

    expect(health1.current).toBeLessThan(100);
    expect(health2.current).toBeLessThan(100);
    expect(health3.current).toBe(100); // Outside splash radius
  });

  it('should dynamically home in on moving creep target', () => {
    const creep = CreepFactory.createBasicCreep(world, [{ x: 50, y: 0 }]);
    const creepPos = world.getComponent<CreepPositionComponent>(creep, CREEP_POS_COMP)!;

    const start = { x: 0, y: 0 };
    const projEntity = ProjectileFactory.createMageBolt(world, start, { x: 50, y: 0 }, creep, 60, 200);

    // After 0.1s, move creep to (50, 50)
    world.update(0.1);
    creepPos.x = 50;
    creepPos.y = 50;

    // Advance simulation
    world.update(0.4);

    expect(world.isAlive(projEntity)).toBe(false); // Hit arrived
    const health = world.getComponent<HealthComponent>(creep, HEALTH_COMPONENT)!;
    expect(health.current).toBe(40); // 100 - 60
  });

  it('should not retarget a new entity that recycled the dead target ID', () => {
    const creep = CreepFactory.createBasicCreep(world, [{ x: 50, y: 0 }]);
    const projEntity = ProjectileFactory.createMageBolt(world, { x: 0, y: 0 }, { x: 50, y: 0 }, creep, 60, 200);

    world.update(0.1);

    // Original target dies; a fresh creep immediately reuses its ID far away from the flight path
    world.destroyEntity(creep);
    const recycled = CreepFactory.createBasicCreep(world, [{ x: 500, y: 500 }]);
    expect(recycled).toBe(creep);

    world.update(0.4);

    // Projectile flew to the last known position and expired without homing onto or damaging the newcomer
    expect(world.isAlive(projEntity)).toBe(false);
    const health = world.getComponent<HealthComponent>(recycled, HEALTH_COMPONENT)!;
    expect(health.current).toBe(100);
  });
});

describe('ProjectileRenderer', () => {
  let world: World;
  let renderer: ProjectileRenderer;

  beforeEach(() => {
    world = new World();
    renderer = new ProjectileRenderer(world);
  });

  it('should render active projectiles without throwing', () => {
    ProjectileFactory.createArcherArrow(world, { x: 10, y: 10 }, { x: 50, y: 50 });
    ProjectileFactory.createCannonball(world, { x: 20, y: 20 }, { x: 60, y: 60 });
    ProjectileFactory.createMageBolt(world, { x: 30, y: 30 }, { x: 70, y: 70 });

    const mockCtx = {
      save: () => {},
      restore: () => {},
      translate: () => {},
      rotate: () => {},
      beginPath: () => {},
      closePath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      arc: () => {},
      fill: () => {},
      stroke: () => {},
      fillRect: () => {},
      strokeRect: () => {},
    } as unknown as CanvasRenderingContext2D;

    expect(() => renderer.render(mockCtx, 0.016)).not.toThrow();
  });

  it('should track and animate impact splash effects', () => {
    renderer.addImpactEffect({ x: 100, y: 100 }, 40, '#f97316', 0.2);
    expect(() => renderer.updateEffects(0.1)).not.toThrow();
    expect(() => renderer.updateEffects(0.15)).not.toThrow();
  });
});
