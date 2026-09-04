import './style.css';
import { World } from './core/ecs';
import { GameLoop } from './core/loop/GameLoop';
import { engineEvents } from './core/events/EngineEvents';
import { TileGrid } from './game/map';
import { EconomyManager } from './game/economy';
import { ScoreManager } from './game/scoring';
import { GameStateMachine } from './game/state/GameStateMachine';
import { WaveManager } from './game/state/WaveManager';
import { WaveSequence } from './game/waves/WaveSequence';
import { ProgressionManager } from './game/state/ProgressionManager';
import { SettingsManager } from './storage/SettingsManager';
import { StorageService } from './storage/StorageService';
import {
  PlacementSystem,
  MovementSystem,
  TargetingSystem,
  TowerCombatSystem,
  ProjectileSystem,
  BaseBreachSystem,
  CreepDeathSystem,
  GameStateSystem,
  TowerUpgradeSystem,
  TowerSellSystem,
  TowerControlSystem,
  WaveSpawnerSystem,
} from './game/systems';
import {
  POSITION_COMPONENT,
  SPRITE_COMPONENT,
  TOWER_COMPONENT,
  TowerComponent,
  PositionComponent,
  SpriteComponent,
} from './game/towers';
import {
  Viewport,
  MapRenderer,
  CreepRenderer,
  ProjectileRenderer,
  GridCursorRenderer,
  PlacementRenderer,
} from './rendering';
import {
  InputManager,
  PlacementController,
  SelectionController,
  KeyboardShortcuts,
  TouchManager,
} from './input';
import {
  HudPresenter,
  HudView,
  BuildToolbar,
  TowerDetailPanel,
  VictoryModal,
  GameOverModal,
  LevelSelectModal,
} from './ui';
import {
  LEVEL_1,
  LevelManager,
} from './game/levels';
import { AudioManager } from './audio';

console.log('Tower Defence Engine initializing...');

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement | null;
const uiLayer = document.getElementById('ui-layer') ?? document.getElementById('game-container') ?? document.body;

if (canvas) {
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const initialLevel = LEVEL_1;

    // Storage and Progression
    const storageService = new StorageService();
    const settingsManager = new SettingsManager(storageService);
    const progressionManager = new ProgressionManager(storageService);

    // 8-Bit Chiptune Audio Manager (Dying Earth OST + Procedural SFX)
    const audioManager = new AudioManager({
      eventBus: engineEvents,
      settingsManager,
      initialLevelId: initialLevel.id,
    });

    // Core ECS, Grid, and Economy
    const world = new World();
    const grid = TileGrid.fromLevelConfig(initialLevel.mapConfig);
    const initialGold = initialLevel.initialGold;
    const initialLives = initialLevel.initialLives;
    const economy = new EconomyManager(initialGold);
    const scoreManager = new ScoreManager(0, { eventBus: engineEvents });

    // State Machine & Wave Management
    const savedAutoWave = settingsManager.get('autoWave') ?? false;
    const stateMachine = new GameStateMachine({ eventBus: engineEvents });
    const waveSequence = new WaveSequence(initialLevel.waves);
    const waveSpawnerSystem = new WaveSpawnerSystem(
      [...waveSequence.getWaves()],
      initialLevel.worldWaypoints,
      engineEvents
    );
    const waveManager = new WaveManager({
      sequence: waveSequence,
      spawnerSystem: waveSpawnerSystem,
      stateMachine,
      economyManager: economy,
      scoreManager,
      eventBus: engineEvents,
      autoStartDelaySeconds: 10,
      autoStartEnabled: savedAutoWave,
      requireManualFirstWave: true,
    });

    // Controllers
    const placementController = new PlacementController({ canvas });
    const selectionController = new SelectionController({
      world,
      grid,
      canvas,
    });

    // Game Systems
    const placementSystem = new PlacementSystem({
      grid,
      economy,
      controller: placementController,
    });
    const movementSystem = new MovementSystem();
    const targetingSystem = new TargetingSystem();
    const towerCombatSystem = new TowerCombatSystem();
    const projectileSystem = new ProjectileSystem();
    const baseBreachSystem = new BaseBreachSystem(engineEvents);
    const creepDeathSystem = new CreepDeathSystem({
      economyManager: economy,
      scoreManager,
      eventBus: engineEvents,
    });
    const upgradeSystem = new TowerUpgradeSystem({
      world,
      economy,
    });
    const sellSystem = new TowerSellSystem({
      world,
      grid,
      economy,
      selectionController,
    });
    const controlSystem = new TowerControlSystem();
    const gameStateSystem = new GameStateSystem({
      stateMachine,
      waveManager,
      scoreManager,
      economyManager: economy,
      eventBus: engineEvents,
      initialLives,
    });

    // Add Systems to ECS World
    world.addSystem(waveSpawnerSystem);
    world.addSystem(movementSystem);
    world.addSystem(targetingSystem);
    world.addSystem(towerCombatSystem);
    world.addSystem(projectileSystem);
    world.addSystem(baseBreachSystem);
    world.addSystem(creepDeathSystem);
    world.addSystem(placementSystem);
    world.addSystem(upgradeSystem);
    world.addSystem(sellSystem);
    world.addSystem(controlSystem);
    world.addSystem(gameStateSystem);

    // Renderers and Viewport
    const viewport = new Viewport({
      virtualWidth: grid.worldWidth,
      virtualHeight: grid.worldHeight,
      canvas,
    });
    const mapRenderer = new MapRenderer(grid, initialLevel.theme);
    const creepRenderer = new CreepRenderer(world);
    const projectileRenderer = new ProjectileRenderer(world);
    const cursorRenderer = new GridCursorRenderer(grid);
    const placementRenderer = new PlacementRenderer({ grid, economy });

    // Game Loop
    let simulatedDtThisFrame = 0;
    const gameLoop = new GameLoop({
      tickRate: 60,
      // 4x speed needs 8 ticks/frame at 30 fps; the default cap of 5 would silently slow it down
      maxTicksPerFrame: 12,
      onTick: (dt) => {
        waveManager.update(world, dt);
        world.update(dt);
        simulatedDtThisFrame += dt;
      },
      onRender: () => {
        render(simulatedDtThisFrame);
        simulatedDtThisFrame = 0;
      },
    });

    // UI Presenter & Views
    const hudPresenter = new HudPresenter(engineEvents, {
      initialGold,
      initialScore: 0,
      initialLives,
      initialWave: 1,
      totalWaves: waveSequence.getTotalWaves(),
      autoWave: savedAutoWave,
    });
    hudPresenter.setLevelInfo(initialLevel.number, initialLevel.name, 'adventure');

    // Level Manager & Progression Coordinator
    const levelManager = new LevelManager({
      world,
      tileGrid: grid,
      mapRenderer,
      waveSpawnerSystem,
      waveManager,
      gameStateSystem,
      economyManager: economy,
      scoreManager,
      progressionManager,
      stateMachine,
      timeControls: gameLoop.controls,
      eventBus: engineEvents,
      hudPresenter,
      initialLevel,
      initialMode: 'adventure',
    });

    const levelSelectModal = new LevelSelectModal({
      container: uiLayer,
      progressionManager,
      onSelectLevel: (lvl, mode) => {
        audioManager.playSfx('ui_click');
        levelManager.loadLevel(lvl, mode);
      },
      onStartAdventure: () => {
        audioManager.playSfx('ui_click');
        levelManager.startAdventure();
      },
    });

    const hudView = new HudView({
      container: uiLayer,
      presenter: hudPresenter,
      timeControls: gameLoop.controls,
      waveManager,
      stateMachine,
      eventBus: engineEvents,
      onSpeedChange: (speed) => {
        audioManager.playSfx('ui_click');
        settingsManager.setGameSpeed(speed);
      },
      onAutoWaveToggle: (enabled) => {
        audioManager.playSfx('ui_click');
        settingsManager.setAutoWave(enabled);
      },
      onOpenLevels: () => {
        audioManager.playSfx('ui_click');
        levelSelectModal.show();
      },
      onToggleAudio: () => {
        const isMuted = audioManager.toggleMute();
        hudView.setMuted(isMuted);
      },
      onStartWave: () => {
        audioManager.playSfx('ui_click');
      },
      onTogglePause: () => {
        audioManager.playSfx('ui_click');
      },
    });
    hudView.setAutoWave(savedAutoWave);
    hudView.setMuted(audioManager.isMuted());

    new BuildToolbar({
      container: uiLayer,
      economy,
      placementController,
      selectionController,
      eventBus: engineEvents,
    });

    const towerDetailPanel = new TowerDetailPanel({
      container: uiLayer,
      world,
      economy,
      selectionController,
      upgradeSystem,
      sellSystem,
      controlSystem,
      eventBus: engineEvents,
    });

    const victoryModal = new VictoryModal({
      container: uiLayer,
      onRestart: () => levelManager.restartCurrentLevel(),
      onNextLevel: () => levelManager.advanceToNextLevel(),
      onMenu: () => levelSelectModal.show(),
    });

    const gameOverModal = new GameOverModal({
      container: uiLayer,
      onRetry: () => levelManager.restartCurrentLevel(),
      onMenu: () => levelSelectModal.show(),
    });

    // Input Managers & Shortcuts
    const inputManager = new InputManager({
      canvas,
      viewport,
      tileSize: grid.tileSize,
    });

    new KeyboardShortcuts({
      placementController,
      selectionController,
      timeControls: gameLoop.controls,
      waveManager,
      stateMachine,
      onSpeedToggle: (speed) => {
        hudView.setSpeed(speed);
        settingsManager.setGameSpeed(speed);
      },
      onAutoWaveToggle: (enabled) => {
        hudView.setAutoWave(enabled);
        settingsManager.setAutoWave(enabled);
      },
    });

    new TouchManager({
      canvas,
      viewport,
      tileSize: grid.tileSize,
      placementController,
      selectionController,
    });

    // Event Bindings
    placementSystem.onTowerPlaced((_entity, _towerType) => {
      audioManager.playSfx('tower_place');
    });

    towerCombatSystem.onTowerFired((towerEntity) => {
      const tower = world.getComponent<TowerComponent>(towerEntity, TOWER_COMPONENT);
      const type = tower?.towerType ?? 'archer';
      if (type === 'cannon') {
        audioManager.playSfx('tower_fire_cannon');
      } else if (type === 'mage') {
        audioManager.playSfx('tower_fire_mage');
      } else {
        audioManager.playSfx('tower_fire_archer');
      }
    });

    inputManager.onHover((gridPos) => {
      cursorRenderer.setHoveredTile(gridPos);
      placementController.setHoveredTile(gridPos);
      placementRenderer.setHoveredTile(gridPos);
    });

    placementController.onTowerSelected((towerType) => {
      if (towerType) {
        audioManager.playSfx('ui_select');
        selectionController.deselect();
      }
      placementRenderer.setActiveTower(towerType);
      cursorRenderer.setVisible(!towerType);
    });

    inputManager.onClick((gridPos) => {
      if (placementController.isPlacing()) {
        placementController.requestPlacement(gridPos);
      } else {
        selectionController.handleTileClick(gridPos, world);
      }
    });

    projectileSystem.onProjectileHit((_proj, impactPos, _damage, splashRadius, towerType) => {
      audioManager.playSfx('projectile_hit');
      const color =
        towerType === 'cannon' ? '#f97316' : towerType === 'mage' ? '#a855f7' : '#38bdf8';
      projectileRenderer.addImpactEffect(impactPos, splashRadius > 0 ? splashRadius : 20, color);
    });

    // Entity IDs are recycled, so a selection left over from the previous level could point at a new entity
    engineEvents.on('LEVEL_LOADED', () => {
      selectionController.deselect();
      placementController.cancelPlacement();
    });

    engineEvents.on('GAME_OVER', (data) => {
      levelManager.handleGameOver();
      gameOverModal.show({
        score: data.finalScore,
        waveReached: data.waveReached,
        totalWaves: data.totalWaves,
        kills: data.kills,
      });
    });

    engineEvents.on('VICTORY', (data) => {
      const victoryStats = levelManager.handleVictory(data.stars);
      victoryModal.show({
        score: data.finalScore,
        wavesCleared: data.totalWaves,
        totalWaves: data.totalWaves,
        stars: data.stars,
        livesRemaining: data.livesRemaining,
        initialLives: levelManager.getCurrentLevel().initialLives,
        hasNextLevel: victoryStats.nextLevel !== undefined,
        isAdventureComplete: victoryStats.isAdventureComplete,
      });
    });

    // Keep the drawing buffer in sync with the canvas's CSS size so the transform maps 1:1
    const syncCanvasSize = () => {
      viewport.syncToCanvasSize(window.devicePixelRatio || 1);
    };
    syncCanvasSize();
    window.addEventListener('resize', syncCanvasSize);

    // Tower Canvas Rendering Helper (Gene Wolfe / Dying Earth Techno-Sorcery Relics)
    const renderTowers = (renderCtx: CanvasRenderingContext2D) => {
      const towerEntities = world.query([POSITION_COMPONENT, TOWER_COMPONENT, SPRITE_COMPONENT]);
      for (const entity of towerEntities) {
        const pos = world.getComponent<PositionComponent>(entity, POSITION_COMPONENT);
        const sprite = world.getComponent<SpriteComponent>(entity, SPRITE_COMPONENT);
        const tower = world.getComponent<TowerComponent>(entity, TOWER_COMPONENT);

        if (pos && sprite && sprite.visible) {
          const tier = tower?.tier ?? 1;
          const towerType = tower?.towerType ?? 'archer';

          renderCtx.save();
          renderCtx.translate(pos.x, pos.y);

          // 1. Heavy Relic Pedestal / Dais
          const pad = 2;
          const baseSize = sprite.width - pad * 2;
          const halfBase = baseSize / 2;

          renderCtx.fillStyle = '#090d16';
          renderCtx.fillRect(-halfBase, -halfBase, baseSize, baseSize);

          // Metallic / Verdigris Border
          renderCtx.strokeStyle = towerType === 'mage' ? '#581c87' : towerType === 'cannon' ? '#78350f' : '#0e7490';
          renderCtx.lineWidth = 1.5;
          renderCtx.strokeRect(-halfBase, -halfBase, baseSize, baseSize);

          // Corner Rivets / Anchors
          renderCtx.fillStyle = '#d97706';
          const rOff = halfBase - 3;
          renderCtx.fillRect(-rOff, -rOff, 2, 2);
          renderCtx.fillRect(rOff - 2, -rOff, 2, 2);
          renderCtx.fillRect(-rOff, rOff - 2, 2, 2);
          renderCtx.fillRect(rOff - 2, rOff - 2, 2, 2);

          // 2. Archetype-Specific Superstructure
          if (towerType === 'archer') {
            // Guild Energy Lance Spire
            renderCtx.fillStyle = '#1e293b';
            renderCtx.fillRect(-halfBase * 0.5, -halfBase * 0.6, baseSize * 0.5, baseSize * 0.6);

            // Hard-light cyan energy conduits
            renderCtx.strokeStyle = '#38bdf8';
            renderCtx.lineWidth = 1.5;
            renderCtx.beginPath();
            renderCtx.moveTo(-halfBase * 0.35, halfBase * 0.4);
            renderCtx.lineTo(-halfBase * 0.35, -halfBase * 0.7);
            renderCtx.moveTo(halfBase * 0.35, halfBase * 0.4);
            renderCtx.lineTo(halfBase * 0.35, -halfBase * 0.7);
            renderCtx.stroke();

            // Focusing Crystal Aperture
            renderCtx.fillStyle = '#67e8f9';
            renderCtx.beginPath();
            renderCtx.arc(0, -halfBase * 0.1, 3.5, 0, Math.PI * 2);
            renderCtx.fill();

            renderCtx.fillStyle = '#ffffff';
            renderCtx.beginPath();
            renderCtx.arc(0, -halfBase * 0.1, 1.5, 0, Math.PI * 2);
            renderCtx.fill();
          } else if (towerType === 'cannon') {
            // Alchemical Plasma Mortar
            renderCtx.fillStyle = '#27272a';
            renderCtx.beginPath();
            renderCtx.arc(0, 0, halfBase * 0.75, 0, Math.PI * 2);
            renderCtx.fill();

            // Brass reinforced collar
            renderCtx.strokeStyle = '#d97706';
            renderCtx.lineWidth = 2;
            renderCtx.stroke();

            // Molten Plasma Core / Muzzle
            renderCtx.fillStyle = '#f97316';
            renderCtx.beginPath();
            renderCtx.arc(0, 0, halfBase * 0.4, 0, Math.PI * 2);
            renderCtx.fill();

            renderCtx.fillStyle = '#fff7ed';
            renderCtx.beginPath();
            renderCtx.arc(0, 0, 2, 0, Math.PI * 2);
            renderCtx.fill();
          } else {
            // Mage: Arcane Void Pylon
            renderCtx.fillStyle = '#180d2b';
            renderCtx.beginPath();
            renderCtx.moveTo(0, -halfBase * 0.85);
            renderCtx.lineTo(halfBase * 0.65, 0);
            renderCtx.lineTo(0, halfBase * 0.85);
            renderCtx.lineTo(-halfBase * 0.65, 0);
            renderCtx.closePath();
            renderCtx.fill();

            // Thaumaturgic Rune Lines
            renderCtx.strokeStyle = '#c084fc';
            renderCtx.lineWidth = 1;
            renderCtx.stroke();

            // Floating Eldritch Core
            renderCtx.fillStyle = '#a855f7';
            renderCtx.beginPath();
            renderCtx.arc(0, 0, 4, 0, Math.PI * 2);
            renderCtx.fill();

            renderCtx.fillStyle = '#ffffff';
            renderCtx.beginPath();
            renderCtx.arc(0, 0, 1.8, 0, Math.PI * 2);
            renderCtx.fill();
          }

          // 3. Tier Progression Badges / Glowing Glyphs
          const pipSize = 2.5;
          const pipY = halfBase - 3;
          const upgradePath = tower?.upgradePath ?? 'path1';
          renderCtx.fillStyle = upgradePath === 'path2' ? '#c084fc' : '#fbbf24'; // Violet for Path 2, Sol gold for Path 1

          if (tier === 1) {
            renderCtx.fillRect(-pipSize / 2, pipY - pipSize, pipSize, pipSize);
          } else if (tier === 2) {
            renderCtx.fillRect(-pipSize - 1.5, pipY - pipSize, pipSize, pipSize);
            renderCtx.fillRect(1.5, pipY - pipSize, pipSize, pipSize);
          } else if (tier >= 3) {
            renderCtx.fillRect(-pipSize * 1.5 - 2, pipY - pipSize, pipSize, pipSize);
            renderCtx.fillRect(-pipSize / 2, pipY - pipSize, pipSize, pipSize);
            renderCtx.fillRect(pipSize * 0.5 + 2, pipY - pipSize, pipSize, pipSize);

            // Radiant Apex Halo for Tier 3 Max Relic
            renderCtx.strokeStyle =
              upgradePath === 'path2'
                ? 'rgba(192, 132, 252, 0.85)'
                : 'rgba(251, 191, 36, 0.75)';
            renderCtx.lineWidth = 1;
            renderCtx.beginPath();
            renderCtx.arc(0, 0, halfBase * 0.9, 0, Math.PI * 2);
            renderCtx.stroke();
          }

          renderCtx.restore();
        }
      }
    };

    const render = (dt: number) => {
      viewport.clear(ctx);
      ctx.save();
      viewport.applyTransform(ctx);

      mapRenderer.render(ctx);

      // Render attack range of currently selected tower and upgrade preview range when hovered
      const selectedEntity = selectionController.getSelectedEntity();
      if (
        selectedEntity !== null &&
        world.isAlive(selectedEntity) &&
        !placementController.isPlacing()
      ) {
        const tower = world.getComponent<TowerComponent>(selectedEntity, TOWER_COMPONENT);
        const pos = world.getComponent<PositionComponent>(selectedEntity, POSITION_COMPONENT);
        if (tower && pos) {
          const previewRange = towerDetailPanel.getPreviewUpgradeRange();
          const hoveredPath = towerDetailPanel.getHoveredPath();
          placementRenderer.renderSelectedTowerRange(
            ctx,
            pos.x,
            pos.y,
            tower.range,
            previewRange,
            hoveredPath
          );
        }
      }

      renderTowers(ctx);
      creepRenderer.render(ctx);
      projectileRenderer.render(ctx, dt);
      cursorRenderer.render(ctx);
      placementRenderer.render(ctx);

      ctx.restore();
    };

    // Apply saved speed setting
    const savedSpeed = settingsManager.get('gameSpeed');
    gameLoop.controls.setSpeed(savedSpeed);
    hudView.setSpeed(savedSpeed);

    // Start simulation loop
    gameLoop.start();
    console.log('Tower Defence Game Loop started successfully.');
  }
}


