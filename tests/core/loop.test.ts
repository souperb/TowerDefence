import { describe, it, expect, vi } from 'vitest';
import { GameLoop, Time, TimeControls } from '@/core';

describe('Game Loop & Time Controls', () => {
  describe('Time', () => {
    it('should initialize with default fixedDeltaTime 1/60s', () => {
      const time = new Time();
      expect(time.fixedDeltaTime).toBeCloseTo(1 / 60, 5);
      expect(time.elapsedSeconds).toBe(0);
      expect(time.tickCount).toBe(0);
      expect(time.alpha).toBe(0);
    });

    it('should advance tick count and elapsed time correctly', () => {
      const time = new Time(0.016);
      time.advanceTick();
      expect(time.tickCount).toBe(1);
      expect(time.elapsedSeconds).toBeCloseTo(0.016, 5);

      time.advanceTick();
      expect(time.tickCount).toBe(2);
      expect(time.elapsedSeconds).toBeCloseTo(0.032, 5);
    });

    it('should clamp interpolation alpha between 0 and 1', () => {
      const time = new Time();
      time.setAlpha(0.45);
      expect(time.alpha).toBe(0.45);

      time.setAlpha(-0.5);
      expect(time.alpha).toBe(0);

      time.setAlpha(1.5);
      expect(time.alpha).toBe(1);
    });
  });

  describe('TimeControls', () => {
    it('should manage pause, resume, and toggle', () => {
      const controls = new TimeControls();
      expect(controls.isPaused).toBe(false);

      controls.pause();
      expect(controls.isPaused).toBe(true);

      controls.resume();
      expect(controls.isPaused).toBe(false);

      expect(controls.togglePause()).toBe(true);
      expect(controls.isPaused).toBe(true);
      expect(controls.togglePause()).toBe(false);
      expect(controls.isPaused).toBe(false);
    });

    it('should manage speed multipliers (1x, 2x, 4x) and cycle speed', () => {
      const controls = new TimeControls();
      expect(controls.speed).toBe(1);

      controls.setSpeed(2);
      expect(controls.speed).toBe(2);

      controls.setSpeed(4);
      expect(controls.speed).toBe(4);

      // Invalid speeds ignored
      controls.setSpeed(3 as any);
      expect(controls.speed).toBe(4);

      // Cycle speed 4 -> 1 -> 2 -> 4
      expect(controls.cycleSpeed()).toBe(1);
      expect(controls.cycleSpeed()).toBe(2);
      expect(controls.cycleSpeed()).toBe(4);
      expect(controls.cycleSpeed()).toBe(1);
    });
  });

  describe('GameLoop', () => {
    it('should initialize and run fixed-step ticks (60Hz / 16.667ms per tick)', () => {
      const ticks: number[] = [];
      const loop = new GameLoop({
        tickRate: 60,
        onTick: (dt) => {
          ticks.push(dt);
        },
      });

      // Frame 0 (initial frame sets lastTimestamp)
      expect(loop.step(0)).toBe(0);
      expect(ticks.length).toBe(0);

      // Frame 1 (+16.67ms -> 1 tick)
      const t1 = loop.step(16.67);
      expect(t1).toBe(1);
      expect(ticks.length).toBe(1);
      expect(ticks[0]).toBeCloseTo(1 / 60, 5);

      // Frame 2 (+33.34ms from start -> +16.67ms delta -> 1 tick)
      const t2 = loop.step(33.34);
      expect(t2).toBe(1);
      expect(ticks.length).toBe(2);
    });

    it('should compute smooth interpolation alpha for render frames', () => {
      let lastAlpha = 0;
      const loop = new GameLoop({
        tickRate: 60, // ~16.6667ms per tick
        onRender: (alpha) => {
          lastAlpha = alpha;
        },
      });

      loop.step(0);
      expect(lastAlpha).toBe(0);

      // Advance by 8.333ms (half a tick)
      loop.step(8.3333);
      expect(lastAlpha).toBeCloseTo(0.5, 2);

      // Advance by another 12.5ms (total 20.8333ms from 0, 1 full tick consumed, ~4.166ms remaining -> ~0.25 alpha)
      loop.step(20.8333);
      expect(lastAlpha).toBeCloseTo(0.25, 2);
    });

    it('should halt simulation ticks when paused while still calling onRender with static state', () => {
      const onTickMock = vi.fn();
      const onRenderMock = vi.fn();
      const loop = new GameLoop({
        tickRate: 60,
        onTick: onTickMock,
        onRender: onRenderMock,
      });

      loop.step(0);
      loop.controls.pause();

      // Advance 100ms
      const ticks = loop.step(100);
      expect(ticks).toBe(0);
      expect(onTickMock).not.toHaveBeenCalled();
      expect(onRenderMock).toHaveBeenCalled();
      expect(loop.time.alpha).toBe(0);
    });

    it('should scale tick frequency with 2x and 4x speed multipliers without changing fixedDeltaTime', () => {
      const tickDeltas: number[] = [];
      const loop = new GameLoop({
        tickRate: 60, // 16.667ms
        onTick: (dt) => {
          tickDeltas.push(dt);
        },
      });

      loop.step(0);

      // 1x speed: 33.33ms delta -> 2 ticks
      loop.controls.setSpeed(1);
      const ticks1x = loop.step(33.3334);
      expect(ticks1x).toBe(2);

      // 2x speed: 33.33ms delta -> equivalent to 66.66ms -> 4 ticks
      loop.controls.setSpeed(2);
      const ticks2x = loop.step(66.6668);
      expect(ticks2x).toBe(4);

      // Fixed delta time passed to tick must ALWAYS be 1/60 regardless of speed
      for (const dt of tickDeltas) {
        expect(dt).toBeCloseTo(1 / 60, 5);
      }
    });

    it('should clamp accumulator to max 5 ticks per frame to prevent spiral-of-death during lag spikes', () => {
      let tickCount = 0;
      const loop = new GameLoop({
        tickRate: 60, // 16.667ms per tick, 5 ticks = ~83.33ms max accumulator
        maxTicksPerFrame: 5,
        onTick: () => {
          tickCount++;
        },
      });

      loop.step(0);

      // Simulate a massive 1000ms (1 second) lag spike
      const ticksExecuted = loop.step(1000);

      // Should clamp to exactly 5 ticks
      expect(ticksExecuted).toBe(5);
      expect(tickCount).toBe(5);

      // Subsequent normal frame (+16.67ms) runs exactly 1 tick without runaway leftover lag
      const subsequentTicks = loop.step(1016.67);
      expect(subsequentTicks).toBe(1);
    });

    it('should start and stop requestAnimationFrame loop', () => {
      const requestFrameMock = vi.fn((cb) => {
        return setTimeout(() => cb(16.67), 0) as unknown as number;
      });
      const cancelFrameMock = vi.fn((id) => {
        clearTimeout(id as unknown as NodeJS.Timeout);
      });

      const loop = new GameLoop({
        requestFrame: requestFrameMock,
        cancelFrame: cancelFrameMock,
      });

      expect(loop.running).toBe(false);
      loop.start();
      expect(loop.running).toBe(true);
      expect(requestFrameMock).toHaveBeenCalled();

      loop.stop();
      expect(loop.running).toBe(false);
      expect(cancelFrameMock).toHaveBeenCalled();
    });
  });
});
