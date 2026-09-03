import { World } from '../../core/ecs/World';
import { System } from '../../core/ecs/System';
import {
  POSITION_COMPONENT,
  VELOCITY_COMPONENT,
  PATH_FOLLOWER_COMPONENT,
  SPRITE_COMPONENT,
  PositionComponent,
  VelocityComponent,
  PathFollowerComponent,
  SpriteComponent,
} from '../creeps/CreepComponents';

export class MovementSystem implements System {
  public name = 'MovementSystem';
  public priority = 10;

  public update(world: World, dt: number): void {
    if (dt <= 0) {
      return;
    }

    const entities = world.query([
      POSITION_COMPONENT,
      VELOCITY_COMPONENT,
      PATH_FOLLOWER_COMPONENT,
    ]);

    for (const entity of entities) {
      const pos = world.getComponent<PositionComponent>(entity, POSITION_COMPONENT)!;
      const vel = world.getComponent<VelocityComponent>(entity, VELOCITY_COMPONENT)!;
      const follower = world.getComponent<PathFollowerComponent>(entity, PATH_FOLLOWER_COMPONENT)!;
      const sprite = world.getComponent<SpriteComponent>(entity, SPRITE_COMPONENT);

      if (follower.reachedEnd) {
        vel.vx = 0;
        vel.vy = 0;
        continue;
      }

      if (follower.waypoints.length <= 1) {
        if (follower.waypoints.length === 1) {
          pos.x = follower.waypoints[0].x;
          pos.y = follower.waypoints[0].y;
        }
        follower.reachedEnd = true;
        vel.vx = 0;
        vel.vy = 0;
        continue;
      }

      let moveDist = vel.speed * dt;

      while (moveDist > 0 && !follower.reachedEnd) {
        if (follower.currentWaypointIndex >= follower.waypoints.length) {
          follower.reachedEnd = true;
          vel.vx = 0;
          vel.vy = 0;
          break;
        }

        const targetWp = follower.waypoints[follower.currentWaypointIndex];
        const dx = targetWp.x - pos.x;
        const dy = targetWp.y - pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= 1e-6) {
          follower.currentWaypointIndex++;
          if (follower.currentWaypointIndex >= follower.waypoints.length) {
            follower.reachedEnd = true;
            vel.vx = 0;
            vel.vy = 0;
            break;
          }
          continue;
        }

        if (moveDist >= dist) {
          pos.x = targetWp.x;
          pos.y = targetWp.y;
          follower.distanceTraveled += dist;
          moveDist -= dist;

          const dirX = dx / dist;
          const dirY = dy / dist;
          vel.vx = dirX * vel.speed;
          vel.vy = dirY * vel.speed;
          if (sprite) {
            sprite.rotation = Math.atan2(dirY, dirX);
          }

          follower.currentWaypointIndex++;
          if (follower.currentWaypointIndex >= follower.waypoints.length) {
            follower.reachedEnd = true;
            vel.vx = 0;
            vel.vy = 0;
            break;
          }
        } else {
          const dirX = dx / dist;
          const dirY = dy / dist;

          pos.x += dirX * moveDist;
          pos.y += dirY * moveDist;
          follower.distanceTraveled += moveDist;

          vel.vx = dirX * vel.speed;
          vel.vy = dirY * vel.speed;

          if (sprite) {
            sprite.rotation = Math.atan2(dirY, dirX);
          }

          moveDist = 0;
          break;
        }
      }
    }
  }
}
