import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { World } from '../../src/core/ecs/World';
import { EventBus } from '../../src/core/events/EngineEvents';
import { GameStateMachine, GameState } from '../../src/game/state/GameStateMachine';
import { WaveManager } from '../../src/game/state/WaveManager';
import { WaveSpawnerSystem } from '../../src/game/systems/WaveSpawnerSystem';
import { GameStateSystem } from '../../src/game/systems/GameStateSystem';
import { ScoreManager } from '../../src/game/scoring/ScoreManager';
import { EconomyManager } from '../../src/game/economy/EconomyManager';
import { WaveDefinition } from '../../src/game/waves/WaveDefinition';
import { CREEP_COMPONENT } from '../../src/game/creeps/CreepComponents';
import { VictoryModal } from '../../src/ui/VictoryModal';
import { GameOverModal } from '../../src/ui/GameOverModal';

describe('Game State & Win/Loss Evaluation (TASK-08-02, TASK-08-03)', () => {
  let world: World;
  let eventBus: EventBus;
  let stateMachine: GameStateMachine;
  let waveManager: WaveManager;
  let spawnerSystem: WaveSpawnerSystem;
  let scoreManager: ScoreManager;
  let economyManager: EconomyManager;
  let gameStateSystem: GameStateSystem;

  const testWaves: WaveDefinition[] = [
    {
      waveNumber: 1,
      spawnGroups: [
        {
          creepType: 'basic',
          count: 2,
          intervalSeconds: 0.5,
          startDelaySeconds: 0,
        },
      ],
    },
  ];

  beforeEach(() => {
    world = new World();
    eventBus = new EventBus();
    stateMachine = new GameStateMachine({ eventBus });
    scoreManager = new ScoreManager(0, { eventBus });
    economyManager = new EconomyManager(300, eventBus);
    spawnerSystem = new WaveSpawnerSystem(testWaves, [{ x: 0, y: 0 }, { x: 50, y: 50 }], eventBus);
    world.addSystem(spawnerSystem);

    waveManager = new WaveManager({
      sequence: testWaves,
      spawnerSystem,
      stateMachine,
      scoreManager,
      economyManager,
      eventBus,
      autoStartDelaySeconds: 3.0,
      autoStartEnabled: false,
    });

    gameStateSystem = new GameStateSystem({
      stateMachine,
      waveManager,
      scoreManager,
      economyManager,
      eventBus,
      initialLives: 20,
    });
    world.addSystem(gameStateSystem);
  });

  afterEach(() => {
    gameStateSystem.destroy(world);
  });

  describe('GameStateMachine', () => {
    it('should start in PREPARATION by default', () => {
      const sm = new GameStateMachine();
      expect(sm.getState()).toBe(GameState.PREPARATION);
      expect(sm.isTerminal()).toBe(false);
      expect(sm.isPaused()).toBe(false);
    });

    it('should allow valid transitions', () => {
      const sm = new GameStateMachine();
      expect(sm.transitionTo(GameState.SPAWNING)).toBe(true);
      expect(sm.getState()).toBe(GameState.SPAWNING);

      expect(sm.transitionTo(GameState.IN_PROGRESS)).toBe(true);
      expect(sm.getState()).toBe(GameState.IN_PROGRESS);

      expect(sm.transitionTo(GameState.WAVE_COMPLETED)).toBe(true);
      expect(sm.getState()).toBe(GameState.WAVE_COMPLETED);

      expect(sm.transitionTo(GameState.VICTORY)).toBe(true);
      expect(sm.getState()).toBe(GameState.VICTORY);
      expect(sm.isVictory()).toBe(true);
      expect(sm.isTerminal()).toBe(true);
    });

    it('should reject invalid transitions', () => {
      const sm = new GameStateMachine();
      expect(sm.transitionTo(GameState.VICTORY)).toBe(false);
      expect(sm.getState()).toBe(GameState.PREPARATION);
    });

    it('should pause and resume cleanly', () => {
      const sm = new GameStateMachine();
      sm.transitionTo(GameState.SPAWNING);

      expect(sm.pause()).toBe(true);
      expect(sm.isPaused()).toBe(true);
      expect(sm.getPrePauseState()).toBe(GameState.SPAWNING);

      expect(sm.resume()).toBe(true);
      expect(sm.getState()).toBe(GameState.SPAWNING);
      expect(sm.isPaused()).toBe(false);
    });

    it('should notify listeners and emit engine events on state changes', () => {
      let stateChangedPayload: any = null;
      let callbackInvoked = false;

      eventBus.on('GAME_STATE_CHANGED', (data) => {
        stateChangedPayload = data;
      });

      stateMachine.onStateChange((curr, prev) => {
        callbackInvoked = true;
        expect(curr).toBe(GameState.SPAWNING);
        expect(prev).toBe(GameState.PREPARATION);
      });

      stateMachine.transitionTo(GameState.SPAWNING);

      expect(callbackInvoked).toBe(true);
      expect(stateChangedPayload).toEqual({
        previousState: GameState.PREPARATION,
        currentState: GameState.SPAWNING,
        context: undefined,
      });
    });
  });

  describe('GameStateSystem & Defeat / Victory Conditions', () => {
    it('should deduct lives on BASE_BREACH event', () => {
      expect(gameStateSystem.getLives()).toBe(20);

      eventBus.emit('BASE_BREACH', {
        entity: 1 as any,
        creepType: 'basic',
        damageToBase: 5,
        remainingHp: 50,
      });

      expect(gameStateSystem.getLives()).toBe(15);
    });

    it('should trigger GAME_OVER immediately when lives reach 0', () => {
      let gameOverEvent: any = null;
      eventBus.on('GAME_OVER', (data) => {
        gameOverEvent = data;
      });

      scoreManager.setScore(450);

      // Deduct all lives
      gameStateSystem.setLives(0);
      world.update(0.016);

      expect(stateMachine.getState()).toBe(GameState.GAME_OVER);
      expect(gameStateSystem.isGameOver()).toBe(true);
      expect(gameStateSystem.isSimulationHalted()).toBe(true);

      expect(gameOverEvent).toEqual({
        finalScore: 450,
        waveReached: 1,
        totalWaves: 1,
        kills: 0,
      });
    });

    it('should trigger VICTORY when all waves are cleared and lives remain > 0', () => {
      let victoryEvent: any = null;
      eventBus.on('VICTORY', (data) => {
        victoryEvent = data;
      });

      scoreManager.setScore(1200);

      // 1. Start Wave 1
      waveManager.startWaveNow();
      world.update(1.0); // spawns creeps
      waveManager.update(world, 0.1);

      // 2. Defeat all creeps
      for (const c of world.query([CREEP_COMPONENT])) {
        world.destroyEntity(c);
      }
      waveManager.update(world, 0.1);

      expect(waveManager.isAllWavesCleared()).toBe(true);

      // 3. Update GameStateSystem
      gameStateSystem.update(world, 0.016);

      expect(stateMachine.getState()).toBe(GameState.VICTORY);
      expect(gameStateSystem.isVictory()).toBe(true);
      expect(gameStateSystem.isSimulationHalted()).toBe(true);

      expect(victoryEvent).toEqual({
        finalScore: 1200,
        livesRemaining: 20,
        totalWaves: 1,
        stars: 3,
      });
    });

    it('should compute star ratings based on remaining lives', () => {
      gameStateSystem.setLives(20); // 100%
      expect(gameStateSystem.calculateStars()).toBe(3);

      gameStateSystem.setLives(16); // 80%
      expect(gameStateSystem.calculateStars()).toBe(3);

      gameStateSystem.setLives(10); // 50%
      expect(gameStateSystem.calculateStars()).toBe(2);

      gameStateSystem.setLives(4); // 20%
      expect(gameStateSystem.calculateStars()).toBe(1);

      gameStateSystem.setLives(0); // 0%
      expect(gameStateSystem.calculateStars()).toBe(0);
    });
  });

  describe('VictoryModal & GameOverModal (UI Overlays)', () => {
    let container: HTMLElement;

    beforeEach(() => {
      container = document.createElement('div');
      document.body.appendChild(container);
    });

    afterEach(() => {
      container.remove();
    });

    it('should display VictoryModal and trigger callbacks', () => {
      let restartClicked = false;
      let nextClicked = false;

      const modal = new VictoryModal({
        container,
        onRestart: () => { restartClicked = true; },
        onNextLevel: () => { nextClicked = true; },
      });

      expect(modal.isVisible()).toBe(false);

      modal.show({
        score: 2500,
        wavesCleared: 5,
        totalWaves: 5,
        stars: 3,
        livesRemaining: 18,
        initialLives: 20,
        hasNextLevel: true,
      });

      expect(modal.isVisible()).toBe(true);
      const el = modal.getElement();
      expect(el.querySelector('#victory-score')?.textContent).toBe('2,500');
      expect(el.querySelector('#victory-waves')?.textContent).toBe('5 / 5');
      expect(el.querySelector('#victory-stars')?.textContent).toBe('★★★');
      expect(el.querySelector('#victory-lives')?.textContent).toBe('18 / 20');

      // Click Restart
      const restartBtn = el.querySelector('#btn-victory-restart') as HTMLButtonElement;
      restartBtn.click();
      expect(restartClicked).toBe(true);
      expect(modal.isVisible()).toBe(false);

      // Re-show and Click Next Level
      modal.show({ score: 2500, wavesCleared: 5, totalWaves: 5 });
      const nextBtn = el.querySelector('#btn-victory-next') as HTMLButtonElement;
      nextBtn.click();
      expect(nextClicked).toBe(true);

      modal.destroy();
    });

    it('should display GameOverModal and trigger retry callback', () => {
      let retryClicked = false;

      const modal = new GameOverModal({
        container,
        onRetry: () => { retryClicked = true; },
      });

      expect(modal.isVisible()).toBe(false);

      modal.show({
        score: 850,
        waveReached: 3,
        totalWaves: 5,
        kills: 14,
      });

      expect(modal.isVisible()).toBe(true);
      const el = modal.getElement();
      expect(el.querySelector('#gameover-score')?.textContent).toBe('850');
      expect(el.querySelector('#gameover-wave')?.textContent).toBe('Wave 3 of 5');
      expect(el.querySelector('#gameover-kills')?.textContent).toBe('14');

      // Click Retry
      const retryBtn = el.querySelector('#btn-gameover-retry') as HTMLButtonElement;
      retryBtn.click();
      expect(retryClicked).toBe(true);
      expect(modal.isVisible()).toBe(false);

      modal.destroy();
    });
  });
});
