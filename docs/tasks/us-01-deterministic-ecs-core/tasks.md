# Tasks: US-01 Deterministic ECS Core & Fixed Game Loop

**Parent Story**: [docs/user-stories.md#us-01-deterministic-ecs-core--fixed-game-loop](../../user-stories.md#us-01-deterministic-ecs-core--fixed-game-loop)  
**Overall Status**: Complete

---

## Task Breakdown

### TASK-01-01: Implement ECS World and Entity Manager
**Status**: Complete  
**Description**: Build a lightweight TypeScript ECS World that supports unique numeric entity allocation, component pool registration, entity recycling, and fast component queries.  
**Affected Surface**: `src/core/ecs/World.ts`, `src/core/ecs/EntityManager.ts`, `src/core/ecs/Component.ts`  
**Completion Check**: Unit tests validating entity creation, component attachment/detachment, entity recycling, and query filtering.

---

### TASK-01-02: Implement Fixed-Step Game Loop with Interpolation
**Status**: Complete  
**Description**: Implement the central game loop ticking simulation systems at a fixed 60 Hz interval ($16.67\text{ ms}$) using an accumulator pattern while running `requestAnimationFrame` for rendering. Calculate interpolation alpha ($\alpha$) for smooth rendering.  
**Affected Surface**: `src/core/loop/GameLoop.ts`, `src/core/loop/Time.ts`  
**Completion Check**: Loop tests verifying fixed tick step invariance regardless of simulated render delta variations (30 FPS vs 120 FPS).

---

### TASK-01-03: Implement Spiral-of-Death Protection & Time Scaling
**Status**: Complete  
**Description**: Add a maximum tick clamp (max 5 ticks per render frame) to prevent spiral-of-death freeze during frame stalls. Implement pause/resume and speed multipliers (1x, 2x, 4x) modifying simulation tick rates without breaking fixed internal deltas.  
**Affected Surface**: `src/core/loop/GameLoop.ts`, `src/core/loop/TimeControls.ts`  
**Completion Check**: Unit tests verifying tick clamping when artificial lag spikes occur, and verifying tick counts scale accurately under 1x, 2x, and 4x speed settings.

---

## Acceptance Criteria Coverage

| Parent Acceptance Criterion | Implementing Task | Validation Check | Status |
|---|---|---|---|
| 60 Hz fixed tick simulation | TASK-01-02 | Tick interval timing test | Complete |
| Render interpolation $\alpha$ | TASK-01-02 | Alpha calculation unit test | Complete |
| Pause / resume state halt | TASK-01-03 | Pause state update test | Complete |
| Spiral-of-death max 5 ticks clamp | TASK-01-03 | Lag spike simulation test | Complete |
| 1x, 2x, 4x speed scaling | TASK-01-03 | Speed multiplier test | Complete |
