import { Locator, Page } from '@playwright/test';

export class ModalPage {
  // Victory Modal
  readonly victoryModal: Locator;
  readonly victoryScore: Locator;
  readonly victoryWaves: Locator;
  readonly victoryStars: Locator;
  readonly victoryLives: Locator;
  readonly victoryRestartButton: Locator;
  readonly victoryNextButton: Locator;
  readonly victoryMenuButton: Locator;

  // Game Over Modal
  readonly gameOverModal: Locator;
  readonly gameOverScore: Locator;
  readonly gameOverWave: Locator;
  readonly gameOverKills: Locator;
  readonly gameOverRetryButton: Locator;
  readonly gameOverMenuButton: Locator;

  // Level Select Modal
  readonly levelSelectModal: Locator;
  readonly startAdventureButton: Locator;
  readonly levelSelectCloseButton: Locator;
  readonly levelCards: Locator;

  constructor(private readonly page: Page) {
    this.victoryModal = page.locator('.victory-modal');
    this.victoryScore = page.locator('#victory-score');
    this.victoryWaves = page.locator('#victory-waves');
    this.victoryStars = page.locator('#victory-stars');
    this.victoryLives = page.locator('#victory-lives');
    this.victoryRestartButton = page.locator('#btn-victory-restart');
    this.victoryNextButton = page.locator('#btn-victory-next');
    this.victoryMenuButton = page.locator('#btn-victory-menu');

    this.gameOverModal = page.locator('.game-over-modal');
    this.gameOverScore = page.locator('#gameover-score');
    this.gameOverWave = page.locator('#gameover-wave');
    this.gameOverKills = page.locator('#gameover-kills');
    this.gameOverRetryButton = page.locator('#btn-gameover-retry');
    this.gameOverMenuButton = page.locator('#btn-gameover-menu');

    this.levelSelectModal = page.locator('.level-select-modal');
    this.startAdventureButton = page.locator('#btn-start-adventure');
    this.levelSelectCloseButton = page.locator('#btn-level-select-close');
    this.levelCards = page.locator('.level-card');
  }

  async isVictoryVisible(): Promise<boolean> {
    return await this.victoryModal.isVisible();
  }

  async isGameOverVisible(): Promise<boolean> {
    return await this.gameOverModal.isVisible();
  }

  async getVictoryScore(): Promise<number> {
    const text = await this.victoryScore.innerText();
    return parseInt(text.replace(/,/g, ''), 10);
  }

  async getGameOverScore(): Promise<number> {
    const text = await this.gameOverScore.innerText();
    return parseInt(text.replace(/,/g, ''), 10);
  }

  async clickVictoryRestart(): Promise<void> {
    await this.victoryRestartButton.click();
  }

  async clickVictoryNext(): Promise<void> {
    await this.victoryNextButton.click();
  }

  async clickGameOverRetry(): Promise<void> {
    await this.gameOverRetryButton.click();
  }

  async clickStartAdventure(): Promise<void> {
    await this.startAdventureButton.click();
  }

  async clickCloseLevelSelect(): Promise<void> {
    await this.levelSelectCloseButton.click();
  }

  async clickPlayLevel(levelId: string): Promise<void> {
    const btn = this.page.locator(`[data-level-id="${levelId}"] .btn-play-level`);
    await btn.click();
  }
}
