import { Locator, Page } from '@playwright/test';

export class TowerDetailPage {
  readonly panel: Locator;
  readonly icon: Locator;
  readonly name: Locator;
  readonly tier: Locator;
  readonly damage: Locator;
  readonly range: Locator;
  readonly fireRate: Locator;
  readonly splashRow: Locator;
  readonly splashRadius: Locator;
  readonly strategy: Locator;
  readonly upgradeButton: Locator;
  readonly strategyButton: Locator;
  readonly sellButton: Locator;
  readonly closeButton: Locator;

  constructor(private readonly page: Page) {
    this.panel = page.locator('.tower-detail-panel');
    this.icon = page.locator('.tower-detail-panel [data-ref="icon"]');
    this.name = page.locator('.tower-detail-panel [data-ref="name"]');
    this.tier = page.locator('.tower-detail-panel [data-ref="tier"]');
    this.damage = page.locator('.tower-detail-panel [data-ref="damage"]');
    this.range = page.locator('.tower-detail-panel [data-ref="range"]');
    this.fireRate = page.locator('.tower-detail-panel [data-ref="fireRate"]');
    this.splashRow = page.locator('.tower-detail-panel [data-ref="splashRow"]');
    this.splashRadius = page.locator('.tower-detail-panel [data-ref="splashRadius"]');
    this.strategy = page.locator('.tower-detail-panel [data-ref="strategy"]');
    this.upgradeButton = page.locator('.tower-detail-panel [data-ref="btnUpgrade"]');
    this.strategyButton = page.locator('.tower-detail-panel [data-ref="btnStrategy"]');
    this.sellButton = page.locator('.tower-detail-panel [data-ref="btnSell"]');
    this.closeButton = page.locator('.tower-detail-panel [data-ref="btnClose"]');
  }

  async isVisible(): Promise<boolean> {
    return await this.panel.isVisible();
  }

  async getName(): Promise<string> {
    return (await this.name.innerText()).trim();
  }

  async getTier(): Promise<string> {
    return (await this.tier.innerText()).trim();
  }

  async getDamage(): Promise<string> {
    return (await this.damage.innerText()).trim();
  }

  async getRange(): Promise<string> {
    return (await this.range.innerText()).trim();
  }

  async getFireRate(): Promise<string> {
    return (await this.fireRate.innerText()).trim();
  }

  async getStrategy(): Promise<string> {
    return (await this.strategy.innerText()).trim();
  }

  async getUpgradeButtonText(): Promise<string> {
    return (await this.upgradeButton.innerText()).trim();
  }

  async getSellButtonText(): Promise<string> {
    return (await this.sellButton.innerText()).trim();
  }

  async isUpgradeDisabled(): Promise<boolean> {
    return await this.upgradeButton.isDisabled();
  }

  async clickUpgrade(): Promise<void> {
    await this.upgradeButton.click();
  }

  async clickStrategy(): Promise<void> {
    await this.strategyButton.click();
  }

  async clickSell(): Promise<void> {
    await this.sellButton.click();
  }

  async clickClose(): Promise<void> {
    await this.closeButton.click();
  }
}
