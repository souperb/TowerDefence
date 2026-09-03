import { Entity, ComponentName } from './Component';

export class EntityManager {
  private nextEntityId: Entity = 1;
  private freeEntityIds: Entity[] = [];
  private activeEntities: Set<Entity> = new Set();

  // Storage for component data: componentName -> (entityId -> componentData)
  private componentPools: Map<ComponentName, Map<Entity, any>> = new Map();
  // Bitmasks for active components per entity
  private entityMasks: Map<Entity, number> = new Map();
  // Incremented each time an ID is destroyed so stale references can be detected after recycling
  private generations: Map<Entity, number> = new Map();

  /**
   * Creates a new unique entity or recycles a previously destroyed entity ID.
   */
  public createEntity(): Entity {
    let entity: Entity;
    if (this.freeEntityIds.length > 0) {
      entity = this.freeEntityIds.pop()!;
    } else {
      entity = this.nextEntityId++;
    }

    this.activeEntities.add(entity);
    this.entityMasks.set(entity, 0);
    return entity;
  }

  /**
   * Destroys an entity, removes all attached components, and marks the ID for recycling.
   */
  public destroyEntity(entity: Entity): boolean {
    if (!this.activeEntities.has(entity)) {
      return false;
    }

    // Remove entity from all component pools
    for (const pool of this.componentPools.values()) {
      pool.delete(entity);
    }

    this.entityMasks.delete(entity);
    this.activeEntities.delete(entity);
    this.generations.set(entity, (this.generations.get(entity) ?? 0) + 1);
    this.freeEntityIds.push(entity);
    return true;
  }

  /**
   * Returns the generation of an entity ID (number of times it has been destroyed and recycled).
   */
  public getGeneration(entity: Entity): number {
    return this.generations.get(entity) ?? 0;
  }

  /**
   * Checks whether an entity is currently alive and active.
   */
  public isAlive(entity: Entity): boolean {
    return this.activeEntities.has(entity);
  }

  /**
   * Returns all active entity IDs.
   */
  public getAllEntities(): Entity[] {
    return Array.from(this.activeEntities);
  }

  /**
   * Attaches a component to an entity.
   */
  public addComponent<T>(entity: Entity, componentName: ComponentName, data: T, componentBit = 0): void {
    if (!this.activeEntities.has(entity)) {
      throw new Error(`Cannot add component '${componentName}' to non-existent or destroyed entity ${entity}`);
    }

    let pool = this.componentPools.get(componentName);
    if (!pool) {
      pool = new Map<Entity, any>();
      this.componentPools.set(componentName, pool);
    }

    pool.set(entity, data);

    if (componentBit !== 0) {
      const currentMask = this.entityMasks.get(entity) || 0;
      this.entityMasks.set(entity, currentMask | componentBit);
    }
  }

  /**
   * Removes a component from an entity.
   */
  public removeComponent(entity: Entity, componentName: ComponentName, componentBit = 0): boolean {
    if (!this.activeEntities.has(entity)) {
      return false;
    }

    const pool = this.componentPools.get(componentName);
    if (!pool || !pool.has(entity)) {
      return false;
    }

    pool.delete(entity);

    if (componentBit !== 0) {
      const currentMask = this.entityMasks.get(entity) || 0;
      this.entityMasks.set(entity, currentMask & ~componentBit);
    }

    return true;
  }

  /**
   * Gets a component attached to an entity.
   */
  public getComponent<T>(entity: Entity, componentName: ComponentName): T | undefined {
    if (!this.activeEntities.has(entity)) {
      return undefined;
    }
    const pool = this.componentPools.get(componentName);
    return pool ? pool.get(entity) : undefined;
  }

  /**
   * Checks if an entity has a specific component.
   */
  public hasComponent(entity: Entity, componentName: ComponentName): boolean {
    if (!this.activeEntities.has(entity)) {
      return false;
    }
    const pool = this.componentPools.get(componentName);
    return pool ? pool.has(entity) : false;
  }

  /**
   * Returns all component names attached to an entity.
   */
  public getEntityComponents(entity: Entity): ComponentName[] {
    if (!this.activeEntities.has(entity)) {
      return [];
    }
    const components: ComponentName[] = [];
    for (const [name, pool] of this.componentPools.entries()) {
      if (pool.has(entity)) {
        components.push(name);
      }
    }
    return components;
  }

  /**
   * Gets the current component bitmask for an entity.
   */
  public getEntityMask(entity: Entity): number {
    return this.entityMasks.get(entity) || 0;
  }

  /**
   * Clears all entities and component pools.
   */
  public clear(): void {
    this.activeEntities.clear();
    this.freeEntityIds = [];
    this.nextEntityId = 1;
    this.componentPools.clear();
    this.entityMasks.clear();
    this.generations.clear();
  }
}
