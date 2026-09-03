import { describe, it, expect, beforeEach } from 'vitest';
import { World } from '../../src/core/ecs/World';
import { Entity } from '../../src/core/ecs/Component';
import {
  targetFirst,
  targetLowestHp,
  targetClosest,
  selectTargetByStrategy,
  TargetCandidate,
} from '../../src/game/towers/TargetingStrategies';
import {
  TOWER_COMPONENT,
  POSITION_COMPONENT as TOWER_POS_COMP,
  TowerComponent,
  PositionComponent as TowerPositionComponent,
} from '../../src/game/towers/TowerComponents';
import { TowerFactory } from '../../src/game/towers/TowerFactory';
import { CreepFactory } from '../../src/game/creeps/CreepFactory';
import {
  HEALTH_COMPONENT,
  PATH_FOLLOWER_COMPONENT,
  HealthComponent,
  PathFollowerComponent,
} from '../../src/game/creeps/CreepComponents';
import { TargetingSystem } from '../../src/game/systems/TargetingSystem';
import {
  getNextTargetStrategy,
  cycleTowerStrategy,
  setTowerStrategy,
  TowerControlSystem,
} from '../../src/game/systems/TowerControlSystem';

describe('Targeting Strategies (TASK-05-01)', () => {
  const mockCandidates: TargetCandidate[] = [
    {
      entity: 1,
      position: { x: 50, y: 50 },
      health: { current: 80, max: 100 },
      distanceTraveled: 120,
      distanceToTower: 60,
    },
    {
      entity: 2,
      position: { x: 30, y: 30 },
      health: { current: 30, max: 100 },
      distanceTraveled: 90,
      distanceToTower: 40,
    },
    {
      entity: 3,
      position: { x: 80, y: 80 },
      health: { current: 100, max: 100 },
      distanceTraveled: 200,
      distanceToTower: 90,
    },
    {
      entity: 4,
      position: { x: 10, y: 10 },
      health: { current: 50, max: 100 },
      distanceTraveled: 50,
      distanceToTower: 15,
    },
  ];

  it('should return null when candidates list is empty', () => {
    expect(targetFirst([])).toBeNull();
    expect(targetLowestHp([])).toBeNull();
    expect(targetClosest([])).toBeNull();
    expect(selectTargetByStrategy('first', [])).toBeNull();
  });

  it("should select candidate with highest distanceTraveled for 'first' strategy", () => {
    const target = targetFirst(mockCandidates);
    expect(target).toBe(3); // distanceTraveled: 200
  });

  it("should break ties for 'first' strategy by lowest HP then entity ID", () => {
    const tiedCandidates: TargetCandidate[] = [
      {
        entity: 10,
        position: { x: 0, y: 0 },
        health: { current: 60, max: 100 },
        distanceTraveled: 150,
        distanceToTower: 50,
      },
      {
        entity: 11,
        position: { x: 0, y: 0 },
        health: { current: 30, max: 100 },
        distanceTraveled: 150,
        distanceToTower: 50,
      },
    ];

    expect(targetFirst(tiedCandidates)).toBe(11); // entity 11 has lower HP
  });

  it("should select candidate with lowest health for 'lowestHp' strategy", () => {
    const target = targetLowestHp(mockCandidates);
    expect(target).toBe(2); // health: 30
  });

  it("should break ties for 'lowestHp' strategy by distanceTraveled", () => {
    const tiedCandidates: TargetCandidate[] = [
      {
        entity: 20,
        position: { x: 0, y: 0 },
        health: { current: 20, max: 100 },
        distanceTraveled: 80,
        distanceToTower: 50,
      },
      {
        entity: 21,
        position: { x: 0, y: 0 },
        health: { current: 20, max: 100 },
        distanceTraveled: 120,
        distanceToTower: 50,
      },
    ];

    expect(targetLowestHp(tiedCandidates)).toBe(21); // entity 21 has traveled further
  });

  it("should select candidate with minimum Euclidean distance for 'closest' strategy", () => {
    const target = targetClosest(mockCandidates);
    expect(target).toBe(4); // distanceToTower: 15
  });

  it("should delegate correctly via selectTargetByStrategy", () => {
    expect(selectTargetByStrategy('first', mockCandidates)).toBe(3);
    expect(selectTargetByStrategy('lowestHp', mockCandidates)).toBe(2);
    expect(selectTargetByStrategy('closest', mockCandidates)).toBe(4);
  });
});

describe('TargetingSystem in ECS World (TASK-05-02)', () => {
  let world: World;
  let targetingSystem: TargetingSystem;

  beforeEach(() => {
    world = new World();
    targetingSystem = new TargetingSystem();
    world.addSystem(targetingSystem);
  });

  it('should find targets within range and assign targetEntityId based on tower strategy', () => {
    // Tower at (100, 100) with range 120, strategy 'first'
    const towerEntity = TowerFactory.createTower(world, 'archer', 3, 3); // center ~ (112, 112)
    const towerPos = world.getComponent<TowerPositionComponent>(towerEntity, TOWER_POS_COMP)!;
    towerPos.x = 100;
    towerPos.y = 100;

    const tower = world.getComponent<TowerComponent>(towerEntity, TOWER_COMPONENT)!;
    tower.range = 100;
    tower.targetStrategy = 'first';

    // Creep 1: in range, distanceTraveled: 50
    const creep1 = CreepFactory.createBasicCreep(world, [
      { x: 120, y: 100 },
      { x: 200, y: 100 },
    ]);
    const follower1 = world.getComponent<PathFollowerComponent>(creep1, PATH_FOLLOWER_COMPONENT)!;
    follower1.distanceTraveled = 50;

    // Creep 2: in range, distanceTraveled: 150
    const creep2 = CreepFactory.createBasicCreep(world, [
      { x: 150, y: 100 },
      { x: 200, y: 100 },
    ]);
    const follower2 = world.getComponent<PathFollowerComponent>(creep2, PATH_FOLLOWER_COMPONENT)!;
    follower2.distanceTraveled = 150;

    // Creep 3: out of range (dist = 200 > range 100)
    const creep3 = CreepFactory.createBasicCreep(world, [
      { x: 300, y: 100 },
      { x: 400, y: 100 },
    ]);
    const follower3 = world.getComponent<PathFollowerComponent>(creep3, PATH_FOLLOWER_COMPONENT)!;
    follower3.distanceTraveled = 300;

    world.update(0.016);

    expect(tower.targetEntityId).toBe(creep2); // Creep 2 is in range and has furthest distanceTraveled
  });

  it('should prioritize lowest HP when strategy is lowestHp', () => {
    const towerEntity = TowerFactory.createTower(world, 'archer', 1, 1);
    const towerPos = world.getComponent<TowerPositionComponent>(towerEntity, TOWER_POS_COMP)!;
    towerPos.x = 100;
    towerPos.y = 100;

    const tower = world.getComponent<TowerComponent>(towerEntity, TOWER_COMPONENT)!;
    tower.range = 100;
    tower.targetStrategy = 'lowestHp';

    const creep1 = CreepFactory.createBasicCreep(world, [{ x: 110, y: 100 }]);
    const health1 = world.getComponent<HealthComponent>(creep1, HEALTH_COMPONENT)!;
    health1.current = 80;

    const creep2 = CreepFactory.createBasicCreep(world, [{ x: 120, y: 100 }]);
    const health2 = world.getComponent<HealthComponent>(creep2, HEALTH_COMPONENT)!;
    health2.current = 25;

    world.update(0.016);

    expect(tower.targetEntityId).toBe(creep2);
  });

  it('should prioritize closest creep when strategy is closest', () => {
    const towerEntity = TowerFactory.createTower(world, 'archer', 1, 1);
    const towerPos = world.getComponent<TowerPositionComponent>(towerEntity, TOWER_POS_COMP)!;
    towerPos.x = 100;
    towerPos.y = 100;

    const tower = world.getComponent<TowerComponent>(towerEntity, TOWER_COMPONENT)!;
    tower.range = 100;
    tower.targetStrategy = 'closest';

    // Creep 1 at dist 60
    const creep1 = CreepFactory.createBasicCreep(world, [{ x: 160, y: 100 }]);
    // Creep 2 at dist 20
    const creep2 = CreepFactory.createBasicCreep(world, [{ x: 120, y: 100 }]);

    world.update(0.016);

    expect(tower.targetEntityId).toBe(creep2);
    expect(tower.targetEntityId).not.toBe(creep1);
  });

  it('should ignore dead creeps (health <= 0)', () => {
    const towerEntity = TowerFactory.createTower(world, 'archer', 1, 1);
    const towerPos = world.getComponent<TowerPositionComponent>(towerEntity, TOWER_POS_COMP)!;
    towerPos.x = 100;
    towerPos.y = 100;

    const tower = world.getComponent<TowerComponent>(towerEntity, TOWER_COMPONENT)!;
    tower.range = 100;

    const deadCreep = CreepFactory.createBasicCreep(world, [{ x: 110, y: 100 }]);
    const healthDead = world.getComponent<HealthComponent>(deadCreep, HEALTH_COMPONENT)!;
    healthDead.current = 0;

    const liveCreep = CreepFactory.createBasicCreep(world, [{ x: 130, y: 100 }]);

    world.update(0.016);

    expect(tower.targetEntityId).toBe(liveCreep);
  });

  it('should set targetEntityId to null if no creeps are in range', () => {
    const towerEntity = TowerFactory.createTower(world, 'archer', 1, 1);
    const towerPos = world.getComponent<TowerPositionComponent>(towerEntity, TOWER_POS_COMP)!;
    towerPos.x = 100;
    towerPos.y = 100;

    const tower = world.getComponent<TowerComponent>(towerEntity, TOWER_COMPONENT)!;
    tower.range = 50;

    // Creep is at dist 100 > range 50
    CreepFactory.createBasicCreep(world, [{ x: 200, y: 100 }]);

    world.update(0.016);

    expect(tower.targetEntityId).toBeNull();
  });
});

describe('TowerControlSystem & Strategy Cycling (TASK-05-05)', () => {
  let world: World;

  beforeEach(() => {
    world = new World();
  });

  it('should cycle strategies in order: first -> lowestHp -> closest -> first', () => {
    expect(getNextTargetStrategy('first')).toBe('lowestHp');
    expect(getNextTargetStrategy('lowestHp')).toBe('closest');
    expect(getNextTargetStrategy('closest')).toBe('first');
  });

  it('should update tower component strategy using cycleTowerStrategy', () => {
    const towerEntity = TowerFactory.createTower(world, 'archer', 1, 1);
    const tower = world.getComponent<TowerComponent>(towerEntity, TOWER_COMPONENT)!;
    expect(tower.targetStrategy).toBe('first');

    const s1 = cycleTowerStrategy(world, towerEntity);
    expect(s1).toBe('lowestHp');
    expect(tower.targetStrategy).toBe('lowestHp');

    const s2 = cycleTowerStrategy(world, towerEntity);
    expect(s2).toBe('closest');
    expect(tower.targetStrategy).toBe('closest');

    const s3 = cycleTowerStrategy(world, towerEntity);
    expect(s3).toBe('first');
    expect(tower.targetStrategy).toBe('first');
  });

  it('should set strategy directly with setTowerStrategy', () => {
    const towerEntity = TowerFactory.createTower(world, 'cannon', 2, 2);
    const tower = world.getComponent<TowerComponent>(towerEntity, TOWER_COMPONENT)!;

    const success = setTowerStrategy(world, towerEntity, 'closest');
    expect(success).toBe(true);
    expect(tower.targetStrategy).toBe('closest');

    expect(setTowerStrategy(world, 9999 as Entity, 'lowestHp')).toBe(false);
  });

  it('should manage selected tower and notify listeners on strategy change', () => {
    const controlSystem = new TowerControlSystem();
    const towerEntity = TowerFactory.createTower(world, 'mage', 3, 3);

    let changedEntity: Entity | null = null;
    let changedStrategy: string | null = null;

    controlSystem.onStrategyChanged((entity, strat) => {
      changedEntity = entity;
      changedStrategy = strat;
    });

    controlSystem.selectTower(towerEntity);
    expect(controlSystem.getSelectedTower()).toBe(towerEntity);

    const next = controlSystem.cycleSelectedTowerStrategy(world);
    expect(next).toBe('lowestHp');
    expect(changedEntity).toBe(towerEntity);
    expect(changedStrategy).toBe('lowestHp');
  });
});
