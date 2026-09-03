import { test, expect } from '@playwright/test';
import { GamePage } from './pages';

test.describe('HUD and Game Controls', () => {
  let game: GamePage;

  test.beforeEach(async ({ page }) => {
    game = new GamePage(page);
    await game.goto();
  });

  test('should display initial HUD metrics correctly', async () => {
    await expect(game.hud.hudBar).toBeVisible();
    expect(await game.hud.getLives()).toBe(20);
    expect(await game.hud.getGold()).toBe(300);
    expect(await game.hud.getWaveText()).toBe('1 / 6');
    expect(await game.hud.getScore()).toBe(0);
    expect(await game.hud.getSpeed()).toBe('1x');
    expect(await game.hud.getPauseLabel()).toBe('Pause');
    expect(await game.hud.getAutoWaveText()).toBe('Auto: OFF');
    await expect(game.hud.startWaveButton).toBeVisible();
    await expect(game.hud.startWaveButton).toBeEnabled();
    // Verify wave 1 waits indefinitely without countdown
    await expect(game.hud.startWaveText).toHaveText('Start Wave');
  });

  test('should toggle auto wave setting on auto wave button click', async () => {
    expect(await game.hud.getAutoWaveText()).toBe('Auto: OFF');

    await game.hud.clickAutoWave();
    expect(await game.hud.getAutoWaveText()).toBe('Auto: ON');

    await game.hud.clickAutoWave();
    expect(await game.hud.getAutoWaveText()).toBe('Auto: OFF');
  });

  test('should cycle simulation speeds on speed button click', async () => {
    expect(await game.hud.getSpeed()).toBe('1x');

    await game.hud.clickSpeed();
    await expect(game.hud.speedLabel).toHaveText('2x');

    await game.hud.clickSpeed();
    await expect(game.hud.speedLabel).toHaveText('4x');

    await game.hud.clickSpeed();
    await expect(game.hud.speedLabel).toHaveText('1x');
  });

  test('should toggle pause and resume states on pause button click', async () => {
    expect(await game.hud.getPauseLabel()).toBe('Pause');
    expect(await game.hud.isPaused()).toBe(false);

    await game.hud.clickPause();
    await expect(game.hud.pauseLabel).toHaveText('Resume');
    expect(await game.hud.isPaused()).toBe(true);

    await game.hud.clickPause();
    await expect(game.hud.pauseLabel).toHaveText('Pause');
    expect(await game.hud.isPaused()).toBe(false);
  });

  test('should select tower cards via number keys 1, 2, 3 and cancel with Escape', async () => {
    // Select Archer with hotkey '1'
    await game.pressHotkey('1');
    expect(await game.buildBar.isTowerSelected('archer')).toBe(true);
    expect(await game.buildBar.isTowerSelected('cannon')).toBe(false);
    expect(await game.buildBar.isTowerSelected('mage')).toBe(false);

    // Press '1' again to toggle off
    await game.pressHotkey('1');
    expect(await game.buildBar.isTowerSelected('archer')).toBe(false);

    // Select Cannon with hotkey '2'
    await game.pressHotkey('2');
    expect(await game.buildBar.isTowerSelected('cannon')).toBe(true);

    // Select Mage with hotkey '3'
    await game.pressHotkey('3');
    expect(await game.buildBar.isTowerSelected('mage')).toBe(true);
    expect(await game.buildBar.isTowerSelected('cannon')).toBe(false);

    // Cancel selection with Escape
    await game.pressEscape();
    expect(await game.buildBar.isTowerSelected('mage')).toBe(false);
  });

  test('should cycle speed with bracket shortcut keys', async () => {
    expect(await game.hud.getSpeed()).toBe('1x');

    await game.pressHotkey('[');
    await expect(game.hud.speedLabel).toHaveText('2x');

    await game.pressHotkey(']');
    await expect(game.hud.speedLabel).toHaveText('4x');

    await game.pressHotkey('[');
    await expect(game.hud.speedLabel).toHaveText('1x');
  });

  test('should toggle pause with spacebar after wave has started', async () => {
    // Start the wave using button
    await game.hud.clickStartWave();
    await expect(game.hud.startWaveText).toHaveText('Wave in Progress');

    // Press Space to pause
    await game.pressSpace();
    await expect(game.hud.pauseLabel).toHaveText('Resume');

    // Press Space again to resume
    await game.pressSpace();
    await expect(game.hud.pauseLabel).toHaveText('Pause');
  });
});
