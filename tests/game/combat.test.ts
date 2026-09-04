import { describe, it, expect, beforeEach } from 'vitest';
import { World } from '../../src/core/ecs/World';
import { Entity } from '../../src/core/ecs/Component';
import { EventBus } from '../../src/core/events/EngineEvents';
import { DamageCalculator } from '../../src/game/combat/DamageCalculator';
import { CreepFactory } from '../../src/game/creeps/CreepFactory';
import {
  HEALTH_COMPONENT,
  HealthComponent,
} from '../../src/game/creeps/CreepComponents';
import { TowerFactory } from '../../src/game/towers/TowerFactory';
import {
  TOWER_COMPONENT,
  POSITION_COMPONENT as TOWER_POS_COMP,
  TowerComponent,
  PositionComponent as TowerPositionComponent,
} from '../../src/game/towers/TowerComponents';
import { TowerCombatSystem } from '../../src/game/systems/TowerCombatSystem';
import {
  PROJECTILE_COMPONENT,
  ProjectileComponent,
} from '../../src/game/projectiles/ProjectileComponents';

describe('DamageCalculator (TASK-05-04)', () => {
  let world: World;
  let eventBus: EventBus;

  beforeEach(() => {
    world = new World();
    eventBus = new EventBus();
  });

  it('should apply direct damage and emit CREEP_DAMAGED event', () => {
    const creep = CreepFactory.createBasicCreep(world, [{ x: 50, y: 50 }]);
    const health = world.getComponent<HealthComponent>(creep, HEALTH_COMPONENT)!;
    expect(health.current).toBe(100);

    let damagedPayload: any = null;
    eventBus.on('CREEP_DAMAGED', (data) => {
      damagedPayload = data;
    });

    const result = DamageCalculator.applyDirectDamage(world, creep, 30, eventBus);

    expect(result).not.toBeNull();
    expect(result?.damageDealt).toBe(30);
    expect(result?.remainingHp).toBe(70);
    expect(result?.isKilled).toBe(false);
    expect(health.current).toBe(70);

    expect(damagedPayload).toEqual({
      entity: creep,
      damage: 30,
      remainingHp: 70,
      maxHp: 100,
    });
  });

  it('should clamp health at 0 and report the kill without emitting CREEP_DEATH itself', () => {
    const creep = CreepFactory.createFastCreep(world, [{ x: 20, y: 30 }]);
    const health = world.getComponent<HealthComponent>(creep, HEALTH_COMPONENT)!;
    expect(health.current).toBe(55); // Fast creep HP is 55

    let deathPayload: any = null;
    eventBus.on('CREEP_DEATH', (data) => {
      deathPayload = data;
    });

    const result = DamageCalculator.applyDirectDamage(world, creep, 80, eventBus);

    expect(result?.damageDealt).toBe(55);
    expect(result?.remainingHp).toBe(0);
    expect(result?.isKilled).toBe(true);
    expect(health.current).toBe(0);

    // CREEP_DEATH is owned by CreepDeathSystem so it is emitted exactly once per kill
    expect(deathPayload).toBeNull();
  });

  it('should apply area-of-effect splash damage to all creeps within splash radius', () => {
    // Creep 1 at center (dist = 0)
    const creep1 = CreepFactory.createBasicCreep(world, [{ x: 100, y: 100 }]);
    // Creep 2 at dist = 30 (within radius 50)
    const creep2 = CreepFactory.createBasicCreep(world, [{ x: 130, y: 100 }]);
    // Creep 3 at dist = 80 (outside radius 50)
    const creep3 = CreepFactory.createBasicCreep(world, [{ x: 180, y: 100 }]);

    const impactPos = { x: 100, y: 100 };
    const splashRadius = 50;
    const baseDamage = 40;

    const splashResult = DamageCalculator.applySplashDamage(
      world,
      impactPos,
      splashRadius,
      baseDamage,
      { falloff: 'linear', minDamagePercent: 0.25, eventBus }
    );

    expect(splashResult.targetsHit.length).toBe(2);

    const health1 = world.getComponent<HealthComponent>(creep1, HEALTH_COMPONENT)!;
    const health2 = world.getComponent<HealthComponent>(creep2, HEALTH_COMPONENT)!;
    const health3 = world.getComponent<HealthComponent>(creep3, HEALTH_COMPONENT)!;

    // Creep 1 is at center, takes full damage = 40
    expect(health1.current).toBe(60);

    // Creep 2 is at distance 30/50 = 0.6 progress -> damage reduced by falloff
    expect(health2.current).toBeLessThan(100);
    expect(health2.current).toBeGreaterThan(60);

    // Creep 3 is outside radius, takes no damage
    expect(health3.current).toBe(100);
  });

  it('should support uniform splash damage (no falloff)', () => {
    const creep1 = CreepFactory.createBasicCreep(world, [{ x: 100, y: 100 }]);
    const creep2 = CreepFactory.createBasicCreep(world, [{ x: 140, y: 100 }]);

    const impactPos = { x: 100, y: 100 };
    const splashRadius = 50;

    DamageCalculator.applySplashDamage(
      world,
      impactPos,
      splashRadius,
      50,
      { falloff: 'none', eventBus }
    );

    const health1 = world.getComponent<HealthComponent>(creep1, HEALTH_COMPONENT)!;
    const health2 = world.getComponent<HealthComponent>(creep2, HEALTH_COMPONENT)!;

    expect(health1.current).toBe(50);
    expect(health2.current).toBe(50);
  });
});

describe('TowerCombatSystem (TASK-05-03)', () => {
  let world: World;
  let combatSystem: TowerCombatSystem;

  beforeEach(() => {
    world = new World();
    combatSystem = new TowerCombatSystem();
    world.addSystem(combatSystem);
  });

  it('should decrement cooldown timer on update', () => {
    const towerEntity = TowerFactory.createTower(world, 'archer', 1, 1);
    const tower = world.getComponent<TowerComponent>(towerEntity, TOWER_COMPONENT)!;
    tower.cooldownRemaining = 0.5;

    world.update(0.2);
    expect(tower.cooldownRemaining).toBeCloseTo(0.3, 5);

    world.update(0.4);
    expect(tower.cooldownRemaining).toBe(0);
  });

  it('should fire projectile when cooldown is 0 and target is valid and in range', () => {
    const towerEntity = TowerFactory.createTower(world, 'archer', 1, 1);
    const towerPos = world.getComponent<TowerPositionComponent>(towerEntity, TOWER_POS_COMP)!;
    towerPos.x = 100;
    towerPos.y = 100;

    const tower = world.getComponent<TowerComponent>(towerEntity, TOWER_COMPONENT)!;
    tower.cooldownRemaining = 0;
    tower.fireRate = 1.0; // 1 shot per second -> cooldown will reset to 1.0

    const creepEntity = CreepFactory.createBasicCreep(world, [{ x: 150, y: 100 }]);
    tower.targetEntityId = creepEntity;

    let firedTower: Entity | null = null;
    let firedTarget: Entity | null = null;
    let spawnedProj: Entity | null = null;

    combatSystem.onTowerFired((t, targ, p) => {
      firedTower = t;
      firedTarget = targ;
      spawnedProj = p;
    });

    world.update(0.016);

    expect(firedTower).toBe(towerEntity);
    expect(firedTarget).toBe(creepEntity);
    expect(spawnedProj).not.toBeNull();
    expect(world.isAlive(spawnedProj!)).toBe(true);

    // Projectile component check
    const proj = world.getComponent<ProjectileComponent>(spawnedProj!, PROJECTILE_COMPONENT);
    expect(proj).toBeDefined();
    expect(proj?.towerType).toBe('archer');
    expect(proj?.targetEntityId).toBe(creepEntity);

    // Cooldown reset to 1 / fireRate = 1.0s
    expect(tower.cooldownRemaining).toBeCloseTo(1.0, 3);
  });

  it('should not fire when cooldown is still remaining', () => {
    const towerEntity = TowerFactory.createTower(world, 'archer', 1, 1);
    const tower = world.getComponent<TowerComponent>(towerEntity, TOWER_COMPONENT)!;
    tower.cooldownRemaining = 0.5;

    const creepEntity = CreepFactory.createBasicCreep(world, [{ x: 150, y: 100 }]);
    tower.targetEntityId = creepEntity;

    let fired = false;
    combatSystem.onTowerFired(() => {
      fired = true;
    });

    world.update(0.1);
    expect(fired).toBe(false);
    expect(tower.cooldownRemaining).toBeCloseTo(0.4, 5);
  });

  it('should not fire and clear target if target is out of range', () => {
    const towerEntity = TowerFactory.createTower(world, 'archer', 1, 1);
    const towerPos = world.getComponent<TowerPositionComponent>(towerEntity, TOWER_POS_COMP)!;
    towerPos.x = 100;
    towerPos.y = 100;

    const tower = world.getComponent<TowerComponent>(towerEntity, TOWER_COMPONENT)!;
    tower.range = 80;
    tower.cooldownRemaining = 0;

    // Target at dist 150 > range 80
    const creepEntity = CreepFactory.createBasicCreep(world, [{ x: 250, y: 100 }]);
    tower.targetEntityId = creepEntity;

    let fired = false;
    combatSystem.onTowerFired(() => {
      fired = true;
    });

    world.update(0.016);

    expect(fired).toBe(false);
    expect(tower.targetEntityId).toBeNull();
  });
});
