# Tasks: US-03 Creep Spawning & Waypoint Navigation

**Parent Story**: [docs/user-stories.md#us-03-creep-spawning--waypoint-navigation](../../user-stories.md#us-03-creep-spawning--waypoint-navigation)  
**Overall Status**: Complete

---

## Task Breakdown

### TASK-03-01: Implement Creep ECS Components & Entity Definitions
**Status**: Complete  
**Description**: Define `CreepComponent`, `PathFollowerComponent`, `HealthComponent`, `PositionComponent`, and `VelocityComponent` data structures and prefab factories for basic, fast, tank, and boss creep archetypes.  
**Affected Surface**: `src/game/creeps/CreepComponents.ts`, `src/game/creeps/CreepFactory.ts`  
**Completion Check**: Unit tests validating correct initialization of speed, health, gold bounty, and waypoint tracking components for each creep type.

---

### TASK-03-02: Implement Waypoint Navigation & Movement System
**Status**: Complete  
**Description**: Implement the `MovementSystem` in the ECS tick loop to advance creep positions along ordered waypoint vectors, update orientation/rotation, and track total distance traveled.  
**Affected Surface**: `src/game/systems/MovementSystem.ts`, `src/core/math/Vector2.ts`  
**Completion Check**: Unit tests verifying waypoint transitions, exact corner turns, and constant movement speed over multiple tick intervals.

---

### TASK-03-03: Implement Wave Spawner System
**Status**: Complete  
**Description**: Create the `WaveSpawnerSystem` that consumes scripted wave definitions, manages spawn interval timers, and instantiates creep entities at entrance coordinates.  
**Affected Surface**: `src/game/systems/WaveSpawnerSystem.ts`, `src/game/waves/WaveDefinition.ts`  
**Completion Check**: Unit tests verifying wave spawn sequences, delays between creeps, and spawn completion events.

---

### TASK-03-04: Implement Base Breach Lifecycle & Overhead Health Bar Rendering
**Status**: Complete  
**Description**: Detect when a creep reaches the final exit waypoint, dispatch base breach events with damage payload, remove the creep entity, and implement overhead interpolated health bars for active creeps.  
**Affected Surface**: `src/game/systems/BaseBreachSystem.ts`, `src/rendering/CreepRenderer.ts`, `src/core/events/EngineEvents.ts`  
**Completion Check**: Unit test asserting base breach events and life reduction payload; visual inspection of overhead health bar scaling with damage taken.

---

## Acceptance Criteria Coverage

| Parent Acceptance Criterion | Implementing Task | Validation Check | Status |
|---|---|---|---|
| Creep spawn intervals with configured HP/speed/bounty | TASK-03-01, TASK-03-03 | Wave spawn sequence unit test | Complete |
| Smooth movement along ordered path waypoints | TASK-03-02 | Waypoint movement step test | Complete |
| Base breach reduces lives & removes creep | TASK-03-04 | Base breach event assertion test | Complete |
| Overhead health bar reflects remaining HP % | TASK-03-04 | Creep render & health bar check | Complete |

