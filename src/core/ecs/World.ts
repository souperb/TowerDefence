import { Entity, ComponentName, ComponentRegistry } from './Component';
import { EntityManager } from './EntityManager';
import { System } from './System';

export class World {
  private entityManager: EntityManager = new EntityManager();
  private registry: ComponentRegistry = new ComponentRegistry();
  private systems: System[] = [];

  /**
   * Creates a new entity.
   */
  public createEntity(): Entity {
    return this.entityManager.createEntity();
  }

  /**
   * Destroys an entity and recycles its ID.
   */
  public destroyEntity(entity: Entity): boolean {
    return this.entityManager.destroyEntity(entity);
  }

  /**
   * Checks if an entity is alive.
   */
  public isAlive(entity: Entity): boolean {
    return this.entityManager.isAlive(entity);
  }

  /**
   * Returns the generation of an entity ID; changes whenever the ID is destroyed and recycled.
   */
  public getGeneration(entity: Entity): number {
    return this.entityManager.getGeneration(entity);
  }

  /**
   * Gets all alive entities.
   */
  public getAllEntities(): Entity[] {
    return this.entityManager.getAllEntities();
  }

  /**
   * Attaches a component to an entity.
   */
  public addComponent<T>(entity: Entity, componentName: ComponentName, data: T): void {
    const bit = this.registry.getBit(componentName);
    this.entityManager.addComponent(entity, componentName, data, bit);
  }

  /**
   * Removes a component from an entity.
   */
  public removeComponent(entity: Entity, componentName: ComponentName): boolean {
    const bit = this.registry.getBit(componentName);
    return this.entityManager.removeComponent(entity, componentName, bit);
  }

  /**
   * Gets a component attached to an entity.
   */
  public getComponent<T>(entity: Entity, componentName: ComponentName): T | undefined {
    return this.entityManager.getComponent<T>(entity, componentName);
  }

  /**
   * Checks if an entity has a specific component.
   */
  public hasComponent(entity: Entity, componentName: ComponentName): boolean {
    return this.entityManager.hasComponent(entity, componentName);
  }

  /**
   * Queries for all entities that possess all specified components.
   * Uses fast bitmask checking when component count is within bit capacity,
   * falling back to pool verification.
   */
  public query(componentNames: ComponentName[]): Entity[] {
    if (componentNames.length === 0) {
      return this.getAllEntities();
    }

    const mask = this.registry.getMask(componentNames);
    const allEntities = this.entityManager.getAllEntities();
    const result: Entity[] = [];

    for (const entity of allEntities) {
      const entityMask = this.entityManager.getEntityMask(entity);
      if ((entityMask & mask) === mask) {
        // Confirm all components are indeed present (handling potential bit collisions)
        let hasAll = true;
        for (const name of componentNames) {
          if (!this.entityManager.hasComponent(entity, name)) {
            hasAll = false;
            break;
          }
        }
        if (hasAll) {
          result.push(entity);
        }
      }
    }

    return result;
  }

  /**
   * Registers a system with the world.
   */
  public addSystem(system: System): void {
    this.systems.push(system);
    this.systems.sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
    if (system.init) {
      system.init(this);
    }
  }

  /**
   * Removes a system from the world.
   */
  public removeSystem(system: System): boolean {
    const index = this.systems.indexOf(system);
    if (index !== -1) {
      if (system.destroy) {
        system.destroy(this);
      }
      this.systems.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Returns all registered systems.
   */
  public getSystems(): readonly System[] {
    return this.systems;
  }

  /**
   * Advances the simulation by running all registered systems with dt.
   */
  public update(dt: number): void {
    for (const system of this.systems) {
      system.update(this, dt);
    }
  }

  /**
   * Clears all entities, components, and systems.
   */
  public clear(): void {
    for (const system of this.systems) {
      if (system.destroy) {
        system.destroy(this);
      }
    }
    this.systems = [];
    this.entityManager.clear();
  }
}
