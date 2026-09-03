import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LevelSelectModal } from '../../src/ui/LevelSelectModal';
import { ProgressionManager } from '../../src/game/state/ProgressionManager';
import { StorageService } from '../../src/storage/StorageService';
import { MemoryStorageProvider } from '../../src/storage/MemoryStorageProvider';

describe('LevelSelectModal (5 Levels & Adventure Mode UI)', () => {
  let container: HTMLElement;
  let progressionManager: ProgressionManager;
  let modal: LevelSelectModal;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    const storage = new StorageService(new MemoryStorageProvider());
    progressionManager = new ProgressionManager(storage);

    modal = new LevelSelectModal({
      container,
      progressionManager,
    });
  });

  it('renders modal with Adventure Mode banner and 5 level cards', () => {
    modal.show();
    const el = modal.getElement();

    expect(el.style.display).toBe('flex');
    expect(modal.isVisible()).toBe(true);

    const adventureCard = el.querySelector('#adventure-mode-card');
    expect(adventureCard).not.toBeNull();

    const levelCards = el.querySelectorAll('.level-card');
    expect(levelCards.length).toBe(5);

    // Verify first level is unlocked by default
    const level1Card = el.querySelector('[data-level-id="level-1"]');
    expect(level1Card?.classList.contains('unlocked')).toBe(true);
    expect(level1Card?.querySelector('.level-card-name')?.textContent).toBe('Emerald Plains');

    // Verify locked level
    const level2Card = el.querySelector('[data-level-id="level-2"]');
    expect(level2Card?.classList.contains('locked')).toBe(true);
  });

  it('triggers onStartAdventure callback when clicking Start Adventure button', () => {
    const onStartAdventure = vi.fn();
    modal.onStartAdventure(onStartAdventure);

    modal.show();
    const startAdvBtn = modal.getElement().querySelector('#btn-start-adventure') as HTMLButtonElement;
    expect(startAdvBtn).not.toBeNull();

    startAdvBtn.click();
    expect(onStartAdventure).toHaveBeenCalledTimes(1);
    expect(modal.isVisible()).toBe(false);
  });

  it('triggers onSelectLevel callback when clicking Play on an unlocked level card', () => {
    const onSelectLevel = vi.fn();
    modal.onSelectLevel(onSelectLevel);

    modal.show();
    const playBtn = modal.getElement().querySelector('[data-level-id="level-1"] .btn-play-level') as HTMLButtonElement;
    expect(playBtn).not.toBeNull();
    expect(playBtn.disabled).toBe(false);

    playBtn.click();
    expect(onSelectLevel).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'level-1', name: 'Emerald Plains' }),
      'custom'
    );
    expect(modal.isVisible()).toBe(false);
  });

  it('does not allow clicking locked level buttons', () => {
    const onSelectLevel = vi.fn();
    modal.onSelectLevel(onSelectLevel);

    modal.show();
    const lockedBtn = modal.getElement().querySelector('[data-level-id="level-2"] .btn-play-level') as HTMLButtonElement;
    expect(lockedBtn.disabled).toBe(true);

    lockedBtn.click();
    expect(onSelectLevel).not.toHaveBeenCalled();
  });

  it('reflects unlocked levels, star ratings, and high scores upon re-showing', () => {
    progressionManager.recordVictory('level-1', 4500, 3, 'level-2');
    progressionManager.recordScore('adventure', 12000);

    modal.show();
    const el = modal.getElement();

    // Adventure high score updated
    expect(el.querySelector('#adventure-high-score')?.textContent).toBe('12,000');

    // Level 1 marked completed with 3 stars and high score
    const lvl1 = el.querySelector('[data-level-id="level-1"]');
    expect(lvl1?.classList.contains('completed')).toBe(true);
    expect(lvl1?.querySelector('.level-stars')?.textContent).toBe('★★★');
    expect(lvl1?.querySelector('.level-stat:nth-child(2) .stat-value')?.textContent).toBe('4,500');

    // Level 2 is now unlocked!
    const lvl2 = el.querySelector('[data-level-id="level-2"]');
    expect(lvl2?.classList.contains('unlocked')).toBe(true);
    const lvl2Btn = lvl2?.querySelector('.btn-play-level') as HTMLButtonElement;
    expect(lvl2Btn.disabled).toBe(false);
  });

  it('displays accumulated score for adventure mode and level-specific scores for each individual level', () => {
    // Simulate player completing Level 1 (2,000 pts) and Level 2 (3,500 pts) in Adventure Mode (Accumulated: 5,500 pts)
    progressionManager.recordVictory('level-1', 2000, 3, 'level-2');
    progressionManager.recordVictory('level-2', 3500, 3, 'level-3');
    progressionManager.recordScore('adventure', 5500);

    modal.show();
    const el = modal.getElement();

    // Adventure mode banner displays the accumulated campaign score
    expect(el.querySelector('#adventure-high-score')?.textContent).toBe('5,500');

    // Level 1 card displays ONLY Level 1 score (2,000)
    const lvl1Best = el.querySelector('[data-level-id="level-1"] .level-stat:nth-child(2) .stat-value');
    expect(lvl1Best?.textContent).toBe('2,000');

    // Level 2 card displays ONLY Level 2 score (3,500), not the accumulated 5,500
    const lvl2Best = el.querySelector('[data-level-id="level-2"] .level-stat:nth-child(2) .stat-value');
    expect(lvl2Best?.textContent).toBe('3,500');

    // Level 3 is unlocked with no score yet
    const lvl3Best = el.querySelector('[data-level-id="level-3"] .level-stat:nth-child(2) .stat-value');
    expect(lvl3Best?.textContent).toBe('-');
  });

  it('closes when close button is clicked', () => {
    const onClose = vi.fn();
    modal.onClose(onClose);

    modal.show();
    const closeBtn = modal.getElement().querySelector('#btn-level-select-close') as HTMLButtonElement;
    closeBtn.click();

    expect(modal.isVisible()).toBe(false);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
