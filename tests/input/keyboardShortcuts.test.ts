import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { KeyboardShortcuts } from '../../src/input/KeyboardShortcuts';
import { PlacementController } from '../../src/input/PlacementController';
import { SelectionController } from '../../src/input/SelectionController';
import { TimeControls } from '../../src/core/loop/TimeControls';
import { WaveManager } from '../../src/game/state/WaveManager';
import { GameStateMachine, GameState } from '../../src/game/state/GameStateMachine';
import { WaveSequence } from '../../src/game/waves/WaveSequence';

describe('KeyboardShortcuts (TASK-10-03)', () => {
  let placementController: PlacementController;
  let selectionController: SelectionController;
  let timeControls: TimeControls;
  let stateMachine: GameStateMachine;
  let waveManager: WaveManager;
  let shortcuts: KeyboardShortcuts;

  beforeEach(() => {
    placementController = new PlacementController({ enableKeyboardShortcuts: false });
    selectionController = new SelectionController({ enableKeyboardShortcuts: false });
    timeControls = new TimeControls();
    stateMachine = new GameStateMachine();
    waveManager = new WaveManager({
      sequence: WaveSequence.fromDefaultWaves(),
      stateMachine,
      autoStartDelaySeconds: 10,
    });

    shortcuts = new KeyboardShortcuts({
      placementController,
      selectionController,
      timeControls,
      waveManager,
      stateMachine,
      target: window,
    });
  });

  afterEach(() => {
    shortcuts.destroy();
    placementController.destroy();
    selectionController.destroy();
  });

  it('should select tower archetype when pressing 1, 2, or 3', () => {
    // 1 -> Archer
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '1' }));
    expect(placementController.getSelectedTower()).toBe('archer');

    // 2 -> Cannon
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '2' }));
    expect(placementController.getSelectedTower()).toBe('cannon');

    // 3 -> Mage
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '3' }));
    expect(placementController.getSelectedTower()).toBe('mage');

    // 3 again -> cancel (toggle behavior)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '3' }));
    expect(placementController.getSelectedTower()).toBeNull();
  });

  it('should cancel active placement when pressing Escape', () => {
    placementController.selectTower('archer');
    expect(placementController.isPlacing()).toBe(true);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(placementController.isPlacing()).toBe(false);
    expect(placementController.getSelectedTower()).toBeNull();
  });

  it('should deselect inspected tower when pressing Escape if not placing', () => {
    const deselectSpy = vi.spyOn(selectionController, 'deselect');
    vi.spyOn(selectionController, 'hasSelection').mockReturnValue(true);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(deselectSpy).toHaveBeenCalled();
  });

  it('should start wave on Space key when in preparation state', () => {
    const startWaveSpy = vi.spyOn(waveManager, 'startWaveNow');
    expect(stateMachine.getState()).toBe(GameState.PREPARATION);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
    expect(startWaveSpy).toHaveBeenCalled();
  });

  it('should toggle simulation pause on Space key when not in preparation state', () => {
    stateMachine.transitionTo(GameState.SPAWNING);

    // Press Space -> Pause
    window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
    expect(timeControls.isPaused).toBe(true);
    expect(stateMachine.isPaused()).toBe(true);

    // Press Space -> Resume
    window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
    expect(timeControls.isPaused).toBe(false);
    expect(stateMachine.isPaused()).toBe(false);
  });

  it('should start wave on Enter or S key', () => {
    const startWaveSpy = vi.spyOn(waveManager, 'startWaveNow');

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(startWaveSpy).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 's' }));
    expect(startWaveSpy).toHaveBeenCalledTimes(2);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'S' }));
    expect(startWaveSpy).toHaveBeenCalledTimes(3);
  });

  it('should cycle simulation speed when pressing [ or ] or Tab', () => {
    expect(timeControls.speed).toBe(1);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: ']' }));
    expect(timeControls.speed).toBe(2);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '[' }));
    expect(timeControls.speed).toBe(4);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
    expect(timeControls.speed).toBe(1);
  });

  it('should support registering custom shortcuts', () => {
    const customHandler = vi.fn();
    const unregister = shortcuts.registerShortcut('k', customHandler);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k' }));
    expect(customHandler).toHaveBeenCalledTimes(1);

    unregister();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k' }));
    expect(customHandler).toHaveBeenCalledTimes(1);
  });

  it('should respect enable() and disable() toggling', () => {
    shortcuts.disable();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '1' }));
    expect(placementController.getSelectedTower()).toBeNull();

    shortcuts.enable();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '1' }));
    expect(placementController.getSelectedTower()).toBe('archer');
  });
});
