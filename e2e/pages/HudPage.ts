import { Locator, Page } from '@playwright/test';

export class HudPage {
  readonly hudBar: Locator;
  readonly livesValue: Locator;
  readonly goldValue: Locator;
  readonly waveValue: Locator;
  readonly scoreValue: Locator;
  readonly startWaveButton: Locator;
  readonly startWaveText: Locator;
  readonly speedButton: Locator;
  readonly speedLabel: Locator;
  readonly pauseButton: Locator;
  readonly pauseLabel: Locator;
  readonly levelsButton: Locator;
  readonly autoWaveButton: Locator;
  readonly autoWaveLabel: Locator;

  constructor(private readonly page: Page) {
    this.hudBar = page.locator('[data-ref="hudBar"]');
    this.livesValue = page.locator('[data-ref="valLives"]');
    this.goldValue = page.locator('[data-ref="valGold"]');
    this.waveValue = page.locator('[data-ref="valWave"]');
    this.scoreValue = page.locator('[data-ref="valScore"]');
    this.startWaveButton = page.locator('[data-ref="btnStartWave"]');
    this.startWaveText = page.locator('[data-ref="txtStartWave"]');
    this.speedButton = page.locator('[data-ref="btnSpeed"]');
    this.speedLabel = page.locator('[data-ref="lblSpeed"]');
    this.pauseButton = page.locator('[data-ref="btnPause"]');
    this.pauseLabel = page.locator('[data-ref="lblPause"]');
    this.levelsButton = page.locator('[data-ref="btnLevels"]');
    this.autoWaveButton = page.locator('[data-ref="btnAutoWave"]');
    this.autoWaveLabel = page.locator('[data-ref="lblAutoWave"]');
  }

  async getGold(): Promise<number> {
    const text = await this.goldValue.innerText();
    return parseInt(text.replace(/,/g, ''), 10);
  }

  async getLives(): Promise<number> {
    const text = await this.livesValue.innerText();
    return parseInt(text.replace(/,/g, ''), 10);
  }

  async getWaveText(): Promise<string> {
    return (await this.waveValue.innerText()).trim();
  }

  async getScore(): Promise<number> {
    const text = await this.scoreValue.innerText();
    return parseInt(text.replace(/,/g, ''), 10);
  }

  async getSpeed(): Promise<string> {
    return (await this.speedLabel.innerText()).trim();
  }

  async getPauseLabel(): Promise<string> {
    return (await this.pauseLabel.innerText()).trim();
  }

  async isPaused(): Promise<boolean> {
    const label = await this.getPauseLabel();
    return label.toLowerCase() === 'resume';
  }

  async isStartWaveDisabled(): Promise<boolean> {
    return await this.startWaveButton.isDisabled();
  }

  async clickStartWave(): Promise<void> {
    await this.startWaveButton.click();
  }

  async clickSpeed(): Promise<void> {
    await this.speedButton.click();
  }

  async clickPause(): Promise<void> {
    await this.pauseButton.click();
  }

  async clickLevels(): Promise<void> {
    await this.levelsButton.click();
  }

  async clickAutoWave(): Promise<void> {
    await this.autoWaveButton.click();
  }

  async getAutoWaveText(): Promise<string> {
    return (await this.autoWaveLabel.innerText()).trim();
  }
}
