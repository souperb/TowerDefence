import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BuildToolbar } from '../../src/ui/BuildToolbar';
import { TowerCardComponent } from '../../src/ui/TowerCardComponent';
import { EconomyManager } from '../../src/game/economy/EconomyManager';
import { PlacementController } from '../../src/input/PlacementController';
import { SelectionController } from '../../src/input/SelectionController';
import { EventBus } from '../../src/core/events/EngineEvents';

describe('TowerCardComponent (TASK-10-02)', () => {
  let card: TowerCardComponent;

  beforeEach(() => {
    card = new TowerCardComponent({
      towerType: 'archer',
      name: 'Archer',
      cost: 100,
      icon: '🏹',
      hotkey: '1',
    });
  });

  afterEach(() => {
    card.destroy();
  });

  it('should render card icon, name, cost, and hotkey badge', () => {
    const el = card.getElement();
    expect(el).not.toBeNull();
    expect(el.getAttribute('data-tower-type')).toBe('archer');
    expect(el.getAttribute('data-hotkey')).toBe('1');
    expect(el.querySelector('[data-ref="name"]')?.textContent).toBe('Archer');
    expect(el.querySelector('[data-ref="cost"]')?.textContent).toBe('100g');
    expect(el.querySelector('[data-ref="icon"]')?.textContent).toBe('🏹');
    expect(el.querySelector('[data-ref="hotkey"]')?.textContent).toBe('1');
  });

  it('should toggle disabled state and accessibility attributes', () => {
    const el = card.getElement() as HTMLButtonElement;
    expect(card.getDisabled()).toBe(false);
    expect(el.disabled).toBe(false);

    card.setDisabled(true);
    expect(card.getDisabled()).toBe(true);
    expect(el.disabled).toBe(true);
    expect(el.classList.contains('disabled')).toBe(true);
    expect(el.getAttribute('aria-disabled')).toBe('true');

    card.setDisabled(false);
    expect(card.getDisabled()).toBe(false);
    expect(el.disabled).toBe(false);
    expect(el.classList.contains('disabled')).toBe(false);
  });

  it('should toggle selected state and aria-pressed attribute', () => {
    const el = card.getElement();
    expect(card.getSelected()).toBe(false);

    card.setSelected(true);
    expect(card.getSelected()).toBe(true);
    expect(el.classList.contains('selected')).toBe(true);
    expect(el.getAttribute('aria-pressed')).toBe('true');

    card.setSelected(false);
    expect(card.getSelected()).toBe(false);
    expect(el.classList.contains('selected')).toBe(false);
    expect(el.getAttribute('aria-pressed')).toBe('false');
  });

  it('should invoke click callback when clicked while enabled', () => {
    const onClick = vi.fn();
    card.onClick(onClick);

    card.getElement().click();
    expect(onClick).toHaveBeenCalledWith('archer');
  });

  it('should not invoke click callback when disabled', () => {
    const onClick = vi.fn();
    card.onClick(onClick);
    card.setDisabled(true);

    card.getElement().click();
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('BuildToolbar (TASK-10-02)', () => {
  let eventBus: EventBus;
  let economy: EconomyManager;
  let placementController: PlacementController;
  let selectionController: SelectionController;
  let toolbar: BuildToolbar;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    eventBus = new EventBus();
    economy = new EconomyManager(300, eventBus);
    placementController = new PlacementController({ enableKeyboardShortcuts: false });
    selectionController = new SelectionController({ enableKeyboardShortcuts: false });

    toolbar = new BuildToolbar({
      container,
      economy,
      placementController,
      selectionController,
      eventBus,
    });
  });

  afterEach(() => {
    toolbar.destroy();
    placementController.destroy();
    selectionController.destroy();
    container.remove();
  });

  it('should mount into the target container and render tower cards', () => {
    const el = toolbar.getElement();
    expect(container.contains(el)).toBe(true);

    const cards = toolbar.getCards();
    expect(cards.length).toBe(3);

    const archerCard = toolbar.getCard('archer');
    const cannonCard = toolbar.getCard('cannon');
    const mageCard = toolbar.getCard('mage');

    expect(archerCard).toBeDefined();
    expect(cannonCard).toBeDefined();
    expect(mageCard).toBeDefined();
  });

  it('should set card disabled states reactively based on player gold affordability', () => {
    const archerCard = toolbar.getCard('archer')!;
    const cannonCard = toolbar.getCard('cannon')!;
    const mageCard = toolbar.getCard('mage')!;

    // Initial gold: 300 (all affordable: 100, 150, 200)
    expect(archerCard.getDisabled()).toBe(false);
    expect(cannonCard.getDisabled()).toBe(false);
    expect(mageCard.getDisabled()).toBe(false);

    // Set gold to 120 (only Archer affordable)
    economy.setGold(120);
    expect(archerCard.getDisabled()).toBe(false);
    expect(cannonCard.getDisabled()).toBe(true);
    expect(mageCard.getDisabled()).toBe(true);

    // Set gold to 160 (Archer and Cannon affordable)
    economy.setGold(160);
    expect(archerCard.getDisabled()).toBe(false);
    expect(cannonCard.getDisabled()).toBe(false);
    expect(mageCard.getDisabled()).toBe(true);

    // Set gold to 50 (none affordable)
    economy.setGold(50);
    expect(archerCard.getDisabled()).toBe(true);
    expect(cannonCard.getDisabled()).toBe(true);
    expect(mageCard.getDisabled()).toBe(true);
  });

  it('should update affordability on GOLD_CHANGED engine events', () => {
    eventBus.emit('GOLD_CHANGED', { currentGold: 100, delta: -200 });

    const archerCard = toolbar.getCard('archer')!;
    const cannonCard = toolbar.getCard('cannon')!;
    const mageCard = toolbar.getCard('mage')!;

    expect(archerCard.getDisabled()).toBe(false);
    expect(cannonCard.getDisabled()).toBe(true);
    expect(mageCard.getDisabled()).toBe(true);
  });

  it('should toggle placement mode when clicking tower cards', () => {
    const archerCard = toolbar.getCard('archer')!;
    const cannonCard = toolbar.getCard('cannon')!;

    // Click Archer -> enters placement mode
    archerCard.getElement().click();
    expect(placementController.getSelectedTower()).toBe('archer');
    expect(archerCard.getSelected()).toBe(true);
    expect(cannonCard.getSelected()).toBe(false);

    // Click Cannon -> switches placement to Cannon
    cannonCard.getElement().click();
    expect(placementController.getSelectedTower()).toBe('cannon');
    expect(archerCard.getSelected()).toBe(false);
    expect(cannonCard.getSelected()).toBe(true);

    // Click Cannon again -> cancels placement (toggle behavior)
    cannonCard.getElement().click();
    expect(placementController.getSelectedTower()).toBeNull();
    expect(cannonCard.getSelected()).toBe(false);
  });

  it('should deselect inspected tower when clicking a tower card', () => {
    const deselectSpy = vi.spyOn(selectionController, 'deselect');
    const archerCard = toolbar.getCard('archer')!;

    archerCard.getElement().click();
    expect(deselectSpy).toHaveBeenCalled();
  });

  it('should highlight active card when PlacementController selection changes externally', () => {
    const archerCard = toolbar.getCard('archer')!;
    const mageCard = toolbar.getCard('mage')!;

    placementController.selectTower('mage');
    expect(mageCard.getSelected()).toBe(true);
    expect(archerCard.getSelected()).toBe(false);

    placementController.cancelPlacement();
    expect(mageCard.getSelected()).toBe(false);
    expect(archerCard.getSelected()).toBe(false);
  });
});
