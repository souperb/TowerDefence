import { World } from '../core/ecs/World';
import { Entity } from '../core/ecs/Component';
import { IVector2 } from '../core/math/Vector2';
import {
  PROJECTILE_COMPONENT,
  POSITION_COMPONENT,
  SPRITE_COMPONENT,
  ProjectileComponent,
  PositionComponent,
  SpriteComponent,
} from '../game/projectiles/ProjectileComponents';

export interface ImpactEffect {
  x: number;
  y: number;
  currentRadius: number;
  maxRadius: number;
  color: string;
  duration: number;
  elapsed: number;
}

export interface ProjectileRendererOptions {
  renderImpactEffects?: boolean;
}

export class ProjectileRenderer {
  private world: World;
  private impactEffects: ImpactEffect[] = [];
  private options: Required<ProjectileRendererOptions>;

  constructor(world: World, options: ProjectileRendererOptions = {}) {
    this.world = world;
    this.options = {
      renderImpactEffects: options.renderImpactEffects ?? true,
    };
  }

  public setWorld(world: World): void {
    this.world = world;
  }

  public addImpactEffect(
    pos: IVector2,
    maxRadius: number = 32,
    color: string = '#f97316',
    duration: number = 0.3
  ): void {
    if (!this.options.renderImpactEffects) return;
    this.impactEffects.push({
      x: pos.x,
      y: pos.y,
      currentRadius: 4,
      maxRadius: Math.max(8, maxRadius),
      color,
      duration: Math.max(0.05, duration),
      elapsed: 0,
    });
  }

  public updateEffects(dt: number): void {
    if (dt <= 0) return;
    for (let i = this.impactEffects.length - 1; i >= 0; i--) {
      const effect = this.impactEffects[i];
      effect.elapsed += dt;
      const progress = effect.elapsed / effect.duration;
      effect.currentRadius = 4 + (effect.maxRadius - 4) * progress;
      if (effect.elapsed >= effect.duration) {
        this.impactEffects.splice(i, 1);
      }
    }
  }

  public clearEffects(): void {
    this.impactEffects = [];
  }

  /**
   * Renders all active projectile entities and impact splash rings.
   */
  public render(ctx: CanvasRenderingContext2D, dt: number = 0): void {
    if (dt > 0) {
      this.updateEffects(dt);
    }

    const projectileEntities = this.world.query([PROJECTILE_COMPONENT, POSITION_COMPONENT]);

    for (const entity of projectileEntities) {
      this.renderProjectileEntity(ctx, entity);
    }

    if (this.options.renderImpactEffects) {
      this.renderImpactEffects(ctx);
    }
  }

  public renderProjectileEntity(ctx: CanvasRenderingContext2D, entity: Entity): void {
    const proj = this.world.getComponent<ProjectileComponent>(entity, PROJECTILE_COMPONENT);
    const pos = this.world.getComponent<PositionComponent>(entity, POSITION_COMPONENT);
    const sprite = this.world.getComponent<SpriteComponent>(entity, SPRITE_COMPONENT);

    if (!proj || !pos) return;
    if (sprite && !sprite.visible) return;

    const rotation = sprite?.rotation ?? 0;
    const towerType = proj.towerType;

    ctx.save();
    ctx.translate(pos.x, pos.y);

    switch (towerType) {
      case 'archer':
        ctx.rotate(rotation);
        this.drawArrow(ctx, sprite?.width ?? 14, sprite?.height ?? 4, sprite?.color ?? '#38bdf8');
        break;

      case 'cannon':
        this.drawCannonball(ctx, (sprite?.width ?? 10) / 2, sprite?.color ?? '#f97316');
        break;

      case 'mage':
        this.drawMageOrb(ctx, (sprite?.width ?? 12) / 2, sprite?.color ?? '#a855f7');
        break;

      default:
        ctx.rotate(rotation);
        this.drawGenericProjectile(
          ctx,
          (sprite?.width ?? 8) / 2,
          sprite?.color ?? '#ffffff'
        );
        break;
    }

    ctx.restore();
  }

  private drawArrow(
    ctx: CanvasRenderingContext2D,
    length: number,
    _height: number,
    color: string
  ): void {
    const halfLen = length / 2;

    // Hard-light Energy Beam / Dart Tail
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-halfLen * 1.4, 0);
    ctx.lineTo(halfLen, 0);
    ctx.stroke();

    // Primary energy core
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-halfLen, 0);
    ctx.lineTo(halfLen, 0);
    ctx.stroke();

    // Searing needle tip
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(halfLen + 4, 0);
    ctx.lineTo(halfLen - 2, -2.5);
    ctx.lineTo(halfLen - 2, 2.5);
    ctx.closePath();
    ctx.fill();

    // Relic stabilizer fins
    ctx.strokeStyle = '#67e8f9';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-halfLen * 0.4, 0);
    ctx.lineTo(-halfLen - 2, -3);
    ctx.moveTo(-halfLen * 0.4, 0);
    ctx.lineTo(-halfLen - 2, 3);
    ctx.stroke();
  }

  private drawCannonball(ctx: CanvasRenderingContext2D, radius: number, color: string): void {
    // Outer smoldering plasma corona
    ctx.fillStyle = 'rgba(249, 115, 22, 0.25)';
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Heavy iron ordnance shell
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    // Incandescent molten core
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.7, 0, Math.PI * 2);
    ctx.fill();

    // Specular plasma glint
    ctx.fillStyle = '#fff7ed';
    ctx.beginPath();
    ctx.arc(-radius * 0.25, -radius * 0.25, radius * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawMageOrb(ctx: CanvasRenderingContext2D, radius: number, color: string): void {
    // Outer thaumaturgic halo
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 2.0, 0, Math.PI * 2);
    ctx.fill();

    // Eldritch void body
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    // Rotating mystic focus diamond
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = '#e879f9';
    ctx.beginPath();
    ctx.moveTo(0, -radius * 0.8);
    ctx.lineTo(radius * 0.8, 0);
    ctx.lineTo(0, radius * 0.8);
    ctx.lineTo(-radius * 0.8, 0);
    ctx.closePath();
    ctx.fill();

    // Pure white singularity point
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawGenericProjectile(
    ctx: CanvasRenderingContext2D,
    radius: number,
    color: string
  ): void {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderImpactEffects(ctx: CanvasRenderingContext2D): void {
    for (const effect of this.impactEffects) {
      const progress = effect.elapsed / effect.duration;
      const alpha = Math.max(0, 1 - progress);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = effect.color;
      ctx.lineWidth = Math.max(1, 3 * (1 - progress));

      // Primary shockwave ring
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, effect.currentRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Translucent inner energy glow
      ctx.fillStyle = effect.color;
      ctx.globalAlpha = alpha * 0.3;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, effect.currentRadius * 0.7, 0, Math.PI * 2);
      ctx.fill();

      // Outer secondary ripple
      if (effect.currentRadius > 14) {
        ctx.globalAlpha = alpha * 0.5;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, effect.currentRadius * 0.45, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    }
  }
}
