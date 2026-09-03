import { Locator, Page } from '@playwright/test';
import { HudPage } from './HudPage';
import { BuildBarPage, TowerType } from './BuildBarPage';
import { TowerDetailPage } from './TowerDetailPage';
import { ModalPage } from './ModalPage';

export class GamePage {
  readonly gameContainer: Locator;
  readonly canvas: Locator;
  readonly uiLayer: Locator;

  readonly hud: HudPage;
  readonly buildBar: BuildBarPage;
  readonly towerDetail: TowerDetailPage;
  readonly modal: ModalPage;

  constructor(readonly page: Page) {
    this.gameContainer = page.locator('#game-container');
    this.canvas = page.locator('#game-canvas');
    this.uiLayer = page.locator('#ui-layer');

    this.hud = new HudPage(page);
    this.buildBar = new BuildBarPage(page);
    this.towerDetail = new TowerDetailPage(page);
    this.modal = new ModalPage(page);
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
    await this.canvas.waitFor({ state: 'visible' });
  }

  /**
   * Calculates the client/CSS coordinates of a tile (col, row) on the canvas
   * considering letterbox offsets and scaling.
   */
  private async getTileCoordinates(col: number, row: number): Promise<{ x: number; y: number }> {
    const box = await this.canvas.boundingBox();
    if (!box) {
      throw new Error('Canvas bounding box could not be determined');
    }

    const virtualWidth = 960;
    const virtualHeight = 640;
    const tileSize = 32;

    const scaleX = box.width / virtualWidth;
    const scaleY = box.height / virtualHeight;
    const scale = Math.min(scaleX, scaleY);

    const offsetX = (box.width - virtualWidth * scale) / 2;
    const offsetY = (box.height - virtualHeight * scale) / 2;

    const worldX = col * tileSize + tileSize / 2;
    const worldY = row * tileSize + tileSize / 2;

    const x = offsetX + worldX * scale;
    const y = offsetY + worldY * scale;

    return { x, y };
  }

  async clickTile(col: number, row: number): Promise<void> {
    const coords = await this.getTileCoordinates(col, row);
    await this.canvas.click({ position: { x: coords.x, y: coords.y } });
  }

  async hoverTile(col: number, row: number): Promise<void> {
    const coords = await this.getTileCoordinates(col, row);
    await this.canvas.hover({ position: { x: coords.x, y: coords.y } });
  }

  async placeTower(towerType: TowerType, col: number, row: number): Promise<void> {
    await this.buildBar.selectTower(towerType);
    await this.clickTile(col, row);
  }

  async selectPlacedTower(col: number, row: number): Promise<void> {
    await this.clickTile(col, row);
  }

  async pressKey(key: string): Promise<void> {
    await this.page.keyboard.press(key);
  }

  async pressSpace(): Promise<void> {
    await this.pressKey(' ');
  }

  async pressEscape(): Promise<void> {
    await this.pressKey('Escape');
  }

  async pressHotkey(key: '1' | '2' | '3' | 'Escape' | 'Enter' | 's' | '[' | ']'): Promise<void> {
    await this.pressKey(key);
  }
}
