/**
 * Unique numeric entity identifier.
 */
export type Entity = number;

/**
 * Component name identifier.
 */
export type ComponentName = string;

/**
 * Metadata / bitmask tracking for component types.
 */
export class ComponentRegistry {
  private componentBits: Map<ComponentName, number> = new Map();
  private nextBit = 0;

  /**
   * Registers a component name and assigns a bit flag for fast bitmask querying.
   */
  public register(name: ComponentName): number {
    let bit = this.componentBits.get(name);
    if (bit === undefined) {
      if (this.nextBit >= 31) {
        // Fallback or warning if exceeding 31 bitwise representation
        bit = 1 << (this.nextBit % 31);
      } else {
        bit = 1 << this.nextBit;
      }
      this.componentBits.set(name, bit);
      this.nextBit++;
    }
    return bit;
  }

  /**
   * Gets the bitmask flag for a component name, registering if not present.
   */
  public getBit(name: ComponentName): number {
    let bit = this.componentBits.get(name);
    if (bit === undefined) {
      bit = this.register(name);
    }
    return bit;
  }

  /**
   * Computes a combined bitmask for an array of component names.
   */
  public getMask(names: ComponentName[]): number {
    let mask = 0;
    for (const name of names) {
      mask |= this.getBit(name);
    }
    return mask;
  }
}
