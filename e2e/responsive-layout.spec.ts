import { test, expect } from '@playwright/test';
import { GamePage } from './pages';

test.describe('Responsive Layout and Touch Target Sizing', () => {
  test('should render and adapt correctly on mobile viewport (375x667)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const game = new GamePage(page);
    await game.goto();

    await expect(game.canvas).toBeVisible();
    await expect(game.hud.hudBar).toBeVisible();
    await expect(game.buildBar.buildToolbar).toBeVisible();

    // Verify touch target dimensions >= 44x44px on primary buttons
    const startWaveBox = await game.hud.startWaveButton.boundingBox();
    expect(startWaveBox).not.toBeNull();
    expect(startWaveBox!.height).toBeGreaterThanOrEqual(44);
    expect(startWaveBox!.width).toBeGreaterThanOrEqual(44);

    const speedBox = await game.hud.speedButton.boundingBox();
    expect(speedBox).not.toBeNull();
    expect(speedBox!.height).toBeGreaterThanOrEqual(44);
    expect(speedBox!.width).toBeGreaterThanOrEqual(44);

    const pauseBox = await game.hud.pauseButton.boundingBox();
    expect(pauseBox).not.toBeNull();
    expect(pauseBox!.height).toBeGreaterThanOrEqual(44);
    expect(pauseBox!.width).toBeGreaterThanOrEqual(44);

    // Verify tower cards meet minimum touch height >= 44px
    for (const card of [game.buildBar.archerCard, game.buildBar.cannonCard, game.buildBar.mageCard]) {
      const cardBox = await card.boundingBox();
      expect(cardBox).not.toBeNull();
      expect(cardBox!.height).toBeGreaterThanOrEqual(44);
      expect(cardBox!.width).toBeGreaterThanOrEqual(44);
    }
  });

  test('should render and adapt correctly on tablet viewport (768x1024)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    const game = new GamePage(page);
    await game.goto();

    await expect(game.canvas).toBeVisible();
    await expect(game.hud.hudBar).toBeVisible();
    await expect(game.buildBar.buildToolbar).toBeVisible();

    // Tower cards selection works on tablet viewport
    await game.buildBar.selectTower('archer');
    expect(await game.buildBar.isTowerSelected('archer')).toBe(true);
  });

  test('should verify detail panel action buttons meet minimum touch target sizes (>= 44x44px)', async ({
    page,
  }) => {
    const game = new GamePage(page);
    await game.goto();

    // Place and select a tower to open detail panel
    await game.placeTower('archer', 2, 2);
    await game.selectPlacedTower(2, 2);
    await expect(game.towerDetail.panel).toBeVisible();

    // Check upgrade button
    const upgradeBox = await game.towerDetail.upgradeButton.boundingBox();
    expect(upgradeBox).not.toBeNull();
    expect(upgradeBox!.height).toBeGreaterThanOrEqual(44);

    // Check strategy button
    const strategyBox = await game.towerDetail.strategyButton.boundingBox();
    expect(strategyBox).not.toBeNull();
    expect(strategyBox!.height).toBeGreaterThanOrEqual(44);

    // Check sell button
    const sellBox = await game.towerDetail.sellButton.boundingBox();
    expect(sellBox).not.toBeNull();
    expect(sellBox!.height).toBeGreaterThanOrEqual(44);

    // Check close button
    const closeBox = await game.towerDetail.closeButton.boundingBox();
    expect(closeBox).not.toBeNull();
    expect(closeBox!.height).toBeGreaterThanOrEqual(44);
    expect(closeBox!.width).toBeGreaterThanOrEqual(44);
  });
});
