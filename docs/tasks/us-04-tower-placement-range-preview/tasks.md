# Tasks: US-04 Tower Placement, Range Preview & Grid Snapping

**Parent Story**: [docs/user-stories.md#us-04-tower-placement-range-preview--grid-snapping](../../user-stories.md#us-04-tower-placement-range-preview--grid-snapping)  
**Overall Status**: Complete

---

## Task Breakdown

### TASK-04-01: Implement Tower Definitions & Tower ECS Components
**Status**: Complete  
**Description**: Define `TowerComponent` attributes (towerType, tier, range, fireRate, cooldownRemaining, targetStrategy, baseCost) and configuration definitions for initial tower catalog (Archer, Cannon, Mage).  
**Affected Surface**: `src/game/towers/TowerComponents.ts`, `src/game/towers/TowerCatalog.ts`, `src/game/towers/TowerFactory.ts`  
**Completion Check**: Unit tests verifying tower archetype costs, base stats, and factory instantiation into ECS entities.

---

### TASK-04-02: Implement Placement Ghost Preview & Range Indicator
**Status**: Complete  
**Description**: Implement interactive placement preview rendering: follow cursor snapped to grid, render semi-transparent tower sprite and translucent circular attack range overlay. Colorize range green for valid coordinates and red for invalid coordinates.  
**Affected Surface**: `src/rendering/PlacementRenderer.ts`, `src/input/PlacementController.ts`  
**Completion Check**: Canvas render validation showing range circle accurately reflecting tower range radius and color changes on hover over invalid tiles.

---

### TASK-04-03: Implement Tower Build Action, Tile Locking & Gold Validation
**Status**: Complete  
**Description**: Connect pointer click events during placement mode to gold affordability checks and tile availability validation. On success, deduct gold, instantiate tower entity, and mark grid tile as occupied. Handle Escape key and right-click to cancel placement mode.  
**Affected Surface**: `src/game/systems/PlacementSystem.ts`, `src/game/economy/EconomyManager.ts`, `src/game/map/TileGrid.ts`  
**Completion Check**: Integration tests asserting gold deduction, tile occupancy state change, entity creation, and rejection when gold is insufficient or tile is blocked.

---

## Acceptance Criteria Coverage

| Parent Acceptance Criterion | Implementing Task | Validation Check | Status |
|---|---|---|---|
| Placement ghost & range circle follows cursor | TASK-04-02 | Placement preview render test | Complete |
| Deduct gold, create entity, mark tile occupied on valid click | TASK-04-03 | Build action integration test | Complete |
| Reject placement on insufficient funds or invalid tile | TASK-04-03 | Placement rejection assertion test | Complete |
| Cancel placement mode on Escape or cancel action | TASK-04-03 | Placement cancellation handler test | Complete |
