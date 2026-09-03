import { TowerType } from '../game/towers/TowerComponents';
import { TowerCardComponent, TowerCardConfig } from './TowerCardComponent';
import { EconomyManager } from '../game/economy/EconomyManager';
import { PlacementController } from '../input/PlacementController';
import { SelectionController } from '../input/SelectionController';
import { EventBus, engineEvents } from '../core/events/EngineEvents';
import { getAllTowerDefinitions, TOWER_ICONS } from '../game/towers/TowerCatalog';

export interface BuildToolbarConfig {
  container?: HTMLElement | string;
  economy?: EconomyManager;
  placementController?: PlacementController;
  selectionController?: SelectionController;
  eventBus?: EventBus;
  towers?: TowerCardConfig[];
}

export const DEFAULT_TOWER_CONFIGS: TowerCardConfig[] = [
  {
    towerType: 'archer',
    name: 'Energy Lance',
    cost: 100,
    icon: TOWER_ICONS.archer,
    hotkey: '1',
    description: 'Guild Energy Lance - High-velocity hard-light needles.',
  },
  {
    towerType: 'cannon',
    name: 'Plasma Mortar',
    cost: 150,
    icon: TOWER_ICONS.cannon,
    hotkey: '2',
    description: 'Alchemical Mortar - Concussive plasma artillery.',
  },
  {
    towerType: 'mage',
    name: 'Void Pylon',
    cost: 200,
    icon: TOWER_ICONS.mage,
    hotkey: '3',
    description: 'Arcane Void Pylon - Long-range thaumaturgic beams.',
  },
];

/**
 * Bottom build toolbar dock holding tower selection cards.
 * Reactively updates tower card affordability based on gold balance and synchronizes with PlacementController.
 */
export class BuildToolbar {
  private element: HTMLElement;
  private isMounted = false;
  private cards: Map<TowerType, TowerCardComponent> = new Map();
  private economy?: EconomyManager;
  private placementController?: PlacementController;
  private selectionController?: SelectionController;
  private eventBus: EventBus;
  private unsubs: Array<() => void> = [];

  constructor(config: BuildToolbarConfig = {}) {
    this.economy = config.economy;
    this.placementController = config.placementController;
    this.selectionController = config.selectionController;
    this.eventBus = config.eventBus ?? engineEvents;

    this.element = this.createElement();
    this.initializeCards(config.towers);
    this.mount(config.container);
    this.bindEvents();

    if (this.economy) {
      this.updateAffordability(this.economy.getGold());
    }
  }

  private createElement(): HTMLElement {
    const dock = document.createElement('nav');
    dock.className = 'build-toolbar';
    dock.setAttribute('aria-label', 'Tower Build Toolbar');
    dock.innerHTML = `
      <div class="build-toolbar-cards" data-ref="cardsContainer"></div>
    `;
    return dock;
  }

  private initializeCards(customConfigs?: TowerCardConfig[]): void {
    const configs = customConfigs ?? this.getDefaultConfigs();
    const container = this.element.querySelector('[data-ref="cardsContainer"]') ?? this.element;

    for (const cfg of configs) {
      const card = new TowerCardComponent({
        ...cfg,
        onClick: (type) => this.handleCardClick(type),
      });

      this.cards.set(cfg.towerType, card);
      container.appendChild(card.getElement());
    }
  }

  private getDefaultConfigs(): TowerCardConfig[] {
    try {
      const defs = getAllTowerDefinitions();
      const hotkeys: Record<TowerType, string> = {
        archer: '1',
        cannon: '2',
        mage: '3',
      };
      const fallbackShopNames: Record<TowerType, string> = {
        archer: 'Energy Lance',
        cannon: 'Plasma Mortar',
        mage: 'Void Pylon',
      };

      return defs.map((d) => ({
        towerType: d.type,
        name: d.shopName ?? fallbackShopNames[d.type] ?? d.name.replace(' Tower', ''),
        cost: d.baseCost,
        icon: d.icon || TOWER_ICONS[d.type] || '',
        hotkey: hotkeys[d.type] ?? '',
        description: d.description,
      }));
    } catch {
      return DEFAULT_TOWER_CONFIGS;
    }
  }

  private mount(container?: HTMLElement | string): void {
    if (typeof document === 'undefined') return;

    let target: HTMLElement | null = null;
    if (typeof container === 'string') {
      target = document.getElementById(container) ?? document.querySelector(container);
    } else if (container instanceof HTMLElement) {
      target = container;
    }

    if (!target) {
      target =
        document.getElementById('ui-layer') ??
        document.getElementById('game-container') ??
        document.getElementById('app') ??
        document.body;
    }

    if (target && !this.isMounted) {
      target.appendChild(this.element);
      this.isMounted = true;
    }
  }

  private bindEvents(): void {
    // Economy gold changes
    if (this.economy) {
      const unsubEcon = this.economy.onGoldChanged((gold) => {
        this.updateAffordability(gold);
      });
      this.unsubs.push(unsubEcon);
    }

    // Engine GOLD_CHANGED event
    const unsubGoldEvent = this.eventBus.on('GOLD_CHANGED', (data) => {
      this.updateAffordability(data.currentGold);
    });
    this.unsubs.push(unsubGoldEvent);

    // PlacementController selection changes
    if (this.placementController) {
      const unsubPlacement = this.placementController.onTowerSelected((towerType) => {
        this.setSelectedTower(towerType);
      });
      this.unsubs.push(unsubPlacement);
    }
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  public getCards(): TowerCardComponent[] {
    return Array.from(this.cards.values());
  }

  public getCard(type: TowerType): TowerCardComponent | undefined {
    return this.cards.get(type);
  }

  public updateAffordability(currentGold: number): void {
    for (const [_type, card] of this.cards) {
      const canAfford = currentGold >= card.getCost();
      card.setDisabled(!canAfford);
    }
  }

  public setSelectedTower(selectedType: TowerType | null): void {
    for (const [type, card] of this.cards) {
      card.setSelected(selectedType === type);
    }
  }

  private handleCardClick(towerType: TowerType): void {
    if (!this.placementController) return;

    // Deselect any active tower selection when starting placement
    if (this.selectionController) {
      this.selectionController.deselect();
    }

    // Toggle: If currently placing this tower, cancel placement; otherwise select it
    if (this.placementController.getSelectedTower() === towerType) {
      this.placementController.cancelPlacement();
    } else {
      this.placementController.selectTower(towerType);
    }
  }

  public destroy(): void {
    for (const unsub of this.unsubs) {
      unsub();
    }
    this.unsubs = [];

    for (const card of this.cards.values()) {
      card.destroy();
    }
    this.cards.clear();

    if (this.isMounted && this.element.parentElement) {
      this.element.parentElement.removeChild(this.element);
      this.isMounted = false;
    }
  }
}
