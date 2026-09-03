import { Time } from './Time';
import { TimeControls } from './TimeControls';

export interface GameLoopOptions {
  /**
   * Target simulation tick rate in Hz. Defaults to 60.
   */
  tickRate?: number;
  /**
   * Maximum simulation ticks allowed per frame to prevent spiral-of-death. Defaults to 5.
   */
  maxTicksPerFrame?: number;
  /**
   * Optional custom requestAnimationFrame provider (useful for testing or node/worker environments).
   */
  requestFrame?: (callback: (timestamp: number) => void) => number;
  /**
   * Optional custom cancelAnimationFrame provider.
   */
  cancelFrame?: (handle: number) => void;
  /**
   * Fixed update callback invoked on each simulation tick with fixedDeltaTime (seconds).
   */
  onTick?: (dt: number, time: Time) => void;
  /**
   * Render update callback invoked each animation frame with interpolation alpha.
   */
  onRender?: (alpha: number, time: Time) => void;
}

export class GameLoop {
  public readonly time: Time;
  public readonly controls: TimeControls;

  private tickRate: number;
  private fixedDeltaTimeMs: number;
  private maxTicksPerFrame: number;

  private accumulatorMs = 0;
  private lastTimestampMs: number | null = null;
  private isRunning = false;
  private frameId: number | null = null;

  private requestFrame: (callback: (timestamp: number) => void) => number;
  private cancelFrame: (handle: number) => void;

  private onTick?: (dt: number, time: Time) => void;
  private onRender?: (alpha: number, time: Time) => void;

  constructor(options: GameLoopOptions = {}) {
    this.tickRate = options.tickRate ?? 60;
    const fixedDeltaTimeSec = 1 / this.tickRate;
    this.fixedDeltaTimeMs = (1000 / this.tickRate);
    this.maxTicksPerFrame = options.maxTicksPerFrame ?? 5;

    this.time = new Time(fixedDeltaTimeSec);
    this.controls = new TimeControls();

    this.onTick = options.onTick;
    this.onRender = options.onRender;

    this.requestFrame = options.requestFrame ?? (typeof window !== 'undefined' && window.requestAnimationFrame
      ? window.requestAnimationFrame.bind(window)
      : (cb) => setTimeout(() => cb(Date.now()), 16) as unknown as number);

    this.cancelFrame = options.cancelFrame ?? (typeof window !== 'undefined' && window.cancelAnimationFrame
      ? window.cancelAnimationFrame.bind(window)
      : (id) => clearTimeout(id as unknown as NodeJS.Timeout));
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTimestampMs = null;
    this.accumulatorMs = 0;

    const frameCallback = (timestamp: number) => {
      if (!this.isRunning) return;
      this.step(timestamp);
      this.frameId = this.requestFrame(frameCallback);
    };

    this.frameId = this.requestFrame(frameCallback);
  }

  public stop(): void {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.frameId !== null) {
      this.cancelFrame(this.frameId);
      this.frameId = null;
    }
    this.lastTimestampMs = null;
  }

  public get running(): boolean {
    return this.isRunning;
  }

  /**
   * Advances game loop for a given frame timestamp in milliseconds.
   * Useful for both requestAnimationFrame and manual stepping in unit tests.
   * @param currentTimestampMs Timestamp in milliseconds.
   * @returns Number of simulation ticks executed during this step.
   */
  public step(currentTimestampMs: number): number {
    if (this.lastTimestampMs === null) {
      this.lastTimestampMs = currentTimestampMs;
      // First frame, trigger initial render with alpha = 0
      this.time.setAlpha(0);
      if (this.onRender) {
        this.onRender(this.time.alpha, this.time);
      }
      return 0;
    }

    let deltaMs = currentTimestampMs - this.lastTimestampMs;
    this.lastTimestampMs = currentTimestampMs;

    // Guard against negative deltas
    if (deltaMs < 0) {
      deltaMs = 0;
    }

    // If paused, render with current state (alpha = 0) and do not advance simulation accumulator
    if (this.controls.isPaused) {
      this.time.setAlpha(0);
      if (this.onRender) {
        this.onRender(this.time.alpha, this.time);
      }
      return 0;
    }

    // Apply speed scaling to elapsed time for simulation accumulator
    const effectiveDeltaMs = deltaMs * this.controls.speed;
    this.accumulatorMs += effectiveDeltaMs;

    // Spiral-of-death protection: clamp accumulator to maxTicksPerFrame * fixedDeltaTimeMs
    const maxAccumulator = this.maxTicksPerFrame * this.fixedDeltaTimeMs;
    if (this.accumulatorMs > maxAccumulator) {
      this.accumulatorMs = maxAccumulator;
    }

    let ticksExecuted = 0;
    while (this.accumulatorMs >= this.fixedDeltaTimeMs - 1e-9 && ticksExecuted < this.maxTicksPerFrame) {
      this.time.advanceTick();
      if (this.onTick) {
        this.onTick(this.time.fixedDeltaTime, this.time);
      }
      this.accumulatorMs -= this.fixedDeltaTimeMs;
      ticksExecuted++;
    }

    if (this.accumulatorMs < 0) {
      this.accumulatorMs = 0;
    }

    // Compute interpolation alpha = remaining accumulator / fixedDeltaTimeMs
    const alpha = this.accumulatorMs / this.fixedDeltaTimeMs;
    this.time.setAlpha(alpha);

    if (this.onRender) {
      this.onRender(this.time.alpha, this.time);
    }

    return ticksExecuted;
  }

  /**
   * Manually steps the simulation by an exact delta time in milliseconds.
   * @param deltaMs Delta time in milliseconds.
   * @returns Number of simulation ticks executed.
   */
  public stepDelta(deltaMs: number): number {
    const start = this.lastTimestampMs ?? 0;
    const target = start + deltaMs;
    if (this.lastTimestampMs === null) {
      this.step(start);
    }
    return this.step(target);
  }

  /**
   * Resets accumulator and timing.
   */
  public reset(): void {
    this.accumulatorMs = 0;
    this.lastTimestampMs = null;
    this.time.reset();
    this.controls.reset();
  }
}
