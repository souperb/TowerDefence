export * from './ecs/Component';
export * from './ecs/EntityManager';
export * from './ecs/System';
export * from './ecs/World';

export * from './loop/Time';
export * from './loop/TimeControls';
export * from './loop/GameLoop';

export * from './math/Vector2';
export * from './events/EngineEvents';

export interface IGameEngine {
  start(): void;
  stop(): void;
  update(deltaTime: number): void;
}

