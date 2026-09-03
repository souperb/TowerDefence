import { World } from '../../core/ecs/World';
import { Entity } from '../../core/ecs/Component';
import { System } from '../../core/ecs/System';
import {
  TOWER_COMPONENT,
  TowerComponent,
  TargetStrategy,
} from '../towers/TowerComponents';

export const TARGET_STRATEGY_ORDER: readonly TargetStrategy[] = [
  'first',
  'lowestHp',
  'closest',
] as const;

/**
 * Returns the next targeting strategy in the cyclic progression:
 * 'first' -> 'lowestHp' -> 'closest' -> 'first'.
 */
export function getNextTargetStrategy(current: TargetStrategy): TargetStrategy {
  const currentIndex = TARGET_STRATEGY_ORDER.indexOf(current);
  if (currentIndex === -1) {
    return 'first';
  }
  const nextIndex = (currentIndex + 1) % TARGET_STRATEGY_ORDER.length;
  return TARGET_STRATEGY_ORDER[nextIndex];
}

/**
 * Cycles the targeting strategy on a given tower entity and returns the new strategy.
 */
export function cycleTowerStrategy(
  world: World,
  towerEntity: Entity
): TargetStrategy | null {
  const tower = world.getComponent<TowerComponent>(towerEntity, TOWER_COMPONENT);
  if (!tower) {
    return null;
  }

  const nextStrategy = getNextTargetStrategy(tower.targetStrategy);
  tower.targetStrategy = nextStrategy;
  return nextStrategy;
}

/**
 * Explicitly sets the targeting strategy on a tower entity.
 */
export function setTowerStrategy(
  world: World,
  towerEntity: Entity,
  strategy: TargetStrategy
): boolean {
  const tower = world.getComponent<TowerComponent>(towerEntity, TOWER_COMPONENT);
  if (!tower) {
    return false;
  }

  tower.targetStrategy = strategy;
  return true;
}

export type TowerStrategyChangedCallback = (
  towerEntity: Entity,
  newStrategy: TargetStrategy
) => void;

export class TowerControlSystem implements System {
  public name = 'TowerControlSystem';
  public priority = 12;

  private selectedTowerEntity: Entity | null = null;
  private strategyChangeListeners: Set<TowerStrategyChangedCallback> = new Set();

  public selectTower(entity: Entity | null): void {
    this.selectedTowerEntity = entity;
  }

  public getSelectedTower(): Entity | null {
    return this.selectedTowerEntity;
  }

  public cycleSelectedTowerStrategy(world: World): TargetStrategy | null {
    if (this.selectedTowerEntity === null) {
      return null;
    }

    const next = cycleTowerStrategy(world, this.selectedTowerEntity);
    if (next) {
      this.notifyStrategyChanged(this.selectedTowerEntity, next);
    }
    return next;
  }

  public onStrategyChanged(callback: TowerStrategyChangedCallback): () => void {
    this.strategyChangeListeners.add(callback);
    return () => this.strategyChangeListeners.delete(callback);
  }

  public update(_world: World, _dt: number): void {
    // Control logic is event and interaction driven
  }

  public destroy(_world: World): void {
    this.strategyChangeListeners.clear();
    this.selectedTowerEntity = null;
  }

  private notifyStrategyChanged(towerEntity: Entity, newStrategy: TargetStrategy): void {
    for (const listener of this.strategyChangeListeners) {
      try {
        listener(towerEntity, newStrategy);
      } catch (err) {
        console.error('[TowerControlSystem] Listener error:', err);
      }
    }
  }
}
