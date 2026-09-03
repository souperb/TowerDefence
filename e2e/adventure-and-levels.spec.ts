import { test, expect } from '@playwright/test';
import { GamePage } from './pages';

test.describe('Adventure Mode and 5-Level Progression', () => {
  let game: GamePage;

  test.beforeEach(async ({ page }) => {
    game = new GamePage(page);
    await game.goto();
  });

  test('should open Level Select modal from HUD and show 5 levels with Adventure Mode option', async () => {
    // Initial state: Level 1 (Emerald Plains) is loaded
    expect(await game.hud.getLives()).toBe(20);
    expect(await game.hud.getGold()).toBe(300);
    expect(await game.hud.getWaveText()).toBe('1 / 6');

    // Click Levels button in HUD
    await game.hud.clickLevels();

    // Modal should be visible
    await expect(game.modal.levelSelectModal).toBeVisible();
    await expect(game.modal.startAdventureButton).toBeVisible();

    // 5 level cards should be present
    await expect(game.modal.levelCards).toHaveCount(5);

    // Level 1 should be playable (unlocked)
    const level1Btn = game.page.locator('[data-level-id="level-1"] .btn-play-level');
    await expect(level1Btn).toBeEnabled();

    // Level 2 should be locked initially
    const level2Btn = game.page.locator('[data-level-id="level-2"] .btn-play-level');
    await expect(level2Btn).toBeDisabled();

    // Close Level Select modal
    await game.modal.clickCloseLevelSelect();
    await expect(game.modal.levelSelectModal).toBeHidden();
  });

  test('should start Adventure Mode from Level Select modal', async () => {
    await game.hud.clickLevels();
    await expect(game.modal.levelSelectModal).toBeVisible();

    // Click Start Adventure
    await game.modal.clickStartAdventure();
    await expect(game.modal.levelSelectModal).toBeHidden();

    // Game should be in Level 1 with 300 gold and wave 1/6
    expect(await game.hud.getGold()).toBe(300);
    expect(await game.hud.getWaveText()).toBe('1 / 6');
  });

  test('should allow selecting and loading an individual level from the menu', async () => {
    await game.hud.clickLevels();
    await expect(game.modal.levelSelectModal).toBeVisible();

    // Click Play on Level 1
    await game.modal.clickPlayLevel('level-1');
    await expect(game.modal.levelSelectModal).toBeHidden();

    // State should be ready for play
    expect(await game.hud.getLives()).toBe(20);
    expect(await game.hud.getGold()).toBe(300);
    expect(await game.hud.getWaveText()).toBe('1 / 6');
    await expect(game.hud.startWaveButton).toBeEnabled();
  });

  test('should allow opening Level Select from Game Over modal', async () => {
    test.setTimeout(45000);

    // Turn on Auto Wave so waves continue into game over without stopping
    await game.hud.clickAutoWave();
    // Start wave with no defending towers and 4x speed
    await game.hud.clickStartWave();
    await game.hud.clickSpeed(); // 2x
    await game.hud.clickSpeed(); // 4x

    // Wait for game over
    await expect(game.modal.gameOverModal).toBeVisible({ timeout: 40000 });
    await expect(game.modal.gameOverMenuButton).toBeVisible();

    // Click Menu in GameOver modal
    await game.modal.gameOverMenuButton.click();

    // Game Over modal hides and Level Select modal opens
    await expect(game.modal.gameOverModal).toBeHidden();
    await expect(game.modal.levelSelectModal).toBeVisible();
  });
});
