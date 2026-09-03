export * from './HudPresenter';
export * from './HudView';
export * from './TowerCardComponent';
export * from './BuildToolbar';
export * from './TowerDetailPanel';
export * from './VictoryModal';
export * from './GameOverModal';
export * from './LevelSelectModal';

export interface IUIManager {
  updateHUD(lives: number, gold: number, wave: number, score: number): void;
}


