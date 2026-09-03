export interface GameOverModalData {
  score?: number;
  finalScore?: number;
  waveReached?: number;
  totalWaves?: number;
  kills?: number;
}

export interface GameOverModalOptions {
  container?: HTMLElement;
  onRetry?: () => void;
  onMenu?: () => void;
}

/**
 * UI Modal overlay presented when player core lives reach zero (Defeat).
 */
export class GameOverModal {
  private element: HTMLElement;
  private container: HTMLElement | null;
  private visible: boolean = false;

  private retryCallbacks: Set<() => void> = new Set();
  private menuCallbacks: Set<() => void> = new Set();

  constructor(options: GameOverModalOptions = {}) {
    if (options.onRetry) this.retryCallbacks.add(options.onRetry);
    if (options.onMenu) this.menuCallbacks.add(options.onMenu);

    this.container = options.container ?? (typeof document !== 'undefined' ? document.body : null);
    this.element = this.createElement();

    if (this.container && typeof document !== 'undefined') {
      this.container.appendChild(this.element);
    }
  }

  private createElement(): HTMLElement {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay game-over-modal';
    overlay.style.display = 'none';

    overlay.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <h2 class="modal-title game-over-title">💀 Game Over</h2>
          <p class="modal-subtitle">Your base defenses were breached!</p>
        </div>
        <div class="modal-body">
          <div class="modal-stat-row">
            <span class="stat-label">Wave Reached:</span>
            <span class="stat-value" id="gameover-wave">0 / 0</span>
          </div>
          <div class="modal-stat-row">
            <span class="stat-label">Final Score:</span>
            <span class="stat-value" id="gameover-score">0</span>
          </div>
          <div class="modal-stat-row" id="gameover-kills-row">
            <span class="stat-label">Enemies Defeated:</span>
            <span class="stat-value" id="gameover-kills">0</span>
          </div>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-primary" id="btn-gameover-retry">Try Again</button>
          <button type="button" class="btn btn-secondary" id="btn-gameover-menu" style="display: none;">Menu</button>
        </div>
      </div>
    `;

    const retryBtn = overlay.querySelector('#btn-gameover-retry');
    retryBtn?.addEventListener('click', () => {
      this.hide();
      for (const cb of this.retryCallbacks) cb();
    });

    const menuBtn = overlay.querySelector('#btn-gameover-menu');
    menuBtn?.addEventListener('click', () => {
      this.hide();
      for (const cb of this.menuCallbacks) cb();
    });

    return overlay;
  }

  public show(data: GameOverModalData): void {
    const scoreVal = data.score ?? data.finalScore ?? 0;
    const waveVal = data.waveReached ?? 0;
    const totalVal = data.totalWaves ?? 0;

    const waveEl = this.element.querySelector('#gameover-wave');
    if (waveEl) waveEl.textContent = `Wave ${waveVal} of ${totalVal}`;

    const scoreEl = this.element.querySelector('#gameover-score');
    if (scoreEl) scoreEl.textContent = scoreVal.toLocaleString();

    const killsRow = this.element.querySelector('#gameover-kills-row') as HTMLElement | null;
    const killsEl = this.element.querySelector('#gameover-kills');
    if (killsEl && data.kills !== undefined) {
      if (killsRow) killsRow.style.display = 'flex';
      killsEl.textContent = data.kills.toLocaleString();
    } else if (killsRow) {
      killsRow.style.display = 'none';
    }

    const menuBtn = this.element.querySelector('#btn-gameover-menu') as HTMLElement | null;
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

  public onRetry(callback: () => void): () => void {
    this.retryCallbacks.add(callback);
    return () => this.retryCallbacks.delete(callback);
  }

  public onMenu(callback: () => void): () => void {
    this.menuCallbacks.add(callback);
    const menuBtn = this.element.querySelector('#btn-gameover-menu') as HTMLElement | null;
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
    this.retryCallbacks.clear();
    this.menuCallbacks.clear();
  }
}
