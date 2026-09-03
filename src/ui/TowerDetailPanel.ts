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
} from '../game/towers/TowerComponents';
import { getTowerDefinition } from '../game/towers/TowerCatalog';
import {
  MAX_TOWER_TIER,
  getUpgradeCost,
  getNextTierStats,
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

export interface TowerDetailViewModel {
  entity: Entity;
  towerType: string;
  name: string;
  icon: string;
  tier: number;
  maxTier: number;
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
}

/**
 * UI Panel displaying selected tower statistics, tier progression,
 * upgrade cost & action button, sell refund & action button, and targeting strategy cycle button.
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
        <button class="btn btn-primary btn-upgrade" data-ref="btnUpgrade">
          Upgrade (75g)
        </button>
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
    btnUpgrade?.addEventListener('click', () => this.handleUpgradeClick());

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
    this.isVisible = true;
    this.element.style.display = 'flex';
    this.update();
  }

  /**
   * Hides the detail panel.
   */
  public hide(): void {
    this.currentEntity = null;
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
    const isMaxTier = tower.tier >= MAX_TOWER_TIER;
    const upgradeCost = getUpgradeCost(tower.towerType, tower.tier);
    const nextStats = getNextTierStats(tower.towerType, tower.tier);
    const canAffordUpgrade =
      !isMaxTier && upgradeCost !== null && this.economy.canAfford(upgradeCost);

    const damage = tower.damage ?? def.damage;
    const splashRadius = tower.splashRadius ?? def.splashRadius;

    // Calculate 70% refund of cumulative invested gold
    const sellRefund = this.sellSystem
      ? this.sellSystem.calculateRefund(this.world, this.currentEntity)
      : Math.floor(tower.totalInvestedCost * 0.7);

    const strategyMap: Record<TargetStrategy, string> = {
      first: 'First',
      lowestHp: 'Lowest HP',
      closest: 'Closest',
    };

    return {
      entity: this.currentEntity,
      towerType: tower.towerType,
      name: def.name,
      icon: def.icon,
      tier: tower.tier,
      maxTier: MAX_TOWER_TIER,
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
      tierEl.textContent = `Tier ${vm.tier} / ${vm.maxTier}`;
    }

    // Stats
    const damageEl = el.querySelector('[data-ref="damage"]');
    if (damageEl) {
      damageEl.textContent =
        vm.nextDamage !== undefined ? `${vm.damage} → ${vm.nextDamage}` : `${vm.damage}`;
    }

    const rangeEl = el.querySelector('[data-ref="range"]');
    if (rangeEl) {
      rangeEl.textContent =
        vm.nextRange !== undefined ? `${vm.range} → ${vm.nextRange}` : `${vm.range}`;
    }

    const fireRateEl = el.querySelector('[data-ref="fireRate"]');
    if (fireRateEl) {
      const currentRate = Number(vm.fireRate.toFixed(1));
      const nextRate = vm.nextFireRate ? Number(vm.nextFireRate.toFixed(1)) : null;
      fireRateEl.textContent =
        nextRate !== null ? `${currentRate}/s → ${nextRate}/s` : `${currentRate}/s`;
    }

    // Splash row
    const splashRowEl = el.querySelector('[data-ref="splashRow"]') as HTMLElement | null;
    const splashRadiusEl = el.querySelector('[data-ref="splashRadius"]');
    if (splashRowEl && splashRadiusEl) {
      if (vm.splashRadius > 0 || (vm.nextSplashRadius ?? 0) > 0) {
        splashRowEl.style.display = 'flex';
        splashRadiusEl.textContent =
          vm.nextSplashRadius !== undefined
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

    // Upgrade Button
    const btnUpgrade = el.querySelector('[data-ref="btnUpgrade"]') as HTMLButtonElement | null;
    if (btnUpgrade) {
      if (vm.isMaxTier) {
        btnUpgrade.textContent = 'Max Tier';
        btnUpgrade.disabled = true;
      } else {
        btnUpgrade.textContent = `Upgrade (${vm.upgradeCost}g)`;
        btnUpgrade.disabled = !vm.canAffordUpgrade;
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
   * Action: Handles clicking the Upgrade button.
   */
  public handleUpgradeClick(): boolean {
    if (this.currentEntity === null) return false;

    if (this.upgradeSystem) {
      const success = this.upgradeSystem.upgradeTower(this.world, this.currentEntity);
      if (success) {
        this.update();
      }
      return success;
    }
    return false;
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
  }

  /**
   * Cleans up event listeners and unmounts DOM elements.
   */
  public destroy(): void {
    for (const unsub of this.unsubs) {
      unsub();
    }
    this.unsubs = [];

    if (this.isMounted && this.element.parentElement) {
      this.element.parentElement.removeChild(this.element);
      this.isMounted = false;
    }
  }
}
