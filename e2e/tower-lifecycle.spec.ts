import { test, expect } from '@playwright/test';
import { GamePage } from './pages';

test.describe('Tower Lifecycle (Inspect, Upgrade, Target Strategy, Sell)', () => {
  let game: GamePage;

  test.beforeEach(async ({ page }) => {
    game = new GamePage(page);
    await game.goto();
  });

  test('should inspect placed tower and display details panel with correct stats', async () => {
    // Place an Archer tower at (2, 2)
    await game.placeTower('archer', 2, 2);
    await expect(game.hud.goldValue).toHaveText('200');

    // Select the placed tower by clicking on its tile
    await game.selectPlacedTower(2, 2);

    // Detail panel should be visible
    await expect(game.towerDetail.panel).toBeVisible();
    expect(await game.towerDetail.getName()).toContain('Archer');
    expect(await game.towerDetail.getTier()).toMatch(/Tier 1/i);
    expect(await game.towerDetail.getStrategy()).toBe('First');

    // Check upgrade and sell button texts
    expect(await game.towerDetail.getUpgradeButtonText()).toContain('Upgrade');
    expect(await game.towerDetail.getSellButtonText()).toContain('Sell (+70g)');
  });

  test('should upgrade tower tier, deduct upgrade cost, and update stats', async () => {
    // Place Archer tower (cost 100g -> 200g remaining)
    await game.placeTower('archer', 2, 2);
    await game.selectPlacedTower(2, 2);

    await expect(game.towerDetail.panel).toBeVisible();
    expect(await game.towerDetail.getTier()).toMatch(/Tier 1/i);

    // Upgrade cost for Archer tier 1 -> 2 is 75g
    const initialDamage = await game.towerDetail.getDamage();
    await game.towerDetail.clickUpgrade();

    // Verify gold deduction: 200 - 75 = 125g
    await expect(game.hud.goldValue).toHaveText('125');

    // Verify tier updated to Tier 2
    expect(await game.towerDetail.getTier()).toMatch(/Tier 2/i);

    // Verify damage updated
    const upgradedDamage = await game.towerDetail.getDamage();
    expect(upgradedDamage).not.toBe(initialDamage);
  });

  test('should cycle target strategy through First -> Lowest HP -> Closest -> First', async () => {
    // Place Cannon tower at (5, 2)
    await game.placeTower('cannon', 5, 2);
    await game.selectPlacedTower(5, 2);

    await expect(game.towerDetail.panel).toBeVisible();
    expect(await game.towerDetail.getStrategy()).toBe('First');

    // Cycle 1: Lowest HP
    await game.towerDetail.clickStrategy();
    expect(await game.towerDetail.getStrategy()).toBe('Lowest HP');

    // Cycle 2: Closest
    await game.towerDetail.clickStrategy();
    expect(await game.towerDetail.getStrategy()).toBe('Closest');

    // Cycle 3: First
    await game.towerDetail.clickStrategy();
    expect(await game.towerDetail.getStrategy()).toBe('First');
  });

  test('should sell tower, refund 70% of invested cost, hide panel, and free the tile', async () => {
    // Place Archer at (2, 2) (invested: 100g, remaining: 200g)
    await game.placeTower('archer', 2, 2);
    await game.selectPlacedTower(2, 2);

    // Upgrade to Tier 2 (invested: 100 + 75 = 175g, remaining: 125g)
    await game.towerDetail.clickUpgrade();
    await expect(game.hud.goldValue).toHaveText('125');

    // 70% refund of 175g = 122g
    expect(await game.towerDetail.getSellButtonText()).toContain('+122g');

    // Sell the tower
    await game.towerDetail.clickSell();

    // Detail panel should be hidden
    await expect(game.towerDetail.panel).toBeHidden();

    // Gold balance should now be 125 + 122 = 247g
    await expect(game.hud.goldValue).toHaveText('247');

    // Tile (2, 2) should now be empty and buildable again
    await game.placeTower('cannon', 2, 2);
    // Cannon costs 150g -> 247 - 150 = 97g
    await expect(game.hud.goldValue).toHaveText('97');
  });

  test('should close detail panel on close button or Escape key', async () => {
    await game.placeTower('archer', 2, 2);

    // Open panel and close via button
    await game.selectPlacedTower(2, 2);
    await expect(game.towerDetail.panel).toBeVisible();
    await game.towerDetail.clickClose();
    await expect(game.towerDetail.panel).toBeHidden();

    // Open panel and close via Escape key
    await game.selectPlacedTower(2, 2);
    await expect(game.towerDetail.panel).toBeVisible();
    await game.pressEscape();
    await expect(game.towerDetail.panel).toBeHidden();
  });
});
