import { Locator, Page } from '@playwright/test';

export type TowerType = 'archer' | 'cannon' | 'mage';

export class BuildBarPage {
  readonly buildToolbar: Locator;
  readonly archerCard: Locator;
  readonly cannonCard: Locator;
  readonly mageCard: Locator;

  constructor(private readonly page: Page) {
    this.buildToolbar = page.locator('.build-toolbar');
    this.archerCard = page.locator('.tower-card[data-tower-type="archer"]');
    this.cannonCard = page.locator('.tower-card[data-tower-type="cannon"]');
    this.mageCard = page.locator('.tower-card[data-tower-type="mage"]');
  }

  getCard(towerType: TowerType): Locator {
    switch (towerType) {
      case 'archer':
        return this.archerCard;
      case 'cannon':
        return this.cannonCard;
      case 'mage':
        return this.mageCard;
    }
  }

  async selectTower(towerType: TowerType): Promise<void> {
    const card = this.getCard(towerType);
    await card.click();
  }

  async isTowerSelected(towerType: TowerType): Promise<boolean> {
    const card = this.getCard(towerType);
    const classes = (await card.getAttribute('class')) ?? '';
    return classes.includes('selected');
  }

  async isTowerDisabled(towerType: TowerType): Promise<boolean> {
    const card = this.getCard(towerType);
    const isDisabled = await card.isDisabled();
    const classes = (await card.getAttribute('class')) ?? '';
    return isDisabled || classes.includes('disabled');
  }

  async getTowerCost(towerType: TowerType): Promise<number> {
    const card = this.getCard(towerType);
    const costText = await card.locator('[data-ref="cost"]').innerText();
    return parseInt(costText.replace(/[^0-9]/g, ''), 10);
  }
}
