export interface IVector2 {
  x: number;
  y: number;
}

/**
 * 2D Vector mathematics helper class and utilities.
 */
export class Vector2 implements IVector2 {
  public x: number;
  public y: number;

  constructor(x: number = 0, y: number = 0) {
    this.x = x;
    this.y = y;
  }

  public set(x: number, y: number): this {
    this.x = x;
    this.y = y;
    return this;
  }

  public copy(v: IVector2): this {
    this.x = v.x;
    this.y = v.y;
    return this;
  }

  public clone(): Vector2 {
    return new Vector2(this.x, this.y);
  }

  public add(v: IVector2): this {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  public subtract(v: IVector2): this {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }

  public multiplyScalar(scalar: number): this {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }

  public divideScalar(scalar: number): this {
    if (scalar === 0) {
      this.x = 0;
      this.y = 0;
    } else {
      this.x /= scalar;
      this.y /= scalar;
    }
    return this;
  }

  public length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  public lengthSquared(): number {
    return this.x * this.x + this.y * this.y;
  }

  public distanceTo(v: IVector2): number {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  public distanceToSquared(v: IVector2): number {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    return dx * dx + dy * dy;
  }

  public normalize(): this {
    const len = this.length();
    if (len > 1e-9) {
      this.x /= len;
      this.y /= len;
    } else {
      this.x = 0;
      this.y = 0;
    }
    return this;
  }

  public dot(v: IVector2): number {
    return this.x * v.x + this.y * v.y;
  }

  public angle(): number {
    return Math.atan2(this.y, this.x);
  }

  public lerp(target: IVector2, t: number): this {
    this.x += (target.x - this.x) * t;
    this.y += (target.y - this.y) * t;
    return this;
  }

  public equals(v: IVector2, epsilon: number = 1e-6): boolean {
    return Math.abs(this.x - v.x) <= epsilon && Math.abs(this.y - v.y) <= epsilon;
  }

  // Static Helper Methods

  public static create(x: number = 0, y: number = 0): Vector2 {
    return new Vector2(x, y);
  }

  public static clone(v: IVector2): Vector2 {
    return new Vector2(v.x, v.y);
  }

  public static add(a: IVector2, b: IVector2): Vector2 {
    return new Vector2(a.x + b.x, a.y + b.y);
  }

  public static subtract(a: IVector2, b: IVector2): Vector2 {
    return new Vector2(a.x - b.x, a.y - b.y);
  }

  public static multiplyScalar(v: IVector2, scalar: number): Vector2 {
    return new Vector2(v.x * scalar, v.y * scalar);
  }

  public static divideScalar(v: IVector2, scalar: number): Vector2 {
    if (scalar === 0) {
      return new Vector2(0, 0);
    }
    return new Vector2(v.x / scalar, v.y / scalar);
  }

  public static length(v: IVector2): number {
    return Math.sqrt(v.x * v.x + v.y * v.y);
  }

  public static lengthSquared(v: IVector2): number {
    return v.x * v.x + v.y * v.y;
  }

  public static distance(a: IVector2, b: IVector2): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  public static distanceSquared(a: IVector2, b: IVector2): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return dx * dx + dy * dy;
  }

  public static normalize(v: IVector2): Vector2 {
    const len = Math.sqrt(v.x * v.x + v.y * v.y);
    if (len > 1e-9) {
      return new Vector2(v.x / len, v.y / len);
    }
    return new Vector2(0, 0);
  }

  public static dot(a: IVector2, b: IVector2): number {
    return a.x * b.x + a.y * b.y;
  }

  public static lerp(a: IVector2, b: IVector2, t: number): Vector2 {
    return new Vector2(
      a.x + (b.x - a.x) * t,
      a.y + (b.y - a.y) * t
    );
  }

  public static direction(from: IVector2, to: IVector2): Vector2 {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 1e-9) {
      return new Vector2(dx / len, dy / len);
    }
    return new Vector2(0, 0);
  }

  public static angle(v: IVector2): number {
    return Math.atan2(v.y, v.x);
  }

  public static angleBetween(a: IVector2, b: IVector2): number {
    return Math.atan2(b.y - a.y, b.x - a.x);
  }

  public static equals(a: IVector2, b: IVector2, epsilon: number = 1e-6): boolean {
    return Math.abs(a.x - b.x) <= epsilon && Math.abs(a.y - b.y) <= epsilon;
  }
}
