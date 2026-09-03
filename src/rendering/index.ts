export * from './Viewport';
export * from './MapRenderer';
export * from './GridCursorRenderer';
export * from './PlacementRenderer';
export * from './CreepRenderer';
export * from './ProjectileRenderer';

export interface IRenderer {
  render(): void;
  resize(width: number, height: number): void;
}



