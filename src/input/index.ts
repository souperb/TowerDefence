export * from './InputManager';
export * from './PlacementController';
export * from './SelectionController';
export * from './KeyboardShortcuts';
export * from './TouchManager';

export interface IInputHandler {
  init(): void;
  destroy(): void;
}



