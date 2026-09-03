/**
 * AudioContextManager
 * Manages the Web Audio API AudioContext lifecycle, master/SFX/BGM gain routing,
 * volume controls, and automatic unlock on user interaction.
 */

export class AudioContextManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;

  private masterVolume: number = 0.8;
  private sfxVolume: number = 0.8;
  private bgmVolume: number = 0.7;
  private muted: boolean = false;
  private isUnlocked: boolean = false;

  private unlockListenersAttached: boolean = false;
  private onUnlockCallbacks: Set<() => void> = new Set();

  constructor() {
    this.setupUnlockListeners();
  }

  /**
   * Returns or lazily initializes the Web Audio AudioContext.
   */
  public getContext(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

      if (AudioCtxClass) {
        try {
          this.ctx = new AudioCtxClass();
          this.setupGainNodes();
        } catch {
          // AudioContext not supported or restricted in environment
          this.ctx = null;
        }
      }
    }
    return this.ctx;
  }

  /**
   * Initializes master, SFX, and BGM gain nodes.
   */
  private setupGainNodes(): void {
    if (!this.ctx) return;

    try {
      this.masterGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.bgmGain = this.ctx.createGain();

      this.sfxGain.connect(this.masterGain);
      this.bgmGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.applyGainValues();
    } catch {
      // Ignore audio graph connection errors in non-standard environments
    }
  }

  private applyGainValues(): void {
    const time = this.ctx ? this.ctx.currentTime : 0;
    const targetMaster = this.muted ? 0 : this.masterVolume;
    const targetSfx = this.sfxVolume;
    const targetBgm = this.bgmVolume;

    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(targetMaster, time);
    }
    if (this.sfxGain) {
      this.sfxGain.gain.setValueAtTime(targetSfx, time);
    }
    if (this.bgmGain) {
      this.bgmGain.gain.setValueAtTime(targetBgm, time);
    }
  }

  /**
   * Attaches one-time user interaction listeners to resume the audio context.
   */
  private setupUnlockListeners(): void {
    if (typeof window === 'undefined' || this.unlockListenersAttached) return;
    this.unlockListenersAttached = true;

    const unlock = () => {
      this.unlock();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('click', unlock);
      window.removeEventListener('touchstart', unlock);
    };

    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
    window.addEventListener('click', unlock, { passive: true });
    window.addEventListener('touchstart', unlock, { passive: true });
  }

  /**
   * Resumes the audio context if suspended.
   */
  public async unlock(): Promise<boolean> {
    const ctx = this.getContext();
    if (!ctx) return false;

    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch {
        // Resume failed or blocked
      }
    }

    if (ctx.state === 'running') {
      this.isUnlocked = true;
      for (const cb of this.onUnlockCallbacks) {
        cb();
      }
      this.onUnlockCallbacks.clear();
      return true;
    }

    return false;
  }

  public onUnlock(callback: () => void): void {
    if (this.isUnlocked) {
      callback();
    } else {
      this.onUnlockCallbacks.add(callback);
    }
  }

  public getMasterGain(): GainNode | null {
    return this.masterGain;
  }

  public getSfxGain(): GainNode | null {
    return this.sfxGain;
  }

  public getBgmGain(): GainNode | null {
    return this.bgmGain;
  }

  public getCurrentTime(): number {
    return this.ctx ? this.ctx.currentTime : 0;
  }

  public setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    this.applyGainValues();
  }

  public getMasterVolume(): number {
    return this.masterVolume;
  }

  public setSfxVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    this.applyGainValues();
  }

  public getSfxVolume(): number {
    return this.sfxVolume;
  }

  public setBgmVolume(volume: number): void {
    this.bgmVolume = Math.max(0, Math.min(1, volume));
    this.applyGainValues();
  }

  public getBgmVolume(): number {
    return this.bgmVolume;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    this.applyGainValues();
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  public isContextRunning(): boolean {
    return Boolean(this.ctx && this.ctx.state === 'running');
  }

  public destroy(): void {
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch {
        // Context close error ignored
      }
      this.ctx = null;
    }
    this.masterGain = null;
    this.sfxGain = null;
    this.bgmGain = null;
    this.onUnlockCallbacks.clear();
  }
}
