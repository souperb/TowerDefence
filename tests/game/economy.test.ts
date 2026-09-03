import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EconomyManager } from '../../src/game/economy/EconomyManager';
import { EventBus } from '../../src/core/events/EngineEvents';

describe('EconomyManager (US-06 / TASK-06-01 & TASK-06-03)', () => {
  let eventBus: EventBus;
  let economy: EconomyManager;

  beforeEach(() => {
    eventBus = new EventBus();
    economy = new EconomyManager(300, eventBus);
  });

  describe('Initialization and State', () => {
    it('should initialize with default gold of 300', () => {
      const defaultEconomy = new EconomyManager();
      expect(defaultEconomy.getGold()).toBe(300);
      expect(defaultEconomy.getTotalEarned()).toBe(300);
      expect(defaultEconomy.getTotalSpent()).toBe(0);
    });

    it('should initialize with custom initial gold', () => {
      const customEconomy = new EconomyManager(500, eventBus);
      expect(customEconomy.getGold()).toBe(500);
      expect(customEconomy.getTotalEarned()).toBe(500);
    });

    it('should throw error on negative initial gold', () => {
      expect(() => new EconomyManager(-50)).toThrow('Initial gold cannot be negative');
    });

    it('should return complete state snapshot via getState()', () => {
      const state = economy.getState();
      expect(state).toEqual({
        gold: 300,
        totalEarned: 300,
        totalSpent: 0,
      });
    });
  });

  describe('Affordability and Withdrawals', () => {
    it('should correctly evaluate canAfford', () => {
      expect(economy.canAfford(100)).toBe(true);
      expect(economy.canAfford(300)).toBe(true);
      expect(economy.canAfford(301)).toBe(false);
      expect(economy.canAfford(-10)).toBe(false);
    });

    it('should deduct gold when player can afford it', () => {
      const success = economy.deductGold(100, 'tower_purchase');
      expect(success).toBe(true);
      expect(economy.getGold()).toBe(200);
      expect(economy.getTotalSpent()).toBe(100);
    });

    it('should fail and not modify gold when player cannot afford deduction', () => {
      const success = economy.deductGold(400);
      expect(success).toBe(false);
      expect(economy.getGold()).toBe(300);
      expect(economy.getTotalSpent()).toBe(0);
    });

    it('should handle spendGold and withdraw aliases', () => {
      expect(economy.spendGold(50)).toBe(true);
      expect(economy.withdraw(50)).toBe(true);
      expect(economy.getGold()).toBe(200);
      expect(economy.getTotalSpent()).toBe(100);
    });

    it('should throw error when deducting negative amount', () => {
      expect(() => economy.deductGold(-50)).toThrow('Deduct amount cannot be negative');
    });

    it('should handle zero deduction gracefully', () => {
      expect(economy.deductGold(0)).toBe(true);
      expect(economy.getGold()).toBe(300);
    });
  });

  describe('Deposits and Gold Additions', () => {
    it('should add gold and update totalEarned', () => {
      economy.addGold(150, 'wave_reward');
      expect(economy.getGold()).toBe(450);
      expect(economy.getTotalEarned()).toBe(450);
    });

    it('should handle creditGold and deposit aliases', () => {
      economy.creditGold(50);
      economy.deposit(50);
      expect(economy.getGold()).toBe(400);
    });

    it('should throw error on negative addGold', () => {
      expect(() => economy.addGold(-10)).toThrow('Gold to add cannot be negative');
    });

    it('should do nothing on zero addGold', () => {
      const listener = vi.fn();
      economy.onGoldChanged(listener);
      economy.addGold(0);
      expect(economy.getGold()).toBe(300);
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('setGold and reset', () => {
    it('should set exact gold amount and update tracking', () => {
      economy.setGold(600);
      expect(economy.getGold()).toBe(600);
      expect(economy.getTotalEarned()).toBe(600);

      economy.setGold(400);
      expect(economy.getGold()).toBe(400);
      expect(economy.getTotalSpent()).toBe(200);
    });

    it('should throw error when setGold is called with negative value', () => {
      expect(() => economy.setGold(-1)).toThrow('Gold amount cannot be negative');
    });

    it('should reset gold and counters to default or custom amount', () => {
      economy.addGold(200);
      economy.deductGold(100);
      economy.reset(300);

      expect(economy.getGold()).toBe(300);
      expect(economy.getTotalEarned()).toBe(300);
      expect(economy.getTotalSpent()).toBe(0);
    });

    it('should throw error on negative reset amount', () => {
      expect(() => economy.reset(-100)).toThrow('Initial gold cannot be negative');
    });
  });

  describe('Event and Callback Notifications', () => {
    it('should notify direct subscribers on gold changes', () => {
      const listener = vi.fn();
      const unsub = economy.onGoldChanged(listener);

      economy.addGold(100, 'bounty');
      expect(listener).toHaveBeenCalledWith(400, 100, 'bounty');

      economy.deductGold(50, 'tower');
      expect(listener).toHaveBeenCalledWith(350, -50, 'tower');

      unsub();
      economy.addGold(20);
      expect(listener).toHaveBeenCalledTimes(2);
    });

    it('should emit GOLD_CHANGED event through EventBus', () => {
      let emittedData: any = null;
      eventBus.on('GOLD_CHANGED', (data) => {
        emittedData = data;
      });

      economy.addGold(75, 'creep_kill');
      expect(emittedData).toEqual({
        currentGold: 375,
        delta: 75,
        source: 'creep_kill',
      });

      economy.spendGold(100, 'upgrade');
      expect(emittedData).toEqual({
        currentGold: 275,
        delta: -100,
        source: 'upgrade',
      });
    });

    it('should support swapping event bus with setEventBus', () => {
      const newBus = new EventBus();
      economy.setEventBus(newBus);
      expect(economy.getEventBus()).toBe(newBus);

      let newBusEmitted = false;
      newBus.on('GOLD_CHANGED', () => {
        newBusEmitted = true;
      });

      economy.addGold(50);
      expect(newBusEmitted).toBe(true);
    });
  });
});
