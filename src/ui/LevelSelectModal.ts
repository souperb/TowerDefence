import { LEVEL_LIST, LevelDefinition } from '../game/levels';
import { ProgressionManager } from '../game/state/ProgressionManager';

export interface LevelSelectModalOptions {
  container?: HTMLElement;
  progressionManager?: ProgressionManager;
  onSelectLevel?: (level: LevelDefinition, mode: 'custom' | 'adventure') => void;
  onStartAdventure?: () => void;
  onClose?: () => void;
}

export class LevelSelectModal {
  private element: HTMLElement;
  private container: HTMLElement | null;
  private visible: boolean = false;
  private progressionManager?: ProgressionManager;

  private selectLevelCallbacks: Set<(level: LevelDefinition, mode: 'custom' | 'adventure') => void> = new Set();
  private startAdventureCallbacks: Set<() => void> = new Set();
  private closeCallbacks: Set<() => void> = new Set();

  constructor(options: LevelSelectModalOptions = {}) {
    this.progressionManager = options.progressionManager;
    if (options.onSelectLevel) this.selectLevelCallbacks.add(options.onSelectLevel);
    if (options.onStartAdventure) this.startAdventureCallbacks.add(options.onStartAdventure);
    if (options.onClose) this.closeCallbacks.add(options.onClose);

    this.container = options.container ?? (typeof document !== 'undefined' ? document.body : null);
    this.element = this.createElement();

    if (this.container && typeof document !== 'undefined') {
      this.container.appendChild(this.element);
    }
  }

  public setProgressionManager(manager: ProgressionManager): void {
    this.progressionManager = manager;
  }

  private createElement(): HTMLElement {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay level-select-modal';
    overlay.style.display = 'none';

    overlay.innerHTML = `
      <div class="modal-card level-select-card">
        <div class="modal-header">
          <div class="level-select-header-row">
            <h2 class="modal-title level-select-title">🗺️ Chronicle of Urth</h2>
            <button type="button" class="btn-close" id="btn-level-select-close" aria-label="Close Level Select">✕</button>
          </div>
          <p class="modal-subtitle">Defend the ancient world across 5 forgotten realms under the dying sun</p>
        </div>

        <div class="modal-body level-select-body">
          <!-- Adventure Mode Banner -->
          <div class="adventure-mode-card" id="adventure-mode-card">
            <div class="adventure-card-content">
              <div class="adventure-card-header">
                <span class="adventure-icon">⚔️</span>
                <div class="adventure-info">
                  <h3 class="adventure-title">Adventure Campaign</h3>
                  <p class="adventure-desc">Traverse all 5 desolate realms of Urth in succession, defending ancient relics with lost science and arcane wards.</p>
                </div>
              </div>
              <div class="adventure-stat-row">
                <span class="stat-label">Adventure High Score:</span>
                <span class="stat-value" id="adventure-high-score">0</span>
              </div>
            </div>
            <button type="button" class="btn btn-primary btn-adventure-start" id="btn-start-adventure">
              ▶ Begin Pilgrimage
            </button>
          </div>

          <!-- Level Grid List -->
          <div class="level-list-heading">
            <span class="heading-text">Select Individual Sector</span>
          </div>

          <div class="level-cards-grid" id="level-cards-grid">
            <!-- Rendered dynamically -->
          </div>
        </div>
      </div>
    `;

    const closeBtn = overlay.querySelector('#btn-level-select-close');
    closeBtn?.addEventListener('click', () => {
      this.hide();
      for (const cb of this.closeCallbacks) cb();
    });

    const adventureBtn = overlay.querySelector('#btn-start-adventure');
    adventureBtn?.addEventListener('click', () => {
      this.hide();
      for (const cb of this.startAdventureCallbacks) cb();
    });

    return overlay;
  }

  public renderLevelCards(): void {
    const grid = this.element.querySelector('#level-cards-grid');
    if (!grid) return;

    grid.innerHTML = '';

    const adventureHighScoreEl = this.element.querySelector('#adventure-high-score');
    if (adventureHighScoreEl) {
      const advScore = this.progressionManager?.getHighScore('adventure') ?? 0;
      adventureHighScoreEl.textContent = advScore.toLocaleString();
    }

    for (const level of LEVEL_LIST) {
      const isUnlocked = this.progressionManager
        ? this.progressionManager.isLevelUnlocked(level.id)
        : level.number === 1;
      const isCompleted = this.progressionManager?.isLevelCompleted(level.id) ?? false;
      const highScore = this.progressionManager?.getHighScore(level.id) ?? 0;
      const starRating = this.progressionManager?.getStarRating(level.id) ?? 0;

      const card = document.createElement('div');
      card.className = `level-card ${isUnlocked ? 'unlocked' : 'locked'} ${isCompleted ? 'completed' : ''}`;
      card.setAttribute('data-level-id', level.id);

      const starsDisplay = isCompleted || starRating > 0
        ? '★'.repeat(starRating) + '☆'.repeat(3 - starRating)
        : '☆☆☆';

      card.innerHTML = `
        <div class="level-card-header">
          <div class="level-number-badge">Lvl ${level.number}</div>
          <h4 class="level-card-name">${level.name}</h4>
          <span class="level-difficulty-badge difficulty-${level.difficulty}">
            ${level.difficultyLabel}
          </span>
        </div>
        <p class="level-card-desc">${level.description}</p>
        <div class="level-card-stats">
          <div class="level-stat">
            <span class="stat-label">Waves:</span>
            <span class="stat-value">${level.waves.length}</span>
          </div>
          <div class="level-stat">
            <span class="stat-label">Best:</span>
            <span class="stat-value">${highScore > 0 ? highScore.toLocaleString() : '-'}</span>
          </div>
          <div class="level-stars">${starsDisplay}</div>
        </div>
        <button type="button" class="btn btn-secondary btn-play-level" data-level-id="${level.id}" ${!isUnlocked ? 'disabled' : ''}>
          ${!isUnlocked ? '🔒 Locked' : isCompleted ? 'Replay' : 'Play'}
        </button>
      `;

      const playBtn = card.querySelector('.btn-play-level');
      playBtn?.addEventListener('click', () => {
        if (!isUnlocked) return;
        this.hide();
        for (const cb of this.selectLevelCallbacks) {
          cb(level, 'custom');
        }
      });

      grid.appendChild(card);
    }
  }

  public show(): void {
    this.renderLevelCards();
    this.element.style.display = 'flex';
    this.visible = true;
  }

  public hide(): void {
    this.element.style.display = 'none';
    this.visible = false;
  }

  public isVisible(): boolean {
    return this.visible;
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  public onSelectLevel(callback: (level: LevelDefinition, mode: 'custom' | 'adventure') => void): () => void {
    this.selectLevelCallbacks.add(callback);
    return () => this.selectLevelCallbacks.delete(callback);
  }

  public onStartAdventure(callback: () => void): () => void {
    this.startAdventureCallbacks.add(callback);
    return () => this.startAdventureCallbacks.delete(callback);
  }

  public onClose(callback: () => void): () => void {
    this.closeCallbacks.add(callback);
    return () => this.closeCallbacks.delete(callback);
  }
}
