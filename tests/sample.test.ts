import { describe, it, expect } from 'vitest';
import { GameState, type GameStateSnapshot } from '@/game';

describe('Project Scaffolding and Environment Verification', () => {
  it('should resolve path aliases correctly', () => {
    const dummyState: GameStateSnapshot = {
      lives: 20,
      gold: 100,
      score: 0,
      wave: 1,
    };
    expect(dummyState.lives).toBe(20);
    expect(GameState.PREPARATION).toBe('PREPARATION');
  });

  it('should support Canvas 2D mock in jsdom', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    expect(ctx).not.toBeNull();

    if (ctx) {
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(0, 0, 100, 100);
      expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 100, 100);

      const metrics = ctx.measureText('Tower Defence');
      expect(metrics.width).toBeGreaterThan(0);
    }
  });
});
