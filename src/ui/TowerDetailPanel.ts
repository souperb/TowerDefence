import { World, Entity } from '../core/ecs';
import { EventBus, engineEvents } from '../core/events/EngineEvents';
import { EconomyManager } from '../game/economy/EconomyManager';
import { SelectionController } from '../input/SelectionController';
import { TowerUpgradeSystem } from '../game/systems/TowerUpgradeSystem';
import { TowerSellSystem } from '../game/systems/TowerSellSystem';
import { TowerControlSystem, cycleTowerStrategy } from '../game/systems/TowerControlSystem';
import {
  TOWER_COMPONENT,
  TowerComponent,
  TargetStrategy,
  UpgradePath,
} from '../game/towers/TowerComponents';
import { getTowerDefinition } from '../game/towers/TowerCatalog';
import {
  MAX_TOWER_TIER,
  getUpgradeCost,
  getNextTierStats,
  getTowerUpgradePaths,
  getTowerUpgradePathInfo,
} from '../game/towers/TowerUpgradeDefinitions';

export interface TowerDetailPanelConfig {
  container?: HTMLElement | string;
  world: World;
  economy: EconomyManager;
  selectionController: SelectionController;
  upgradeSystem?: TowerUpgradeSystem;
  sellSystem?: TowerSellSystem;
  controlSystem?: TowerControlSystem;
  eventBus?: EventBus;
}

export interface TowerPathUpgradeViewModel {
  pathId: UpgradePath;
  name: string;
  nextTierName: string;
  description: string;
  cost: number | null;
  canAfford: boolean;
  isLocked: boolean;
  isMaxTier: boolean;
  nextDamage?: number;
  nextRange?: number;
  nextFireRate?: number;
  nextSplashRadius?: number;
}

export interface TowerDetailViewModel {
  entity: Entity;
  towerType: string;
  name: string;
  icon: string;
  tier: number;
  maxTier: number;
  upgradePath?: UpgradePath | null;
  pathName?: string;
  damage: number;
  nextDamage?: number;
  range: number;
  nextRange?: number;
  fireRate: number;
  nextFireRate?: number;
  splashRadius: number;
  nextSplashRadius?: number;
  targetStrategy: TargetStrategy;
  strategyLabel: string;
  totalInvestedCost: number;
  upgradeCost: number | null;
  canAffordUpgrade: boolean;
  isMaxTier: boolean;
  sellRefund: number;
  path1: TowerPathUpgradeViewModel;
  path2: TowerPathUpgradeViewModel;
}

/**
 * UI Panel displaying selected tower statistics, tier progression,
 * dual upgrade paths, sell refund, and targeting strategy cycle button.
 */
export class TowerDetailPanel {
  private element: HTMLElement;
  private isMounted = false;
  private isVisible = false;

  private world: World;
  private economy: EconomyManager;
  private selectionController: SelectionController;
  private upgradeSystem?: TowerUpgradeSystem;
  private sellSystem?: TowerSellSystem;
  private controlSystem?: TowerControlSystem;
  private eventBus: EventBus;

  private currentEntity: Entity | null = null;
  private hoveredPath: UpgradePath | null = null;
  private unsubs: Array<() => void> = [];

  constructor(config: TowerDetailPanelConfig) {
    this.world = config.world;
    this.economy = config.economy;
    this.selectionController = config.selectionController;
    this.upgradeSystem = config.upgradeSystem;
    this.sellSystem = config.sellSystem;
    this.controlSystem = config.controlSystem;
    this.eventBus = config.eventBus ?? engineEvents;

    this.element = this.createElement();
    this.mount(config.container);
    this.bindEvents();
    this.hide();
  }

  /**
   * Creates the base DOM element structure for the panel.
   */
  private createElement(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'tower-detail-panel';
    el.style.display = 'none';
    el.innerHTML = `
      <div class="tower-detail-header">
        <div class="tower-title-group">
          <span class="tower-icon" data-ref="icon">🏹</span>
          <div>
            <h3 class="tower-name" data-ref="name">Tower Name</h3>
            <span class="tower-tier-badge" data-ref="tier">Tier 1</span>
          </div>
        </div>
        <button class="btn-close" data-ref="btnClose" aria-label="Close" title="Deselect tower">×</button>
      </div>

      <div class="tower-detail-stats">
        <div class="stat-row">
          <span class="stat-label">Damage</span>
          <span class="stat-value" data-ref="damage">15</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Range</span>
          <span class="stat-value" data-ref="range">120</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Fire Rate</span>
          <span class="stat-value" data-ref="fireRate">1.2 /s</span>
        </div>
        <div class="stat-row stat-splash-row" data-ref="splashRow">
          <span class="stat-label">Splash Radius</span>
          <span class="stat-value" data-ref="splashRadius">48 px</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Strategy</span>
          <span class="stat-value" data-ref="strategy">First</span>
        </div>
      </div>

      <div class="tower-detail-actions">
        <div class="tower-upgrade-paths" data-ref="upgradePaths">
          <button class="btn btn-primary btn-upgrade btn-upgrade-path" data-ref="btnUpgrade" data-path="path1">
            Upgrade (75g)
          </button>
          <button class="btn btn-primary btn-upgrade-path btn-upgrade-path2" data-ref="btnUpgradePath2" data-path="path2">
            Path 2 (75g)
          </button>
        </div>
        <button class="btn btn-secondary btn-strategy" data-ref="btnStrategy" title="Cycle targeting priority">
          Target: First
        </button>
        <button class="btn btn-danger btn-sell" data-ref="btnSell">
          Sell (+70g)
        </button>
      </div>
    `;

    // Bind internal button listeners
    const btnClose = el.querySelector('[data-ref="btnClose"]');
    btnClose?.addEventListener('click', () => this.handleCloseClick());

    const btnUpgrade = el.querySelector('[data-ref="btnUpgrade"]') as HTMLButtonElement | null;
    btnUpgrade?.addEventListener('click', () => this.handleUpgradeClick('path1'));
    btnUpgrade?.addEventListener('mouseenter', () => {
      this.hoveredPath = 'path1';
      this.update();
    });
    btnUpgrade?.addEventListener('mouseleave', () => {
      this.hoveredPath = null;
      this.update();
    });
    btnUpgrade?.addEventListener('focus', () => {
      this.hoveredPath = 'path1';
      this.update();
    });
    btnUpgrade?.addEventListener('blur', () => {
      this.hoveredPath = null;
      this.update();
    });

    const btnUpgradePath2 = el.querySelector('[data-ref="btnUpgradePath2"]') as HTMLButtonElement | null;
    btnUpgradePath2?.addEventListener('click', () => this.handleUpgradePathClick('path2'));
    btnUpgradePath2?.addEventListener('mouseenter', () => {
      this.hoveredPath = 'path2';
      this.update();
    });
    btnUpgradePath2?.addEventListener('mouseleave', () => {
      this.hoveredPath = null;
      this.update();
    });
    btnUpgradePath2?.addEventListener('focus', () => {
      this.hoveredPath = 'path2';
      this.update();
    });
    btnUpgradePath2?.addEventListener('blur', () => {
      this.hoveredPath = null;
      this.update();
    });

    const btnStrategy = el.querySelector('[data-ref="btnStrategy"]') as HTMLButtonElement | null;
    btnStrategy?.addEventListener('click', () => this.handleCycleStrategyClick());

    const btnSell = el.querySelector('[data-ref="btnSell"]') as HTMLButtonElement | null;
    btnSell?.addEventListener('click', () => this.handleSellClick());

    return el;
  }

  /**
   * Mounts the panel into a DOM container if available.
   */
  private mount(container?: HTMLElement | string): void {
    if (typeof document === 'undefined') return;

    let target: HTMLElement | null = null;
    if (typeof container === 'string') {
      target = document.getElementById(container);
    } else if (container instanceof HTMLElement) {
      target = container;
    }

    if (!target) {
      target =
        document.getElementById('game-container') ??
        document.getElementById('app') ??
        document.body;
    }

    if (target && !this.isMounted) {
      target.appendChild(this.element);
      this.isMounted = true;
    }
  }

  /**
   * Subscribes to engine events, selection changes, and economy updates.
   */
  private bindEvents(): void {
    // Selection changes
    const unsubSelection = this.selectionController.onSelectionChanged((entity) => {
      if (entity !== null) {
        this.show(entity);
      } else {
        this.hide();
      }
    });

    // Gold balance changes (re-evaluate upgrade button disabled state)
    const unsubEconomy = this.economy.onGoldChanged(() => {
      if (this.isVisible && this.currentEntity !== null) {
        this.update();
      }
    });

    // Tower upgraded
    const unsubUpgrade = this.eventBus.on('TOWER_UPGRADED', (data) => {
      if (this.isVisible && this.currentEntity === data.entity) {
        this.update();
      }
    });

    // Tower sold
    const unsubSold = this.eventBus.on('TOWER_SOLD', (data) => {
      if (this.currentEntity === data.entity) {
        this.hide();
      }
    });

    this.unsubs.push(unsubSelection, unsubEconomy, unsubUpgrade, unsubSold);
  }

  /**
   * Shows the detail panel for the given tower entity.
   */
  public show(entity: Entity): void {
    if (!this.world.isAlive(entity)) {
      this.hide();
      return;
    }

    const tower = this.world.getComponent<TowerComponent>(entity, TOWER_COMPONENT);
    if (!tower) {
      this.hide();
      return;
    }

    this.currentEntity = entity;
    this.hoveredPath = null;
    this.isVisible = true;
    this.element.style.display = 'flex';
    this.update();
  }

  /**
   * Hides the detail panel.
   */
  public hide(): void {
    this.currentEntity = null;
    this.hoveredPath = null;
    this.isVisible = false;
    this.element.style.display = 'none';
  }

  /**
   * Returns whether the panel is currently displayed.
   */
  public getIsVisible(): boolean {
    return this.isVisible;
  }

  /**
   * Returns the currently inspected tower Entity ID, or null.
   */
  public getSelectedEntity(): Entity | null {
    return this.currentEntity;
  }

  /**
   * Returns the currently hovered upgrade path, if any.
   */
  public getHoveredPath(): UpgradePath | null {
    return this.hoveredPath;
  }

  /**
   * Sets the hovered upgrade path programmatically.
   */
  public setHoveredPath(path: UpgradePath | null): void {
    this.hoveredPath = path;
    this.update();
  }

  /**
   * Returns the previewed attack range of the hovered upgrade path,
   * or null if no upgrade is hovered or if the hovered path is locked/max-tier.
   */
  public getPreviewUpgradeRange(): number | null {
    if (this.currentEntity === null || !this.world.isAlive(this.currentEntity) || this.hoveredPath === null) {
      return null;
    }

    const tower = this.world.getComponent<TowerComponent>(this.currentEntity, TOWER_COMPONENT);
    if (!tower || tower.tier >= MAX_TOWER_TIER) {
      return null;
    }

    // If locked into other path at tier >= 2, disallow preview
    if (tower.tier >= 2 && tower.upgradePath && tower.upgradePath !== this.hoveredPath) {
      return null;
    }

    const nextStats = getNextTierStats(tower.towerType, tower.tier, this.hoveredPath);
    return nextStats ? nextStats.range : null;
  }

  /**
   * Returns the root HTML element of the panel.
   */
  public getElement(): HTMLElement {
    return this.element;
  }

  public getControlSystem(): TowerControlSystem | undefined {
    return this.controlSystem;
  }

  /**
   * Computes the view model data for the currently selected tower.
   */
  public getViewModel(): TowerDetailViewModel | null {
    if (this.currentEntity === null || !this.world.isAlive(this.currentEntity)) {
      return null;
    }

    const tower = this.world.getComponent<TowerComponent>(this.currentEntity, TOWER_COMPONENT);
    if (!tower) return null;

    const def = getTowerDefinition(tower.towerType);
    const paths = getTowerUpgradePaths(tower.towerType);
    const isMaxTier = tower.tier >= MAX_TOWER_TIER;

    // Active or previewed path
    const activePath: UpgradePath = this.hoveredPath ?? tower.upgradePath ?? 'path1';
    const upgradeCost = getUpgradeCost(tower.towerType, tower.tier, activePath);
    const nextStats = getNextTierStats(tower.towerType, tower.tier, activePath);
    const canAffordUpgrade =
      !isMaxTier && upgradeCost !== null && this.economy.canAfford(upgradeCost);

    const damage = tower.damage ?? def.damage;
    const splashRadius = tower.splashRadius ?? def.splashRadius;

    // Path 1 details
    const p1Cost = getUpgradeCost(tower.towerType, tower.tier, 'path1');
    const p1NextStats = getNextTierStats(tower.towerType, tower.tier, 'path1');
    const p1Locked = tower.tier >= 2 && tower.upgradePath === 'path2';
    const p1Max = isMaxTier || (tower.tier >= 2 && tower.upgradePath === 'path1' && tower.tier >= MAX_TOWER_TIER);
    const path1VM: TowerPathUpgradeViewModel = {
      pathId: 'path1',
      name: paths.path1.name,
      nextTierName: p1NextStats?.name ?? paths.path1.name,
      description: paths.path1.description,
      cost: p1Cost,
      canAfford: !p1Locked && !p1Max && p1Cost !== null && this.economy.canAfford(p1Cost),
      isLocked: p1Locked,
      isMaxTier: isMaxTier,
      nextDamage: p1NextStats?.damage,
      nextRange: p1NextStats?.range,
      nextFireRate: p1NextStats?.fireRate,
      nextSplashRadius: p1NextStats?.splashRadius,
    };

    // Path 2 details
    const p2Cost = getUpgradeCost(tower.towerType, tower.tier, 'path2');
    const p2NextStats = getNextTierStats(tower.towerType, tower.tier, 'path2');
    const p2Locked = tower.tier >= 2 && tower.upgradePath === 'path1';
    const p2Max = isMaxTier || (tower.tier >= 2 && tower.upgradePath === 'path2' && tower.tier >= MAX_TOWER_TIER);
    const path2VM: TowerPathUpgradeViewModel = {
      pathId: 'path2',
      name: paths.path2.name,
      nextTierName: p2NextStats?.name ?? paths.path2.name,
      description: paths.path2.description,
      cost: p2Cost,
      canAfford: !p2Locked && !p2Max && p2Cost !== null && this.economy.canAfford(p2Cost),
      isLocked: p2Locked,
      isMaxTier: isMaxTier,
      nextDamage: p2NextStats?.damage,
      nextRange: p2NextStats?.range,
      nextFireRate: p2NextStats?.fireRate,
      nextSplashRadius: p2NextStats?.splashRadius,
    };

    // Calculate 70% refund of cumulative invested gold
    const sellRefund = this.sellSystem
      ? this.sellSystem.calculateRefund(this.world, this.currentEntity)
      : Math.floor(tower.totalInvestedCost * 0.7);

    const strategyMap: Record<TargetStrategy, string> = {
      first: 'First',
      lowestHp: 'Lowest HP',
      closest: 'Closest',
    };

    const currentPathInfo = tower.upgradePath ? getTowerUpgradePathInfo(tower.towerType, tower.upgradePath) : null;

    return {
      entity: this.currentEntity,
      towerType: tower.towerType,
      name: def.name,
      icon: def.icon,
      tier: tower.tier,
      maxTier: MAX_TOWER_TIER,
      upgradePath: tower.upgradePath ?? null,
      pathName: currentPathInfo?.name,
      damage,
      nextDamage: nextStats?.damage,
      range: tower.range,
      nextRange: nextStats?.range,
      fireRate: tower.fireRate,
      nextFireRate: nextStats?.fireRate,
      splashRadius,
      nextSplashRadius: nextStats?.splashRadius,
      targetStrategy: tower.targetStrategy,
      strategyLabel: strategyMap[tower.targetStrategy] ?? 'First',
      totalInvestedCost: tower.totalInvestedCost,
      upgradeCost,
      canAffordUpgrade,
      isMaxTier,
      sellRefund,
      path1: path1VM,
      path2: path2VM,
    };
  }

  /**
   * Refreshes the DOM elements with current tower state.
   */
  public update(): void {
    const vm = this.getViewModel();
    if (!vm) {
      this.hide();
      return;
    }

    const el = this.element;

    // Header
    const iconEl = el.querySelector('[data-ref="icon"]');
    if (iconEl) {
      if (vm.icon.includes('<svg')) {
        iconEl.innerHTML = vm.icon;
      } else {
        iconEl.textContent = vm.icon;
      }
    }

    const nameEl = el.querySelector('[data-ref="name"]');
    if (nameEl) nameEl.textContent = vm.name;

    const tierEl = el.querySelector('[data-ref="tier"]');
    if (tierEl) {
      if (vm.pathName && vm.tier >= 2) {
        tierEl.textContent = `Tier ${vm.tier} / ${vm.maxTier} • ${vm.pathName}`;
      } else {
        tierEl.textContent = `Tier ${vm.tier} / ${vm.maxTier}`;
      }
    }

    // Stats
    const damageEl = el.querySelector('[data-ref="damage"]');
    if (damageEl) {
      damageEl.textContent =
        vm.nextDamage !== undefined && !vm.isMaxTier
          ? `${vm.damage} → ${vm.nextDamage}`
          : `${vm.damage}`;
    }

    const rangeEl = el.querySelector('[data-ref="range"]');
    if (rangeEl) {
      rangeEl.textContent =
        vm.nextRange !== undefined && !vm.isMaxTier
          ? `${vm.range} → ${vm.nextRange}`
          : `${vm.range}`;
    }

    const fireRateEl = el.querySelector('[data-ref="fireRate"]');
    if (fireRateEl) {
      const currentRate = Number(vm.fireRate.toFixed(1));
      const nextRate =
        vm.nextFireRate !== undefined && !vm.isMaxTier
          ? Number(vm.nextFireRate.toFixed(1))
          : null;
      fireRateEl.textContent =
        nextRate !== null ? `${currentRate}/s → ${nextRate}/s` : `${currentRate}/s`;
    }

    // Splash row
    const splashRowEl = el.querySelector('[data-ref="splashRow"]') as HTMLElement | null;
    const splashRadiusEl = el.querySelector('[data-ref="splashRadius"]');
    if (splashRowEl && splashRadiusEl) {
      if (vm.splashRadius > 0 || ((vm.nextSplashRadius ?? 0) > 0 && !vm.isMaxTier)) {
        splashRowEl.style.display = 'flex';
        splashRadiusEl.textContent =
          vm.nextSplashRadius !== undefined && !vm.isMaxTier
            ? `${vm.splashRadius}px → ${vm.nextSplashRadius}px`
            : `${vm.splashRadius}px`;
      } else {
        splashRowEl.style.display = 'none';
      }
    }

    // Strategy
    const strategyEl = el.querySelector('[data-ref="strategy"]');
    if (strategyEl) {
      strategyEl.textContent = vm.strategyLabel;
    }

    // Path 1 Upgrade Button
    const btnUpgrade = el.querySelector('[data-ref="btnUpgrade"]') as HTMLButtonElement | null;
    if (btnUpgrade) {
      if (vm.isMaxTier) {
        btnUpgrade.textContent = 'Max Tier';
        btnUpgrade.disabled = true;
      } else if (vm.path1.isLocked) {
        btnUpgrade.textContent = 'Path 1 (Locked)';
        btnUpgrade.disabled = true;
      } else {
        const p1Title = vm.tier === 1 ? `Path 1: ${vm.path1.name}` : vm.path1.nextTierName;
        btnUpgrade.textContent = `${p1Title} (${vm.path1.cost}g)`;
        btnUpgrade.disabled = !vm.path1.canAfford;
      }
    }

    // Path 2 Upgrade Button
    const btnUpgradePath2 = el.querySelector('[data-ref="btnUpgradePath2"]') as HTMLButtonElement | null;
    if (btnUpgradePath2) {
      if (vm.isMaxTier) {
        btnUpgradePath2.textContent = 'Max Tier';
        btnUpgradePath2.disabled = true;
      } else if (vm.path2.isLocked) {
        btnUpgradePath2.textContent = 'Path 2 (Locked)';
        btnUpgradePath2.disabled = true;
      } else {
        const p2Title = vm.tier === 1 ? `Path 2: ${vm.path2.name}` : vm.path2.nextTierName;
        btnUpgradePath2.textContent = `${p2Title} (${vm.path2.cost}g)`;
        btnUpgradePath2.disabled = !vm.path2.canAfford;
      }
    }

    // Strategy Button
    const btnStrategy = el.querySelector('[data-ref="btnStrategy"]') as HTMLButtonElement | null;
    if (btnStrategy) {
      btnStrategy.textContent = `Target: ${vm.strategyLabel}`;
    }

    // Sell Button
    const btnSell = el.querySelector('[data-ref="btnSell"]') as HTMLButtonElement | null;
    if (btnSell) {
      btnSell.textContent = `Sell (+${vm.sellRefund}g)`;
    }
  }

  /**
   * Action: Handles clicking the primary/Path 1 Upgrade button.
   */
  public handleUpgradeClick(path: UpgradePath = 'path1'): boolean {
    if (this.currentEntity === null) return false;

    if (this.upgradeSystem) {
      const success = this.upgradeSystem.upgradeTower(this.world, this.currentEntity, path);
      if (success) {
        this.update();
      }
      return success;
    }
    return false;
  }

  /**
   * Action: Handles clicking the Path 2 Upgrade button.
   */
  public handleUpgradePathClick(path: UpgradePath): boolean {
    return this.handleUpgradeClick(path);
  }

  /**
   * Action: Handles clicking the Sell button.
   */
  public handleSellClick(): boolean {
    if (this.currentEntity === null) return false;

    if (this.sellSystem) {
      const entityToSell = this.currentEntity;
      const success = this.sellSystem.sellTower(this.world, entityToSell);
      if (success) {
        this.hide();
      }
      return success;
    }
    return false;
  }

  /**
   * Action: Handles clicking the Strategy cycle button.
   */
  public handleCycleStrategyClick(): TargetStrategy | null {
    if (this.currentEntity === null) return null;

    const newStrategy = cycleTowerStrategy(this.world, this.currentEntity);
    if (newStrategy) {
      this.update();
    }
    return newStrategy;
  }

  /**
   * Action: Handles clicking the Close button (deselects).
   */
  public handleCloseClick(): void {
    this.selectionController.deselect();
    this.hide();
  }

  /**
   * Destroys the component and cleans up listeners.
   */
  public destroy(): void {
    this.unsubs.forEach((unsub) => {
      try {
        unsub();
      } catch (err) {
        console.error('[TowerDetailPanel] Error during unsub:', err);
      }
    });
    this.unsubs = [];
    if (this.element.parentElement) {
      this.element.parentElement.removeChild(this.element);
    }
    this.isMounted = false;
    this.isVisible = false;
    this.currentEntity = null;
  }
}
