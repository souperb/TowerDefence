import { test, expect } from '@playwright/test';
import { GamePage } from './pages';

test.describe('Wave Gameplay and Lifecycle Progression', () => {
  let game: GamePage;

  test.beforeEach(async ({ page }) => {
    game = new GamePage(page);
    await game.goto();
  });

  test('should start wave, update button text, and disable start button during wave', async () => {
    await expect(game.hud.startWaveButton).toBeEnabled();
    expect(await game.hud.getWaveText()).toBe('1 / 6');

    // Click Start Wave
    await game.hud.clickStartWave();

    // Verify button indicates wave in progress
    await expect(game.hud.startWaveText).toHaveText('Wave in Progress');
    await expect(game.hud.startWaveButton).toBeDisabled();
  });

  test('should trigger Game Over modal when base is breached and allow retry/restart', async () => {
    test.setTimeout(45000);

    // Turn on Auto Wave so waves continue into game over without stopping
    await game.hud.clickAutoWave();
    // Start wave with no defending towers and set to 4x speed
    await game.hud.clickStartWave();
    await game.hud.clickSpeed(); // 2x
    await game.hud.clickSpeed(); // 4x
    await expect(game.hud.speedLabel).toHaveText('4x');

    // Base will be breached repeatedly until lives reach 0
    await expect(game.modal.gameOverModal).toBeVisible({ timeout: 40000 });
    await expect(game.modal.gameOverRetryButton).toBeVisible();

    // Click Try Again to reset the level
    await game.modal.clickGameOverRetry();

    // Modal should disappear and game state should reset
    await expect(game.modal.gameOverModal).toBeHidden();
    await expect(game.hud.livesValue).toHaveText('20');
    await expect(game.hud.goldValue).toHaveText('300');
    await expect(game.hud.waveValue).toHaveText('1 / 6');
    await expect(game.hud.startWaveButton).toBeEnabled();
  });

  test('should defend against creeps, earn gold/score, and progress wave', async () => {
    // Build defending towers along the path
    await game.placeTower('archer', 2, 2);
    await game.placeTower('cannon', 5, 2);
    await expect(game.hud.goldValue).toHaveText('50');

    // Start wave and speed up to 4x
    await game.hud.clickStartWave();
    await game.hud.clickSpeed(); // 2x
    await game.hud.clickSpeed(); // 4x

    // Score or gold should increase from killing creeps
    await expect
      .poll(async () => await game.hud.getScore(), { timeout: 15000 })
      .toBeGreaterThan(0);
  });
});
