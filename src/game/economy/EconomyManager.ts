import { EventBus, engineEvents } from '../../core/events/EngineEvents';
import { EconomyState } from './EconomyState';

export type GoldChangeCallback = (currentGold: number, delta: number, source?: string) => void;

export class EconomyManager {
  private gold: number;
  private totalEarned: number = 0;
  private totalSpent: number = 0;
  private eventBus: EventBus;
  private listeners: Set<GoldChangeCallback> = new Set();

  constructor(initialGold: number = 300, eventBus: EventBus = engineEvents) {
    if (initialGold < 0) {
      throw new Error('Initial gold cannot be negative');
    }
    this.gold = initialGold;
    this.totalEarned = initialGold;
    this.eventBus = eventBus;
  }

  /**
   * Sets or replaces the event bus instance.
   */
  public setEventBus(eventBus: EventBus): void {
    this.eventBus = eventBus;
  }

  /**
   * Returns current event bus instance.
   */
  public getEventBus(): EventBus {
    return this.eventBus;
  }

  /**
   * Returns current gold balance.
   */
  public getGold(): number {
    return this.gold;
  }

  /**
   * Returns lifetime total gold earned / deposited.
   */
  public getTotalEarned(): number {
    return this.totalEarned;
  }

  /**
   * Returns lifetime total gold spent / deducted.
   */
  public getTotalSpent(): number {
    return this.totalSpent;
  }

  /**
   * Returns snapshot of current economy state.
   */
  public getState(): EconomyState {
    return {
      gold: this.gold,
      totalEarned: this.totalEarned,
      totalSpent: this.totalSpent,
    };
  }

  /**
   * Sets the gold balance to a specific non-negative value.
   */
  public setGold(amount: number, source?: string): void {
    if (amount < 0) {
      throw new Error('Gold amount cannot be negative');
    }
    const delta = amount - this.gold;
    if (delta !== 0) {
      if (delta > 0) {
        this.totalEarned += delta;
      } else {
        this.totalSpent += Math.abs(delta);
      }
      this.gold = amount;
      this.notifyListeners(delta, source);
    }
  }

  /**
   * Checks if the player can afford a given cost.
   */
  public canAfford(cost: number): boolean {
    if (cost < 0) return false;
    return this.gold >= cost;
  }

  /**
   * Deducts gold if sufficient funds exist.
   * Returns true if successfully deducted, false otherwise.
   */
  public deductGold(amount: number, source?: string): boolean {
    if (amount < 0) {
      throw new Error('Deduct amount cannot be negative');
    }
    if (amount === 0) return true;
    if (!this.canAfford(amount)) {
      return false;
    }
    this.gold -= amount;
    this.totalSpent += amount;
    this.notifyListeners(-amount, source);
    return true;
  }

  /**
   * Alias for deductGold.
   */
  public spendGold(amount: number, source?: string): boolean {
    return this.deductGold(amount, source);
  }

  /**
   * Alias for deductGold / spendGold.
   */
  public withdraw(amount: number, source?: string): boolean {
    return this.deductGold(amount, source);
  }

  /**
   * Credits / adds gold to the player balance.
   */
  public addGold(amount: number, source?: string): void {
    if (amount < 0) {
      throw new Error('Gold to add cannot be negative');
    }
    if (amount === 0) return;
    this.gold += amount;
    this.totalEarned += amount;
    this.notifyListeners(amount, source);
  }

  /**
   * Alias for addGold.
   */
  public creditGold(amount: number, source?: string): void {
    this.addGold(amount, source);
  }

  /**
   * Alias for addGold / creditGold.
   */
  public deposit(amount: number, source?: string): void {
    this.addGold(amount, source);
  }

  /**
   * Resets gold balance to initial amount and resets lifetime counters.
   */
  public reset(initialGold: number = 300): void {
    if (initialGold < 0) {
      throw new Error('Initial gold cannot be negative');
    }
    const delta = initialGold - this.gold;
    this.gold = initialGold;
    this.totalEarned = initialGold;
    this.totalSpent = 0;
    this.notifyListeners(delta, 'reset');
  }

  /**
   * Subscribes a listener to gold changes.
   * @returns Unsubscribe function.
   */
  public onGoldChanged(callback: GoldChangeCallback): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Alias for onGoldChanged.
   */
  public subscribe(callback: GoldChangeCallback): () => void {
    return this.onGoldChanged(callback);
  }

  private notifyListeners(delta: number, source?: string): void {
    // Notify direct subscribers
    for (const listener of this.listeners) {
      try {
        listener(this.gold, delta, source);
      } catch (err) {
        console.error('[EconomyManager] Listener error:', err);
      }
    }

    // Emit event through engine event bus
    if (this.eventBus) {
      this.eventBus.emit('GOLD_CHANGED', {
        currentGold: this.gold,
        delta,
        source,
      });
    }
  }
}
