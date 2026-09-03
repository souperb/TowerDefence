import { TowerType } from '../game/towers/TowerComponents';

export interface TowerCardConfig {
  towerType: TowerType;
  name: string;
  cost: number;
  icon: string;
  hotkey?: string;
  description?: string;
  onClick?: (towerType: TowerType) => void;
}

/**
 * Component representing a single selectable tower archetype card in the build toolbar.
 * Displays icon, name, gold cost, hotkey badge, and reactive affordability disabled state.
 */
export class TowerCardComponent {
  private element: HTMLElement;
  private config: TowerCardConfig;
  private isDisabled: boolean = false;
  private isSelected: boolean = false;
  private clickCallbacks: Set<(towerType: TowerType) => void> = new Set();

  constructor(config: TowerCardConfig) {
    this.config = { ...config };
    if (config.onClick) {
      this.clickCallbacks.add(config.onClick);
    }
    this.element = this.createElement();
  }

  private createElement(): HTMLElement {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `tower-card tower-card-${this.config.towerType}`;
    card.setAttribute('data-tower-type', this.config.towerType);
    card.setAttribute('aria-label', `Build ${this.config.name} (${this.config.cost} Gold)`);
    if (this.config.hotkey) {
      card.setAttribute('data-hotkey', this.config.hotkey);
    }

    card.innerHTML = `
      <div class="tower-card-badge" data-ref="hotkey">${this.config.hotkey ?? ''}</div>
      <div class="tower-card-icon" data-ref="icon">${this.config.icon}</div>
      <div class="tower-card-info">
        <span class="tower-card-name" data-ref="name">${this.config.name}</span>
        <span class="tower-card-cost" data-ref="cost">${this.config.cost}g</span>
      </div>
    `;

    card.addEventListener('click', (e) => {
      e.preventDefault();
      if (!this.isDisabled) {
        this.handleClick();
      }
    });

    return card;
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  public getTowerType(): TowerType {
    return this.config.towerType;
  }

  public getCost(): number {
    return this.config.cost;
  }

  public setCost(cost: number): void {
    this.config.cost = cost;
    const costEl = this.element.querySelector('[data-ref="cost"]');
    if (costEl) {
      costEl.textContent = `${cost}g`;
    }
    this.element.setAttribute('aria-label', `Build ${this.config.name} (${cost} Gold)`);
  }

  public setDisabled(disabled: boolean): void {
    this.isDisabled = disabled;
    (this.element as HTMLButtonElement).disabled = disabled;
    if (disabled) {
      this.element.classList.add('disabled');
      this.element.setAttribute('aria-disabled', 'true');
    } else {
      this.element.classList.remove('disabled');
      this.element.removeAttribute('aria-disabled');
    }
  }

  public getDisabled(): boolean {
    return this.isDisabled;
  }

  public setSelected(selected: boolean): void {
    this.isSelected = selected;
    if (selected) {
      this.element.classList.add('selected');
      this.element.setAttribute('aria-pressed', 'true');
    } else {
      this.element.classList.remove('selected');
      this.element.setAttribute('aria-pressed', 'false');
    }
  }

  public getSelected(): boolean {
    return this.isSelected;
  }

  public onClick(callback: (towerType: TowerType) => void): () => void {
    this.clickCallbacks.add(callback);
    return () => this.clickCallbacks.delete(callback);
  }

  private handleClick(): void {
    for (const callback of this.clickCallbacks) {
      callback(this.config.towerType);
    }
  }

  public destroy(): void {
    this.clickCallbacks.clear();
    this.element.remove();
  }
}
