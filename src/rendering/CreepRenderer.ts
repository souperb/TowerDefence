import { World } from '../core/ecs/World';
import { Entity } from '../core/ecs/Component';
import {
  CREEP_COMPONENT,
  HEALTH_COMPONENT,
  POSITION_COMPONENT,
  SPRITE_COMPONENT,
  VELOCITY_COMPONENT,
  CreepComponent,
  HealthComponent,
  PositionComponent,
  SpriteComponent,
  VelocityComponent,
} from '../game/creeps/CreepComponents';

export interface CreepRendererOptions {
  showHealthBars?: boolean;
  showHealthBarWhenFull?: boolean;
  healthBarWidth?: number;
  healthBarHeight?: number;
  healthBarOffsetY?: number;
  healthHighColor?: string;
  healthMidColor?: string;
  healthLowColor?: string;
  healthBgColor?: string;
  healthBorderColor?: string;
}

export const DEFAULT_CREEP_RENDERER_OPTIONS: Required<CreepRendererOptions> = {
  showHealthBars: true,
  showHealthBarWhenFull: true,
  healthBarWidth: 26,
  healthBarHeight: 4,
  healthBarOffsetY: 9,
  healthHighColor: '#06b6d4', // Relic Cyan / Hard Light vitality
  healthMidColor: '#f59e0b',  // Smoldering Amber
  healthLowColor: '#ef4444',  // Sanguine Crimson
  healthBgColor: 'rgba(7, 10, 19, 0.88)',
  healthBorderColor: 'rgba(217, 119, 6, 0.4)', // Tarnished gold border
};

export class CreepRenderer {
  private world: World;
  private options: Required<CreepRendererOptions>;

  constructor(world: World, options: CreepRendererOptions = {}) {
    this.world = world;
    this.options = { ...DEFAULT_CREEP_RENDERER_OPTIONS, ...options };
  }

  public setWorld(world: World): void {
    this.world = world;
  }

  public setOptions(options: Partial<CreepRendererOptions>): void {
    this.options = { ...this.options, ...options };
  }

  public getOptions(): Readonly<Required<CreepRendererOptions>> {
    return this.options;
  }

  /**
   * Renders all active creep entities in the world.
   */
  public render(ctx: CanvasRenderingContext2D, _alpha: number = 1.0): void {
    const entities = this.world.query([
      POSITION_COMPONENT,
      CREEP_COMPONENT,
      HEALTH_COMPONENT,
    ]);

    for (const entity of entities) {
      this.renderCreepEntity(ctx, entity);
    }
  }

  /**
   * Renders a single creep entity.
   */
  public renderCreepEntity(ctx: CanvasRenderingContext2D, entity: Entity): void {
    const pos = this.world.getComponent<PositionComponent>(entity, POSITION_COMPONENT);
    const creep = this.world.getComponent<CreepComponent>(entity, CREEP_COMPONENT);
    const health = this.world.getComponent<HealthComponent>(entity, HEALTH_COMPONENT);
    const sprite = this.world.getComponent<SpriteComponent>(entity, SPRITE_COMPONENT);
    const vel = this.world.getComponent<VelocityComponent>(entity, VELOCITY_COMPONENT);

    if (!pos || !creep || !health) {
      return;
    }

    if (sprite && !sprite.visible) {
      return;
    }

    const width = sprite?.width ?? 16;
    const height = sprite?.height ?? 16;
    const radius = Math.max(width, height) / 2;
    const rotation = sprite?.rotation ?? (vel ? Math.atan2(vel.vy, vel.vx) : 0);
    const color = sprite?.color ?? '#ffffff';
    const shape = sprite?.shape ?? (creep.creepType === 'tank' ? 'square' : creep.creepType === 'boss' ? 'hexagon' : creep.creepType === 'fast' ? 'diamond' : 'circle');

    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate(rotation);

    this.renderCreepBody(ctx, creep.creepType, width, height, color, shape);

    ctx.restore();

    // Render overhead health bar (without rotation)
    if (this.options.showHealthBars) {
      const isFull = health.current >= health.max;
      if (this.options.showHealthBarWhenFull || !isFull) {
        this.renderHealthBar(
          ctx,
          pos.x,
          pos.y - radius - this.options.healthBarOffsetY,
          health.current,
          health.max,
          this.options.healthBarWidth,
          this.options.healthBarHeight
        );
      }
    }
  }

  /**
   * Draws the distinct visual body for each creep archetype.
   */
  public renderCreepBody(
    ctx: CanvasRenderingContext2D,
    creepType: string,
    width: number,
    height: number,
    color: string,
    shape: string
  ): void {
    const halfW = width / 2;
    const halfH = height / 2;

    ctx.fillStyle = color;
    ctx.strokeStyle = '#05070c';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    switch (shape) {
      case 'square':
        ctx.roundRect
          ? ctx.roundRect(-halfW, -halfH, width, height, 3)
          : ctx.rect(-halfW, -halfH, width, height);
        break;

      case 'diamond':
        ctx.moveTo(halfW, 0);
        ctx.lineTo(0, halfH);
        ctx.lineTo(-halfW, 0);
        ctx.lineTo(0, -halfH);
        ctx.closePath();
        break;

      case 'hexagon':
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3;
          const hx = halfW * Math.cos(angle);
          const hy = halfH * Math.sin(angle);
          if (i === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        break;

      case 'circle':
      default:
        ctx.arc(0, 0, halfW, 0, Math.PI * 2);
        break;
    }

    ctx.fill();
    ctx.stroke();

    // Archetype-specific Dying Earth / Sci-Magic details
    if (creepType === 'boss') {
      // Golden Crown / Relic Chassis
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Outer Thaumaturgic Ring
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, halfW * 0.7, 0, Math.PI * 2);
      ctx.stroke();

      // Pulsing Singularity Core
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(0, 0, halfW * 0.38, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, halfW * 0.18, 0, Math.PI * 2);
      ctx.fill();

      // Forward Relic Brow / Horns
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(halfW * 0.85, 0);
      ctx.lineTo(halfW * 0.35, -halfH * 0.4);
      ctx.lineTo(halfW * 0.45, 0);
      ctx.lineTo(halfW * 0.35, halfH * 0.4);
      ctx.closePath();
      ctx.fill();
    } else if (creepType === 'tank') {
      // Heavy Chthonic Carapace: Armor plating & exhaust core
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 1;
      ctx.strokeRect(-halfW * 0.65, -halfH * 0.65, width * 0.65, height * 0.65);

      // Glowing heat-exhaust reactor
      ctx.fillStyle = '#eab308';
      ctx.fillRect(-halfW * 0.3, -halfH * 0.3, width * 0.3, height * 0.3);

      // Armored front ram visor
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(halfW * 0.2, -halfH * 0.5, 3, height * 0.5);
    } else if (creepType === 'fast') {
      // Alzabo Strider: Aerodynamic spine & predatory optics
      ctx.fillStyle = '#fff7ed';
      ctx.beginPath();
      ctx.moveTo(halfW * 0.65, 0);
      ctx.lineTo(-halfW * 0.35, halfH * 0.35);
      ctx.lineTo(-halfW * 0.1, 0);
      ctx.lineTo(-halfW * 0.35, -halfH * 0.35);
      ctx.closePath();
      ctx.fill();

      // Glowing hunting sensor
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(halfW * 0.35, 0, 1.8, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Ascidian / Neophyte: Cybernetic eye & chitin ring
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, halfW * 0.55, 0, Math.PI * 2);
      ctx.stroke();

      // Cyclopean ocular lens
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.arc(halfW * 0.35, 0, 2.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(halfW * 0.38, -0.5, 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * Renders an overhead health bar.
   */
  public renderHealthBar(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    topY: number,
    currentHp: number,
    maxHp: number,
    barWidth: number = this.options.healthBarWidth,
    barHeight: number = this.options.healthBarHeight
  ): void {
    const ratio = Math.max(0, Math.min(1, maxHp > 0 ? currentHp / maxHp : 0));
    const startX = centerX - barWidth / 2;

    // Background
    ctx.fillStyle = this.options.healthBgColor;
    ctx.fillRect(startX, topY, barWidth, barHeight);

    // Foreground Fill
    let fillColor = this.options.healthHighColor;
    if (ratio <= 0.25) {
      fillColor = this.options.healthLowColor;
    } else if (ratio <= 0.5) {
      fillColor = this.options.healthMidColor;
    }

    const fillWidth = barWidth * ratio;
    ctx.fillStyle = fillColor;
    ctx.fillRect(startX, topY, fillWidth, barHeight);

    // Border
    ctx.strokeStyle = this.options.healthBorderColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(startX - 0.5, topY - 0.5, barWidth + 1, barHeight + 1);
  }
}
