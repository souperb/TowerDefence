import { World } from './World';

/**
 * System interface for ECS logic execution during fixed-step ticks or render updates.
 */
export interface System {
  /**
   * Optional system name or identifier.
   */
  name?: string;

  /**
   * Priority or execution order (lower numbers run earlier).
   */
  priority?: number;

  /**
   * Initializes the system when registered with a World.
   */
  init?(world: World): void;

  /**
   * Executed on each simulation tick.
   * @param world The ECS World instance.
   * @param dt Delta time in seconds for the tick (e.g. 1/60s).
   */
  update(world: World, dt: number): void;

  /**
   * Optional teardown / cleanup.
   */
  destroy?(world: World): void;
}
