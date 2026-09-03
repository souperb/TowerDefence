import { describe, it, expect, vi } from 'vitest';
import { World, EntityManager, ComponentRegistry, System } from '@/core';

interface Position {
  x: number;
  y: number;
}

interface Velocity {
  vx: number;
  vy: number;
}

interface Health {
  current: number;
  max: number;
}

describe('ECS Core', () => {
  describe('ComponentRegistry', () => {
    it('should assign unique bit flags for registered components', () => {
      const registry = new ComponentRegistry();
      const posBit = registry.register('Position');
      const velBit = registry.register('Velocity');
      const healthBit = registry.register('Health');

      expect(posBit).toBe(1);
      expect(velBit).toBe(2);
      expect(healthBit).toBe(4);

      // Re-registering or querying returns same bit
      expect(registry.getBit('Position')).toBe(1);
      expect(registry.getBit('Velocity')).toBe(2);

      // Mask calculation
      expect(registry.getMask(['Position', 'Velocity'])).toBe(3);
      expect(registry.getMask(['Position', 'Health'])).toBe(5);
    });
  });

  describe('EntityManager', () => {
    it('should allocate unique sequential entity IDs', () => {
      const em = new EntityManager();
      const e1 = em.createEntity();
      const e2 = em.createEntity();
      const e3 = em.createEntity();

      expect(e1).toBe(1);
      expect(e2).toBe(2);
      expect(e3).toBe(3);
      expect(em.getAllEntities()).toEqual([1, 2, 3]);
    });

    it('should recycle destroyed entity IDs (LIFO/FIFO)', () => {
      const em = new EntityManager();
      const e1 = em.createEntity();
      const e2 = em.createEntity();
      expect(em.destroyEntity(e1)).toBe(true);
      expect(em.isAlive(e1)).toBe(false);
      expect(em.isAlive(e2)).toBe(true);

      const e3 = em.createEntity();
      expect(e3).toBe(e1); // Recycled e1 ID
      expect(em.isAlive(e3)).toBe(true);

      const e4 = em.createEntity();
      expect(e4).toBe(3); // Next available ID
    });

    it('should attach, retrieve, check, and remove components', () => {
      const em = new EntityManager();
      const e = em.createEntity();

      em.addComponent<Position>(e, 'Position', { x: 10, y: 20 }, 1);
      expect(em.hasComponent(e, 'Position')).toBe(true);
      expect(em.getComponent<Position>(e, 'Position')).toEqual({ x: 10, y: 20 });
      expect(em.getEntityComponents(e)).toEqual(['Position']);
      expect(em.getEntityMask(e)).toBe(1);

      em.removeComponent(e, 'Position', 1);
      expect(em.hasComponent(e, 'Position')).toBe(false);
      expect(em.getComponent<Position>(e, 'Position')).toBeUndefined();
      expect(em.getEntityMask(e)).toBe(0);
    });

    it('should clean up all attached components when entity is destroyed', () => {
      const em = new EntityManager();
      const e = em.createEntity();
      em.addComponent<Position>(e, 'Position', { x: 5, y: 5 }, 1);
      em.addComponent<Velocity>(e, 'Velocity', { vx: 1, vy: 0 }, 2);

      expect(em.destroyEntity(e)).toBe(true);
      expect(em.hasComponent(e, 'Position')).toBe(false);
      expect(em.hasComponent(e, 'Velocity')).toBe(false);
      expect(em.getEntityMask(e)).toBe(0);
    });
  });

  describe('World', () => {
    it('should coordinate entities and component queries', () => {
      const world = new World();

      const e1 = world.createEntity();
      const e2 = world.createEntity();
      const e3 = world.createEntity();

      world.addComponent<Position>(e1, 'Position', { x: 0, y: 0 });
      world.addComponent<Velocity>(e1, 'Velocity', { vx: 1, vy: 1 });

      world.addComponent<Position>(e2, 'Position', { x: 5, y: 5 });

      world.addComponent<Velocity>(e3, 'Velocity', { vx: -1, vy: 0 });
      world.addComponent<Health>(e3, 'Health', { current: 100, max: 100 });

      // Query tests
      const posVel = world.query(['Position', 'Velocity']);
      expect(posVel).toEqual([e1]);

      const posOnly = world.query(['Position']);
      expect(posOnly).toContain(e1);
      expect(posOnly).toContain(e2);
      expect(posOnly).not.toContain(e3);

      const velOnly = world.query(['Velocity']);
      expect(velOnly).toContain(e1);
      expect(velOnly).toContain(e3);
      expect(velOnly).not.toContain(e2);

      // Query without filters returns all entities
      expect(world.query([])).toEqual([e1, e2, e3]);
    });

    it('should register systems, sort by priority, and run updates', () => {
      const world = new World();

      const executionOrder: string[] = [];

      const sysA: System = {
        name: 'SysA',
        priority: 10,
        update: vi.fn(() => {
          executionOrder.push('SysA');
        }),
      };

      const sysB: System = {
        name: 'SysB',
        priority: 1,
        init: vi.fn(),
        update: vi.fn(() => {
          executionOrder.push('SysB');
        }),
      };

      world.addSystem(sysA);
      world.addSystem(sysB);

      expect(sysB.init).toHaveBeenCalledWith(world);
      expect(world.getSystems()[0]).toBe(sysB);
      expect(world.getSystems()[1]).toBe(sysA);

      world.update(1 / 60);

      expect(sysB.update).toHaveBeenCalledWith(world, 1 / 60);
      expect(sysA.update).toHaveBeenCalledWith(world, 1 / 60);
      expect(executionOrder).toEqual(['SysB', 'SysA']);
    });

    it('should support entity modification in system updates', () => {
      const world = new World();
      const e = world.createEntity();
      world.addComponent<Position>(e, 'Position', { x: 0, y: 0 });
      world.addComponent<Velocity>(e, 'Velocity', { vx: 10, vy: 20 });

      const movementSystem: System = {
        name: 'MovementSystem',
        update: (w, dt) => {
          const entities = w.query(['Position', 'Velocity']);
          for (const ent of entities) {
            const pos = w.getComponent<Position>(ent, 'Position')!;
            const vel = w.getComponent<Velocity>(ent, 'Velocity')!;
            pos.x += vel.vx * dt;
            pos.y += vel.vy * dt;
          }
        },
      };

      world.addSystem(movementSystem);
      world.update(0.5); // dt = 0.5s

      const pos = world.getComponent<Position>(e, 'Position');
      expect(pos?.x).toBe(5);
      expect(pos?.y).toBe(10);
    });

    it('should properly remove systems and clear world', () => {
      const world = new World();
      const destroyMock = vi.fn();
      const sys: System = {
        name: 'TestSystem',
        update: vi.fn(),
        destroy: destroyMock,
      };

      world.addSystem(sys);
      expect(world.getSystems().length).toBe(1);

      world.removeSystem(sys);
      expect(destroyMock).toHaveBeenCalledWith(world);
      expect(world.getSystems().length).toBe(0);

      const e = world.createEntity();
      world.clear();
      expect(world.isAlive(e)).toBe(false);
      expect(world.getAllEntities().length).toBe(0);
    });
  });
});
