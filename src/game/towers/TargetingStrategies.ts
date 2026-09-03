import { Entity } from '../../core/ecs/Component';
import { IVector2 } from '../../core/math/Vector2';
import { TargetStrategy } from './TowerComponents';

export interface TargetCandidate {
  entity: Entity;
  position: IVector2;
  health: {
    current: number;
    max: number;
  };
  distanceTraveled: number;
  distanceToTower: number;
}

export type TargetingStrategyFn = (candidates: TargetCandidate[]) => Entity | null;

/**
 * 'first' Strategy: Prioritizes the creep that has traveled furthest along the path.
 * If tied, picks the candidate with lowest HP, then lowest entity ID.
 */
export function targetFirst(candidates: TargetCandidate[]): Entity | null {
  if (candidates.length === 0) {
    return null;
  }

  let best: TargetCandidate = candidates[0];

  for (let i = 1; i < candidates.length; i++) {
    const candidate = candidates[i];
    if (candidate.distanceTraveled > best.distanceTraveled) {
      best = candidate;
    } else if (candidate.distanceTraveled === best.distanceTraveled) {
      if (candidate.health.current < best.health.current) {
        best = candidate;
      } else if (
        candidate.health.current === best.health.current &&
        candidate.entity < best.entity
      ) {
        best = candidate;
      }
    }
  }

  return best.entity;
}

/**
 * 'lowestHp' Strategy: Prioritizes the creep with the lowest current health.
 * If tied, picks the candidate furthest along the path, then lowest entity ID.
 */
export function targetLowestHp(candidates: TargetCandidate[]): Entity | null {
  if (candidates.length === 0) {
    return null;
  }

  let best: TargetCandidate = candidates[0];

  for (let i = 1; i < candidates.length; i++) {
    const candidate = candidates[i];
    if (candidate.health.current < best.health.current) {
      best = candidate;
    } else if (candidate.health.current === best.health.current) {
      if (candidate.distanceTraveled > best.distanceTraveled) {
        best = candidate;
      } else if (
        candidate.distanceTraveled === best.distanceTraveled &&
        candidate.entity < best.entity
      ) {
        best = candidate;
      }
    }
  }

  return best.entity;
}

/**
 * 'closest' Strategy: Prioritizes the creep with minimum Euclidean distance to the tower.
 * If tied, picks the candidate furthest along the path, then lowest entity ID.
 */
export function targetClosest(candidates: TargetCandidate[]): Entity | null {
  if (candidates.length === 0) {
    return null;
  }

  let best: TargetCandidate = candidates[0];

  for (let i = 1; i < candidates.length; i++) {
    const candidate = candidates[i];
    if (candidate.distanceToTower < best.distanceToTower) {
      best = candidate;
    } else if (candidate.distanceToTower === best.distanceToTower) {
      if (candidate.distanceTraveled > best.distanceTraveled) {
        best = candidate;
      } else if (
        candidate.distanceTraveled === best.distanceTraveled &&
        candidate.entity < best.entity
      ) {
        best = candidate;
      }
    }
  }

  return best.entity;
}

export const TARGETING_STRATEGIES: Record<TargetStrategy, TargetingStrategyFn> = {
  first: targetFirst,
  lowestHp: targetLowestHp,
  closest: targetClosest,
};

/**
 * Returns the targeting strategy evaluator function.
 */
export function getTargetingStrategy(strategy: TargetStrategy): TargetingStrategyFn {
  const fn = TARGETING_STRATEGIES[strategy];
  if (!fn) {
    throw new Error(`Unknown targeting strategy: ${strategy}`);
  }
  return fn;
}

/**
 * Selects a target entity among candidate creeps using the specified strategy.
 */
export function selectTargetByStrategy(
  strategy: TargetStrategy,
  candidates: TargetCandidate[]
): Entity | null {
  const strategyFn = getTargetingStrategy(strategy);
  return strategyFn(candidates);
}
