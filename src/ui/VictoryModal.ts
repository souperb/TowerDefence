export interface VictoryModalData {
  score?: number;
  finalScore?: number;
  wavesCleared?: number;
  totalWaves?: number;
  stars?: number;
  livesRemaining?: number;
  initialLives?: number;
  hasNextLevel?: boolean;
  title?: string;
  subtitle?: string;
  isAdventureComplete?: boolean;
}

export interface VictoryModalOptions {
  container?: HTMLElement;
  onRestart?: () => void;
  onNextLevel?: () => void;
  onMenu?: () => void;
}

/**
 * UI Modal overlay presented upon achieving victory in a level.
 */
export class VictoryModal {
  private element: HTMLElement;
  private container: HTMLElement | null;
  private visible: boolean = false;

  private restartCallbacks: Set<() => void> = new Set();
  private nextLevelCallbacks: Set<() => void> = new Set();
  private menuCallbacks: Set<() => void> = new Set();

  constructor(options: VictoryModalOptions = {}) {
    if (options.onRestart) this.restartCallbacks.add(options.onRestart);
    if (options.onNextLevel) this.nextLevelCallbacks.add(options.onNextLevel);
    if (options.onMenu) this.menuCallbacks.add(options.onMenu);

    this.container = options.container ?? (typeof document !== 'undefined' ? document.body : null);
    this.element = this.createElement();

    if (this.container && typeof document !== 'undefined') {
      this.container.appendChild(this.element);
    }
  }

  private createElement(): HTMLElement {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay victory-modal';
    overlay.style.display = 'none';

    overlay.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <h2 class="modal-title victory-title">🏆 Victory!</h2>
          <div class="star-rating" id="victory-stars">★★★</div>
        </div>
        <div class="modal-body">
          <div class="modal-stat-row">
            <span class="stat-label">Final Score:</span>
            <span class="stat-value" id="victory-score">0</span>
          </div>
          <div class="modal-stat-row">
            <span class="stat-label">Waves Cleared:</span>
            <span class="stat-value" id="victory-waves">0 / 0</span>
          </div>
          <div class="modal-stat-row" id="victory-lives-row">
            <span class="stat-label">Lives Remaining:</span>
            <span class="stat-value" id="victory-lives">0</span>
          </div>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" id="btn-victory-restart">Play Again</button>
          <button type="button" class="btn btn-primary" id="btn-victory-next">Next Level</button>
          <button type="button" class="btn btn-secondary" id="btn-victory-menu" style="display: none;">Menu</button>
        </div>
      </div>
    `;

    const restartBtn = overlay.querySelector('#btn-victory-restart');
    restartBtn?.addEventListener('click', () => {
      this.hide();
      for (const cb of this.restartCallbacks) cb();
    });

    const nextBtn = overlay.querySelector('#btn-victory-next');
    nextBtn?.addEventListener('click', () => {
      this.hide();
      for (const cb of this.nextLevelCallbacks) cb();
    });

    const menuBtn = overlay.querySelector('#btn-victory-menu');
    menuBtn?.addEventListener('click', () => {
      this.hide();
      for (const cb of this.menuCallbacks) cb();
    });

    return overlay;
  }

  public show(data: VictoryModalData): void {
    const scoreVal = data.score ?? data.finalScore ?? 0;
    const wavesVal = data.wavesCleared ?? data.totalWaves ?? 0;
    const totalVal = data.totalWaves ?? 0;

    const titleEl = this.element.querySelector('.victory-title');
    if (titleEl) {
      titleEl.textContent = data.title ?? (data.isAdventureComplete ? '👑 Adventure Complete!' : '🏆 Victory!');
    }

    const scoreEl = this.element.querySelector('#victory-score');
    if (scoreEl) scoreEl.textContent = scoreVal.toLocaleString();

    const wavesEl = this.element.querySelector('#victory-waves');
    if (wavesEl) wavesEl.textContent = `${wavesVal} / ${totalVal}`;

    const starsEl = this.element.querySelector('#victory-stars');
    if (starsEl) {
      const starCount = Math.max(1, Math.min(3, data.stars ?? 3));
      starsEl.textContent = '★'.repeat(starCount) + '☆'.repeat(3 - starCount);
    }

    const livesRow = this.element.querySelector('#victory-lives-row') as HTMLElement | null;
    const livesEl = this.element.querySelector('#victory-lives');
    if (livesEl && data.livesRemaining !== undefined) {
      if (livesRow) livesRow.style.display = 'flex';
      livesEl.textContent = data.initialLives !== undefined
        ? `${data.livesRemaining} / ${data.initialLives}`
        : `${data.livesRemaining}`;
    } else if (livesRow) {
      livesRow.style.display = 'none';
    }

    const nextBtn = this.element.querySelector('#btn-victory-next') as HTMLElement | null;
    if (nextBtn) {
      nextBtn.style.display = data.hasNextLevel === false || data.isAdventureComplete ? 'none' : 'inline-block';
    }

    const menuBtn = this.element.querySelector('#btn-victory-menu') as HTMLElement | null;
    if (menuBtn) {
      menuBtn.style.display = this.menuCallbacks.size > 0 ? 'inline-block' : 'none';
    }

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

  public onRestart(callback: () => void): () => void {
    this.restartCallbacks.add(callback);
    return () => this.restartCallbacks.delete(callback);
  }

  public onNextLevel(callback: () => void): () => void {
    this.nextLevelCallbacks.add(callback);
    return () => this.nextLevelCallbacks.delete(callback);
  }

  public onMenu(callback: () => void): () => void {
    this.menuCallbacks.add(callback);
    const menuBtn = this.element.querySelector('#btn-victory-menu') as HTMLElement | null;
    if (menuBtn) {
      menuBtn.style.display = 'inline-block';
    }
    return () => {
      this.menuCallbacks.delete(callback);
      if (this.menuCallbacks.size === 0 && menuBtn) {
        menuBtn.style.display = 'none';
      }
    };
  }

  public destroy(): void {
    this.element.remove();
    this.restartCallbacks.clear();
    this.nextLevelCallbacks.clear();
    this.menuCallbacks.clear();
  }
}
