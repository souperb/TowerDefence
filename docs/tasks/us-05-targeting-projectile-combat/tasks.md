# Tasks: US-05 Tower Targeting & Projectile Combat System

**Parent Story**: [docs/user-stories.md#us-05-tower-targeting--projectile-combat-system](../../user-stories.md#us-05-tower-targeting--projectile-combat-system)  
**Overall Status**: Complete

---

## Task Breakdown

### TASK-05-01: Implement Tower Targeting System & Strategy Algorithms
**Status**: Complete  
**Description**: Implement `TargetingSystem` with spatial distance checks and heuristic evaluation for targeting modes: *First* (furthest along path), *Lowest HP* (minimum current health), and *Closest* (minimal Euclidean distance to tower).  
**Affected Surface**: `src/game/systems/TargetingSystem.ts`, `src/game/towers/TargetingStrategies.ts`  
**Completion Check**: Unit tests verifying correct target entity selection for each heuristic under controlled multi-creep scenarios.

---

### TASK-05-02: Implement Tower Attack Cooldown & Firing System
**Status**: Complete  
**Description**: Manage tower attack timers, decrement cooldowns each tick, lock onto valid targets, trigger attack animations/audio triggers, and spawn projectile entities with designated speed and damage parameters.  
**Affected Surface**: `src/game/systems/TowerCombatSystem.ts`, `src/game/projectiles/ProjectileFactory.ts`  
**Completion Check**: Unit tests verifying attack cooldown countdowns, projectile spawn events, and fire-rate regulation.

---

### TASK-05-03: Implement Projectile Movement, Collision & Splash Damage System
**Status**: Complete  
**Description**: Implement `ProjectileSystem` simulating homing/ballistic projectile trajectories, collision detection upon reaching targets, single-target damage application, and area-of-effect (splash) damage distribution with distance falloff.  
**Affected Surface**: `src/game/systems/ProjectileSystem.ts`, `src/game/combat/DamageCalculator.ts`  
**Completion Check**: Unit tests checking projectile travel, impact detection, direct health deduction, splash radius damage checks, and entity recycling on impact.

---

### TASK-05-04: Implement Tower Target Mode Toggle UI & Controls
**Status**: Complete  
**Description**: Enable players to click an existing tower to cycle its targeting strategy (*First* $\rightarrow$ *Lowest HP* $\rightarrow$ *Closest*) and display the active strategy mode badge in the UI.  
**Affected Surface**: `src/ui/TowerDetailPanel.ts`, `src/game/systems/TowerControlSystem.ts`  
**Completion Check**: Component UI test verifying strategy state cycles on user click and updates the target strategy component on the entity.

---

## Acceptance Criteria Coverage

| Parent Acceptance Criterion | Implementing Task | Validation Check | Status |
|---|---|---|---|
| Target selection heuristics (First, Lowest HP, Closest) | TASK-05-01 | Targeting algorithm unit tests | Complete |
| Projectile entity spawning on attack cooldown trigger | TASK-05-02 | Firing cooldown & spawn unit test | Complete |
| Impact collision, damage application, entity recycling | TASK-05-03 | Collision & damage integration test | Complete |
| Area-of-effect splash damage scaling | TASK-05-03 | Splash radius calculation test | Complete |
| Tower targeting strategy cycling toggle | TASK-05-04 | Target strategy cycling test | Complete |
