import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HudView } from '../../src/ui/HudView';
import { HudPresenter } from '../../src/ui/HudPresenter';
import { TimeControls } from '../../src/core/loop/TimeControls';
import { WaveManager } from '../../src/game/state/WaveManager';
import { GameStateMachine, GameState } from '../../src/game/state/GameStateMachine';
import { EventBus } from '../../src/core/events/EngineEvents';
import { WaveSequence } from '../../src/game/waves/WaveSequence';

describe('HudView (US-10 / TASK-10-01)', () => {
  let eventBus: EventBus;
  let presenter: HudPresenter;
  let timeControls: TimeControls;
  let stateMachine: GameStateMachine;
  let waveManager: WaveManager;
  let hudView: HudView;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);

    eventBus = new EventBus();
    presenter = new HudPresenter(eventBus, {
      initialGold: 300,
      initialScore: 0,
      initialLives: 20,
      initialWave: 1,
      totalWaves: 10,
    });
    timeControls = new TimeControls();
    stateMachine = new GameStateMachine({ eventBus });
    waveManager = new WaveManager({
      sequence: WaveSequence.fromDefaultWaves(),
      stateMachine,
      eventBus,
      autoStartDelaySeconds: 10,
    });

    hudView = new HudView({
      container,
      presenter,
      timeControls,
      waveManager,
      stateMachine,
      eventBus,
    });
  });

  afterEach(() => {
    hudView.destroy();
    presenter.destroy();
    container.remove();
  });

  it('should create and mount the HUD element into the target container', () => {
    const el = hudView.getElement();
    expect(el).toBeDefined();
    expect(container.contains(el)).toBe(true);
    expect(el.querySelector('.hud-bar')).not.toBeNull();
  });

  it('should render initial metric values from HudPresenter', () => {
    const el = hudView.getElement();
    expect(el.querySelector('[data-ref="valGold"]')?.textContent).toBe('300');
    expect(el.querySelector('[data-ref="valLives"]')?.textContent).toBe('20');
    expect(el.querySelector('[data-ref="valScore"]')?.textContent).toBe('0');
    expect(el.querySelector('[data-ref="valWave"]')?.textContent).toBe('1 / 10');
  });

  it('should update HUD metrics reactively when HudPresenter state changes', () => {
    eventBus.emit('GOLD_CHANGED', { currentGold: 450, delta: 150 });
    eventBus.emit('SCORE_CHANGED', { currentScore: 250, delta: 250 });
    eventBus.emit('BASE_BREACH', {
      entity: 1 as any,
      creepType: 'basic',
      damageToBase: 2,
      remainingHp: 10,
    });
    eventBus.emit('WAVE_STARTED', { waveIndex: 1, waveNumber: 2, totalWaves: 10 });

    const el = hudView.getElement();
    expect(el.querySelector('[data-ref="valGold"]')?.textContent).toBe('450');
    expect(el.querySelector('[data-ref="valScore"]')?.textContent).toBe('250');
    expect(el.querySelector('[data-ref="valLives"]')?.textContent).toBe('18');
    expect(el.querySelector('[data-ref="valWave"]')?.textContent).toBe('2 / 10');
  });

  it('should update speed button display and cycle speed on click', () => {
    const onSpeedChange = vi.fn();
    const customHud = new HudView({
      container,
      timeControls,
      onSpeedChange,
    });

    const speedBtn = customHud.getElement().querySelector('[data-ref="btnSpeed"]') as HTMLButtonElement;
    expect(speedBtn).not.toBeNull();
    expect(customHud.getElement().querySelector('[data-ref="lblSpeed"]')?.textContent).toBe('1x');

    // 1x -> 2x
    speedBtn.click();
    expect(timeControls.speed).toBe(2);
    expect(customHud.getElement().querySelector('[data-ref="lblSpeed"]')?.textContent).toBe('2x');
    expect(onSpeedChange).toHaveBeenCalledWith(2);

    // 2x -> 4x
    speedBtn.click();
    expect(timeControls.speed).toBe(4);
    expect(customHud.getElement().querySelector('[data-ref="lblSpeed"]')?.textContent).toBe('4x');
    expect(onSpeedChange).toHaveBeenCalledWith(4);

    // 4x -> 1x
    speedBtn.click();
    expect(timeControls.speed).toBe(1);
    expect(customHud.getElement().querySelector('[data-ref="lblSpeed"]')?.textContent).toBe('1x');
    expect(onSpeedChange).toHaveBeenCalledWith(1);

    customHud.destroy();
  });

  it('should update pause button state and toggle simulation pause on click', () => {
    const onTogglePause = vi.fn();
    const customHud = new HudView({
      container,
      timeControls,
      stateMachine,
      onTogglePause,
    });

    const pauseBtn = customHud.getElement().querySelector('[data-ref="btnPause"]') as HTMLButtonElement;
    const pauseLabel = customHud.getElement().querySelector('[data-ref="lblPause"]');
    expect(pauseLabel?.textContent).toBe('Pause');
    expect(pauseBtn.classList.contains('btn-active')).toBe(false);

    // Toggle Pause
    pauseBtn.click();
    expect(timeControls.isPaused).toBe(true);
    expect(stateMachine.isPaused()).toBe(true);
    expect(pauseLabel?.textContent).toBe('Resume');
    expect(pauseBtn.classList.contains('btn-active')).toBe(true);
    expect(onTogglePause).toHaveBeenCalledTimes(1);

    // Toggle Resume
    pauseBtn.click();
    expect(timeControls.isPaused).toBe(false);
    expect(stateMachine.isPaused()).toBe(false);
    expect(pauseLabel?.textContent).toBe('Pause');
    expect(pauseBtn.classList.contains('btn-active')).toBe(false);

    customHud.destroy();
  });

  it('should trigger startWave on WaveManager when Start Wave button is clicked', () => {
    const startWaveSpy = vi.spyOn(waveManager, 'startWaveNow');
    const startBtn = hudView.getElement().querySelector('[data-ref="btnStartWave"]') as HTMLButtonElement;

    startBtn.click();
    expect(startWaveSpy).toHaveBeenCalled();
  });

  it('should render countdown text and update button states during preparation and spawning', () => {
    const startBtn = hudView.getElement().querySelector('[data-ref="btnStartWave"]') as HTMLButtonElement;
    const btnText = hudView.getElement().querySelector('[data-ref="txtStartWave"]');

    // Countdown tick
    eventBus.emit('WAVE_COUNTDOWN_TICK', {
      remainingSeconds: 6.4,
      totalDuration: 10,
      waveIndex: 0,
    });
    expect(btnText?.textContent).toBe('Start Wave (7s)');

    // Wave started -> In Progress
    stateMachine.transitionTo(GameState.SPAWNING);
    expect(startBtn.disabled).toBe(true);
    expect(btnText?.textContent).toBe('Wave in Progress');

    // Return to Preparation
    stateMachine.transitionTo(GameState.WAVE_COMPLETED);
    stateMachine.transitionTo(GameState.PREPARATION);
    expect(startBtn.disabled).toBe(false);
    expect(btnText?.textContent).toBe('Start Wave');
  });

  it('should toggle auto wave state and button display on auto wave button click', () => {
    const onAutoWaveToggle = vi.fn();
    const customHud = new HudView({
      container,
      waveManager,
      onAutoWaveToggle,
    });

    const autoBtn = customHud.getElement().querySelector('[data-ref="btnAutoWave"]') as HTMLButtonElement;
    const autoLbl = customHud.getElement().querySelector('[data-ref="lblAutoWave"]');
    expect(autoBtn).not.toBeNull();
    expect(autoLbl?.textContent).toBe('Auto: OFF');
    expect(autoBtn.classList.contains('btn-active')).toBe(false);

    // Click -> Auto: ON
    autoBtn.click();
    expect(autoLbl?.textContent).toBe('Auto: ON');
    expect(autoBtn.classList.contains('btn-active')).toBe(true);
    expect(waveManager.isAutoStartEnabled()).toBe(true);
    expect(onAutoWaveToggle).toHaveBeenCalledWith(true);

    // Click again -> Auto: OFF
    autoBtn.click();
    expect(autoLbl?.textContent).toBe('Auto: OFF');
    expect(autoBtn.classList.contains('btn-active')).toBe(false);
    expect(waveManager.isAutoStartEnabled()).toBe(false);
    expect(onAutoWaveToggle).toHaveBeenCalledWith(false);

    customHud.destroy();
  });

  it('should support direct setter methods', () => {
    hudView.setGold(999);
    hudView.setLives(5);
    hudView.setScore(12345);
    hudView.setWave(4, 15);
    hudView.setSpeed(2);
    hudView.setPaused(true);
    hudView.setAutoWave(true);
    hudView.setStartWaveDisabled(true);

    const el = hudView.getElement();
    expect(el.querySelector('[data-ref="valGold"]')?.textContent).toBe('999');
    expect(el.querySelector('[data-ref="valLives"]')?.textContent).toBe('5');
    expect(el.querySelector('[data-ref="valScore"]')?.textContent).toBe('12,345');
    expect(el.querySelector('[data-ref="valWave"]')?.textContent).toBe('4 / 15');
    expect(el.querySelector('[data-ref="lblSpeed"]')?.textContent).toBe('2x');
    expect(el.querySelector('[data-ref="lblPause"]')?.textContent).toBe('Resume');
    expect(el.querySelector('[data-ref="lblAutoWave"]')?.textContent).toBe('Auto: ON');
    expect((el.querySelector('[data-ref="btnStartWave"]') as HTMLButtonElement).disabled).toBe(true);
  });
});
