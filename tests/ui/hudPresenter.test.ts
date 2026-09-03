import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HudPresenter, FloatingPopup } from '../../src/ui/HudPresenter';
import { EventBus } from '../../src/core/events/EngineEvents';

describe('HudPresenter (US-06 / TASK-06-03)', () => {
  let eventBus: EventBus;
  let presenter: HudPresenter;

  beforeEach(() => {
    eventBus = new EventBus();
    presenter = new HudPresenter(eventBus, {
      initialGold: 300,
      initialScore: 0,
      initialLives: 20,
      initialWave: 1,
      totalWaves: 10,
    });
  });

  it('should initialize with default or configured state', () => {
    const state = presenter.getState();
    expect(state).toEqual({
      gold: 300,
      score: 0,
      lives: 20,
      wave: 1,
      totalWaves: 10,
      kills: 0,
      autoWave: false,
    });
    expect(presenter.getGold()).toBe(300);
    expect(presenter.getScore()).toBe(0);
    expect(presenter.getLives()).toBe(20);
    expect(presenter.getWave()).toBe(1);
    expect(presenter.getKills()).toBe(0);
  });

  it('should immediately invoke onStateChange listener with initial state', () => {
    const listener = vi.fn();
    presenter.onStateChange(listener);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(presenter.getState());
  });

  it('should update gold synchronously on GOLD_CHANGED event', () => {
    const listener = vi.fn();
    presenter.onStateChange(listener);

    eventBus.emit('GOLD_CHANGED', {
      currentGold: 450,
      delta: 150,
      source: 'creep_kill',
    });

    expect(presenter.getGold()).toBe(450);
    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({ gold: 450 })
    );
  });

  it('should update score synchronously on SCORE_CHANGED event', () => {
    const listener = vi.fn();
    presenter.onStateChange(listener);

    eventBus.emit('SCORE_CHANGED', {
      currentScore: 120,
      delta: 120,
      source: 'creep_kill',
    });

    expect(presenter.getScore()).toBe(120);
    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({ score: 120 })
    );
  });

  it('should track creep kills and emit floating gold popup on CREEP_KILLED event', () => {
    const popups: FloatingPopup[] = [];
    presenter.onPopup((p) => popups.push(p));

    eventBus.emit('CREEP_KILLED', {
      entity: 42 as any,
      creepType: 'basic',
      bountyGold: 15,
      scoreValue: 30,
      position: { x: 100, y: 150 },
    });

    expect(presenter.getKills()).toBe(1);
    expect(popups.length).toBe(1);
    expect(popups[0].type).toBe('gold');
    expect(popups[0].text).toBe('+15g');
    expect(popups[0].position).toEqual({ x: 100, y: 150 });
  });

  it('should decrement lives on BASE_BREACH event', () => {
    eventBus.emit('BASE_BREACH', {
      entity: 99 as any,
      creepType: 'tank',
      damageToBase: 3,
      remainingHp: 20,
    });

    expect(presenter.getLives()).toBe(17);
  });

  it('should update wave on WAVE_STARTED event', () => {
    eventBus.emit('WAVE_STARTED', {
      waveIndex: 1,
      waveNumber: 2,
      totalWaves: 15,
    });

    expect(presenter.getWave()).toBe(2);
    expect(presenter.getState().totalWaves).toBe(15);
  });

  it('should derive 1-based wave number from waveIndex when waveNumber is absent', () => {
    eventBus.emit('WAVE_STARTED', { waveIndex: 0 });
    expect(presenter.getWave()).toBe(1);
  });

  it('should allow manual setter adjustments', () => {
    presenter.setGold(600);
    presenter.setScore(800);
    presenter.setLives(15);
    presenter.setWave(3, 20);
    presenter.setAutoWave(true);

    expect(presenter.getState()).toEqual({
      gold: 600,
      score: 800,
      lives: 15,
      wave: 3,
      totalWaves: 20,
      kills: 0,
      autoWave: true,
    });
  });

  it('should cleanup event listeners on destroy()', () => {
    presenter.destroy();

    eventBus.emit('GOLD_CHANGED', { currentGold: 999, delta: 699 });
    eventBus.emit('SCORE_CHANGED', { currentScore: 888, delta: 888 });

    expect(presenter.getGold()).toBe(300);
    expect(presenter.getScore()).toBe(0);
  });
});
