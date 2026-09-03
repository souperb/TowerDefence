# ADR-0002: Entity Component System (ECS) Architecture for Game Simulation

**Date**: 2026-09-03  
**Status**: Accepted  
**Deciders**: Project Architecture Team

## Context
A Tower Defence game requires updating hundreds of active entities concurrently (e.g., swarms of creeps, dozens of defensive towers, hundreds of fast-moving projectiles, and area-of-effect zones). A traditional Object-Oriented deep inheritance hierarchy (`GameObject -> Actor -> Creep -> Boss`) often suffers from tight coupling, rigid behaviors, and cache-unfriendly data organization.

## Decision
We will adopt an **Entity Component System (ECS)** architecture for the core game engine.
- **Entities**: Simple unique numeric IDs representing objects.
- **Components**: Pure data structs/interfaces (Position, Velocity, Health, Creep, Tower, Projectile, Renderable).
- **Systems**: Pure logic functions/classes operating over entities matching specific component masks (`MovementSystem`, `TargetingSystem`, `CombatSystem`, `WaveSystem`).

## Considered Alternatives
| Option | Pros | Cons |
|--------|------|------|
| **ECS (Chosen)** | Clean separation of state and logic; extreme modularity; high performance; trivial serialization of game state | Slight conceptual learning curve; requires disciplined component query modeling |
| **Object-Oriented Hierarchy** | Familiar mental model; quick to prototype single-entity interactions | Fragile base classes; diamond dependency problems (e.g. flying creeps, tower buffs); hard to serialize |
| **Actor Model / Event-Driven Agents** | Highly isolated entity lifecycle | Overkill for single-threaded synchronous tick loop; message passing latency overhead |

## Consequences
- **Positive**: Adding new tower abilities or creep attributes is purely additive (attaching new components without touching class hierarchies); game ticks are deterministic and testable in headless unit tests.
- **Negative / Trade-offs**: Boilerplate for component definitions and queries.
- **Risks**: None significant for 2D tower defence scope.

## References
- [docs/architecture.md](../architecture.md)
