import { World } from '../../core/ecs/World';
import { System } from '../../core/ecs/System';
import { Entity } from '../../core/ecs/Component';
import { IVector2 } from '../../core/math/Vector2';
import {
  TOWER_COMPONENT,
  POSITION_COMPONENT as TOWER_POS_COMP,
  TowerComponent,
  PositionComponent as TowerPositionComponent,
} from '../towers/TowerComponents';
import {
  CREEP_COMPONENT,
  HEALTH_COMPONENT,
  POSITION_COMPONENT as CREEP_POS_COMP,
  PATH_FOLLOWER_COMPONENT,
  HealthComponent,
  PositionComponent as CreepPositionComponent,
  PathFollowerComponent,
} from '../creeps/CreepComponents';
import {
  TargetCandidate,
  selectTargetByStrategy,
} from '../towers/TargetingStrategies';

export class TargetingSystem implements System {
  public name = 'TargetingSystem';
  public priority = 15;

  public update(world: World, _dt: number): void {
    const towerEntities = world.query([TOWER_COMPONENT]);

    for (const towerEntity of towerEntities) {
      const tower = world.getComponent<TowerComponent>(towerEntity, TOWER_COMPONENT);
      if (!tower) continue;

      const towerPos = this.getEntityPosition(world, towerEntity);
      if (!towerPos) continue;

      const candidates = this.getCandidatesInRange(world, towerPos, tower.range);
      const targetId = selectTargetByStrategy(tower.targetStrategy, candidates);

      tower.targetEntityId = targetId;
    }
  }

  /**
   * Retrieves all alive creep candidates located within range of a given origin point.
   */
  public getCandidatesInRange(
    world: World,
    origin: IVector2,
    rangeRadius: number
  ): TargetCandidate[] {
    const creepEntities = world.query([CREEP_COMPONENT, HEALTH_COMPONENT]);
    const candidates: TargetCandidate[] = [];

    for (const creepEntity of creepEntities) {
      if (!world.isAlive(creepEntity)) continue;

      const health = world.getComponent<HealthComponent>(creepEntity, HEALTH_COMPONENT);
      if (!health || health.current <= 0) continue;

      const pos = this.getEntityPosition(world, creepEntity);
      if (!pos) continue;

      const dx = pos.x - origin.x;
      const dy = pos.y - origin.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= rangeRadius) {
        const pathFollower = world.getComponent<PathFollowerComponent>(
          creepEntity,
          PATH_FOLLOWER_COMPONENT
        );

        candidates.push({
          entity: creepEntity,
          position: { x: pos.x, y: pos.y },
          health: {
            current: health.current,
            max: health.max,
          },
          distanceTraveled: pathFollower?.distanceTraveled ?? 0,
          distanceToTower: dist,
        });
      }
    }

    return candidates;
  }

  /**
   * Resolves entity position checking both 'Position' and 'PositionComponent' pools.
   */
  private getEntityPosition(world: World, entity: Entity): IVector2 | null {
    const pos =
      world.getComponent<CreepPositionComponent>(entity, CREEP_POS_COMP) ??
      world.getComponent<TowerPositionComponent>(entity, TOWER_POS_COMP);

    if (pos) {
      return { x: pos.x, y: pos.y };
    }
    return null;
  }
}
