import { World } from '../../core/ecs/World';
import { System } from '../../core/ecs/System';
import { EventBus, engineEvents } from '../../core/events/EngineEvents';
import {
  CREEP_COMPONENT,
  PATH_FOLLOWER_COMPONENT,
  HEALTH_COMPONENT,
  CreepComponent,
  PathFollowerComponent,
  HealthComponent,
} from '../creeps/CreepComponents';

export class BaseBreachSystem implements System {
  public name = 'BaseBreachSystem';
  public priority = 15;

  private eventBus: EventBus;
  private totalBreaches: number = 0;
  private totalBaseDamage: number = 0;

  constructor(eventBus: EventBus = engineEvents) {
    this.eventBus = eventBus;
  }

  public setEventBus(bus: EventBus): void {
    this.eventBus = bus;
  }

  public getTotalBreaches(): number {
    return this.totalBreaches;
  }

  public getTotalBaseDamage(): number {
    return this.totalBaseDamage;
  }

  public resetStats(): void {
    this.totalBreaches = 0;
    this.totalBaseDamage = 0;
  }

  public update(world: World, _dt: number): void {
    const entities = world.query([
      CREEP_COMPONENT,
      PATH_FOLLOWER_COMPONENT,
      HEALTH_COMPONENT,
    ]);

    for (const entity of entities) {
      const follower = world.getComponent<PathFollowerComponent>(entity, PATH_FOLLOWER_COMPONENT)!;
      const creep = world.getComponent<CreepComponent>(entity, CREEP_COMPONENT)!;
      const health = world.getComponent<HealthComponent>(entity, HEALTH_COMPONENT)!;

      if (follower.reachedEnd) {
        this.totalBreaches++;
        this.totalBaseDamage += creep.damageToBase;

        this.eventBus.emit('BASE_BREACH', {
          entity,
          creepType: creep.creepType,
          damageToBase: creep.damageToBase,
          remainingHp: health.current,
        });

        world.destroyEntity(entity);
      }
    }
  }
}
