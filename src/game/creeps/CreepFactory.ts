import { World } from '../../core/ecs/World';
import { Entity } from '../../core/ecs/Component';
import { IVector2 } from '../../core/math/Vector2';
import {
  CreepType,
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
} from './CreepComponents';

export interface CreepArchetype {
  creepType: CreepType;
  hp: number;
  speed: number;
  bountyGold: number;
  damageToBase: number;
  scoreValue: number;
  width: number;
  height: number;
  color: string;
  shape?: 'circle' | 'square' | 'diamond' | 'hexagon';
}

export const DEFAULT_CREEP_ARCHETYPES: Record<CreepType, CreepArchetype> = {
  basic: {
    creepType: 'basic',
    hp: 100,
    speed: 60,
    bountyGold: 8,
    damageToBase: 1,
    scoreValue: 20,
    width: 16,
    height: 16,
    color: '#48cae4',
    shape: 'circle',
  },
  fast: {
    creepType: 'fast',
    hp: 55,
    speed: 110,
    bountyGold: 6,
    damageToBase: 1,
    scoreValue: 25,
    width: 14,
    height: 14,
    color: '#f77f00',
    shape: 'diamond',
  },
  tank: {
    creepType: 'tank',
    hp: 420,
    speed: 35,
    bountyGold: 20,
    damageToBase: 2,
    scoreValue: 60,
    width: 22,
    height: 22,
    color: '#588157',
    shape: 'square',
  },
  boss: {
    creepType: 'boss',
    hp: 1600,
    speed: 28,
    bountyGold: 80,
    damageToBase: 5,
    scoreValue: 300,
    width: 28,
    height: 28,
    color: '#d90429',
    shape: 'hexagon',
  },
};

export class CreepFactory {
  private static archetypes: Map<CreepType, CreepArchetype> = new Map(
    Object.entries(DEFAULT_CREEP_ARCHETYPES) as [CreepType, CreepArchetype][]
  );

  /**
   * Registers or updates a creep archetype configuration.
   */
  public static registerArchetype(type: CreepType, archetype: CreepArchetype): void {
    this.archetypes.set(type, { ...archetype });
  }

  /**
   * Retrieves the archetype configuration for a given creep type.
   */
  public static getArchetype(type: CreepType): CreepArchetype {
    const config = this.archetypes.get(type);
    if (!config) {
      throw new Error(`Unknown creep archetype: ${type}`);
    }
    return { ...config };
  }

  /**
   * Resets archetypes back to default configurations.
   */
  public static resetArchetypes(): void {
    this.archetypes = new Map(
      Object.entries(DEFAULT_CREEP_ARCHETYPES) as [CreepType, CreepArchetype][]
    );
  }

  /**
   * Creates an ECS entity for a creep along a sequence of waypoints.
   */
  public static createCreep(
    world: World,
    type: CreepType,
    waypoints: IVector2[],
    overrides?: Partial<CreepArchetype>
  ): Entity {
    const baseConfig = this.getArchetype(type);
    const config: CreepArchetype = { ...baseConfig, ...overrides };

    const entity = world.createEntity();

    const startPos: IVector2 = waypoints.length > 0 ? { ...waypoints[0] } : { x: 0, y: 0 };
    const clonedWaypoints = waypoints.map((wp) => ({ x: wp.x, y: wp.y }));

    const creepComp: CreepComponent = {
      creepType: config.creepType,
      bountyGold: config.bountyGold,
      damageToBase: config.damageToBase,
      scoreValue: config.scoreValue,
    };

    const pathFollowerComp: PathFollowerComponent = {
      waypoints: clonedWaypoints,
      currentWaypointIndex: clonedWaypoints.length > 1 ? 1 : 0,
      distanceTraveled: 0,
      reachedEnd: false,
    };

    const healthComp: HealthComponent = {
      current: config.hp,
      max: config.hp,
    };

    const posComp: PositionComponent = {
      x: startPos.x,
      y: startPos.y,
    };

    const velComp: VelocityComponent = {
      vx: 0,
      vy: 0,
      speed: config.speed,
    };

    const spriteComp: SpriteComponent = {
      width: config.width,
      height: config.height,
      rotation: 0,
      visible: true,
      color: config.color,
      shape: config.shape,
    };

    world.addComponent(entity, CREEP_COMPONENT, creepComp);
    world.addComponent(entity, PATH_FOLLOWER_COMPONENT, pathFollowerComp);
    world.addComponent(entity, HEALTH_COMPONENT, healthComp);
    world.addComponent(entity, POSITION_COMPONENT, posComp);
    world.addComponent(entity, VELOCITY_COMPONENT, velComp);
    world.addComponent(entity, SPRITE_COMPONENT, spriteComp);

    return entity;
  }

  public static createBasicCreep(
    world: World,
    waypoints: IVector2[],
    overrides?: Partial<CreepArchetype>
  ): Entity {
    return this.createCreep(world, 'basic', waypoints, overrides);
  }

  public static createFastCreep(
    world: World,
    waypoints: IVector2[],
    overrides?: Partial<CreepArchetype>
  ): Entity {
    return this.createCreep(world, 'fast', waypoints, overrides);
  }

  public static createTankCreep(
    world: World,
    waypoints: IVector2[],
    overrides?: Partial<CreepArchetype>
  ): Entity {
    return this.createCreep(world, 'tank', waypoints, overrides);
  }

  public static createBossCreep(
    world: World,
    waypoints: IVector2[],
    overrides?: Partial<CreepArchetype>
  ): Entity {
    return this.createCreep(world, 'boss', waypoints, overrides);
  }
}
