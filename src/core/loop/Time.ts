/**
 * Holds time and tick state for the simulation.
 */
export class Time {
  /**
   * Fixed delta time per simulation tick in seconds (e.g. 1/60 = ~0.016667s).
   */
  public readonly fixedDeltaTime: number;

  /**
   * Total elapsed simulation time in seconds.
   */
  public elapsedSeconds = 0;

  /**
   * Total number of simulation ticks executed.
   */
  public tickCount = 0;

  /**
   * Current frame rendering interpolation alpha [0, 1).
   */
  public alpha = 0;

  constructor(fixedDeltaTime = 1 / 60) {
    this.fixedDeltaTime = fixedDeltaTime;
  }

  /**
   * Advances the simulation by one tick.
   */
  public advanceTick(): void {
    this.tickCount++;
    this.elapsedSeconds += this.fixedDeltaTime;
  }

  /**
   * Updates interpolation alpha between previous and current simulation ticks.
   */
  public setAlpha(alpha: number): void {
    this.alpha = Math.max(0, Math.min(1, alpha));
  }

  /**
   * Resets simulation time to zero.
   */
  public reset(): void {
    this.elapsedSeconds = 0;
    this.tickCount = 0;
    this.alpha = 0;
  }
}
