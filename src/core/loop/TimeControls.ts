export type GameSpeed = 1 | 2 | 4;

export class TimeControls {
  private _isPaused = false;
  private _speed: GameSpeed = 1;

  public get isPaused(): boolean {
    return this._isPaused;
  }

  public get speed(): GameSpeed {
    return this._speed;
  }

  /**
   * Pauses simulation updates.
   */
  public pause(): void {
    this._isPaused = true;
  }

  /**
   * Resumes simulation updates.
   */
  public resume(): void {
    this._isPaused = false;
  }

  /**
   * Toggles pause / resume state.
   */
  public togglePause(): boolean {
    this._isPaused = !this._isPaused;
    return this._isPaused;
  }

  /**
   * Sets game speed multiplier (1x, 2x, 4x).
   */
  public setSpeed(speed: GameSpeed): void {
    if (speed === 1 || speed === 2 || speed === 4) {
      this._speed = speed;
    }
  }

  /**
   * Cycles to the next speed setting (1x -> 2x -> 4x -> 1x).
   */
  public cycleSpeed(): GameSpeed {
    if (this._speed === 1) {
      this._speed = 2;
    } else if (this._speed === 2) {
      this._speed = 4;
    } else {
      this._speed = 1;
    }
    return this._speed;
  }

  /**
   * Resets controls to running at 1x.
   */
  public reset(): void {
    this._isPaused = false;
    this._speed = 1;
  }
}
