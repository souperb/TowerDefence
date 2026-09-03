import { World, Entity } from '../../core/ecs';
import {
  TowerType,
  TowerComponent,
  PositionComponent,
  SpriteComponent,
  POSITION_COMPONENT,
  TOWER_COMPONENT,
  SPRITE_COMPONENT,
} from './TowerComponents';
import { getTowerDefinition } from './TowerCatalog';
import { getTileCenter } from '../map/CoordinateUtils';

export class TowerFactory {
  /**
   * Instantiates a new tower ECS entity at the specified grid tile coordinates.
   *
   * @param world The ECS World instance.
   * @param type Tower archetype ('archer' | 'cannon' | 'mage').
   * @param gridX Tile grid X coordinate.
   * @param gridY Tile grid Y coordinate.
   * @param tileSize Size of each tile in world pixels (default: 32).
   * @returns The newly created Entity.
   */
  public static createTower(
    world: World,
    type: TowerType,
    gridX: number,
    gridY: number,
    tileSize: number = 32
  ): Entity {
    const def = getTowerDefinition(type);
    const center = getTileCenter(gridX, gridY, tileSize);
    const entity = world.createEntity();

    const position: PositionComponent = {
      x: center.x,
      y: center.y,
    };

    const tower: TowerComponent = {
      towerType: type,
      tier: 1,
      range: def.range,
      fireRate: def.fireRate,
      damage: def.damage,
      splashRadius: def.splashRadius,
      cooldownRemaining: 0,
      targetStrategy: 'first',
      targetEntityId: null,
      baseCost: def.baseCost,
      totalInvestedCost: def.baseCost,
      gridX,
      gridY,
    };

    const sprite: SpriteComponent = {
      spriteId: def.spriteId,
      width: tileSize,
      height: tileSize,
      rotation: 0,
      visible: true,
      color: def.color,
    };

    world.addComponent<PositionComponent>(entity, POSITION_COMPONENT, position);
    world.addComponent<TowerComponent>(entity, TOWER_COMPONENT, tower);
    world.addComponent<SpriteComponent>(entity, SPRITE_COMPONENT, sprite);

    return entity;
  }
}
