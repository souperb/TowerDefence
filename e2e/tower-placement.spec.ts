import { test, expect } from '@playwright/test';
import { GamePage } from './pages';

test.describe('Tower Placement', () => {
  let game: GamePage;

  test.beforeEach(async ({ page }) => {
    game = new GamePage(page);
    await game.goto();
  });

  test('should select and toggle tower cards on click', async () => {
    // Select Archer
    await game.buildBar.selectTower('archer');
    expect(await game.buildBar.isTowerSelected('archer')).toBe(true);

    // Click again to toggle off
    await game.buildBar.selectTower('archer');
    expect(await game.buildBar.isTowerSelected('archer')).toBe(false);

    // Select Cannon then switch to Mage
    await game.buildBar.selectTower('cannon');
    expect(await game.buildBar.isTowerSelected('cannon')).toBe(true);

    await game.buildBar.selectTower('mage');
    expect(await game.buildBar.isTowerSelected('mage')).toBe(true);
    expect(await game.buildBar.isTowerSelected('cannon')).toBe(false);
  });

  test('should place tower on valid buildable tile and deduct gold', async () => {
    expect(await game.hud.getGold()).toBe(300);

    // Place Archer (cost: 100g) on tile (2, 2)
    await game.placeTower('archer', 2, 2);

    // Verify gold is deducted to 200
    await expect(game.hud.goldValue).toHaveText('200');
    expect(await game.hud.getGold()).toBe(200);

    // Card should no longer be selected after placement
    expect(await game.buildBar.isTowerSelected('archer')).toBe(false);
  });

  test('should disable tower cards when gold balance is insufficient', async () => {
    expect(await game.hud.getGold()).toBe(300);

    // Place Mage (cost: 200g) on tile (5, 2)
    await game.placeTower('mage', 5, 2);
    await expect(game.hud.goldValue).toHaveText('100');

    // With 100g: Archer (100g) is enabled, Cannon (150g) and Mage (200g) are disabled
    expect(await game.buildBar.isTowerDisabled('archer')).toBe(false);
    expect(await game.buildBar.isTowerDisabled('cannon')).toBe(true);
    expect(await game.buildBar.isTowerDisabled('mage')).toBe(true);

    // Place Archer (cost: 100g) on tile (2, 2)
    await game.placeTower('archer', 2, 2);
    await expect(game.hud.goldValue).toHaveText('0');

    // With 0g: all tower cards are disabled
    expect(await game.buildBar.isTowerDisabled('archer')).toBe(true);
    expect(await game.buildBar.isTowerDisabled('cannon')).toBe(true);
    expect(await game.buildBar.isTowerDisabled('mage')).toBe(true);
  });

  test('should reject placement on path or obstacle tiles without deducting gold', async () => {
    expect(await game.hud.getGold()).toBe(300);

    // Select Cannon (150g)
    await game.buildBar.selectTower('cannon');
    expect(await game.buildBar.isTowerSelected('cannon')).toBe(true);

    // Click on Path tile at (15, 7)
    await game.clickTile(15, 7);

    // Gold should not be deducted and placement remains active
    expect(await game.hud.getGold()).toBe(300);
    expect(await game.buildBar.isTowerSelected('cannon')).toBe(true);

    // Click on Obstacle tile at (3, 9)
    await game.clickTile(3, 9);

    // Gold still not deducted
    expect(await game.hud.getGold()).toBe(300);
    expect(await game.buildBar.isTowerSelected('cannon')).toBe(true);

    // Cancel placement
    await game.pressEscape();
    expect(await game.buildBar.isTowerSelected('cannon')).toBe(false);
  });

  test('should reject placement on an already occupied tile', async () => {
    // Place Archer at (2, 2)
    await game.placeTower('archer', 2, 2);
    await expect(game.hud.goldValue).toHaveText('200');

    // Select Cannon and attempt to place at (2, 2)
    await game.buildBar.selectTower('cannon');
    await game.clickTile(2, 2);

    // Gold should remain 200
    expect(await game.hud.getGold()).toBe(200);
    expect(await game.buildBar.isTowerSelected('cannon')).toBe(true);
  });
});
