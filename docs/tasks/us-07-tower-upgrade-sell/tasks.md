# Tasks: US-07 Tower Upgrade & Sell Lifecycle

**Parent Story**: [docs/user-stories.md#us-07-tower-upgrade--sell-lifecycle](../../user-stories.md#us-07-tower-upgrade--sell-lifecycle)  
**Overall Status**: Complete

---

## Task Breakdown

### TASK-07-01: Implement Tower Selection & Inspection Panel
**Status**: Complete  
**Description**: Allow clicking on an existing placed tower to open an inspection UI panel showing tower name, current tier, attack damage, range, fire rate, and target strategy. Deselect when clicking off-target.  
**Affected Surface**: `src/ui/TowerDetailPanel.ts`, `src/input/SelectionController.ts`  
**Completion Check**: Component UI test validating panel population with correct entity component attributes on click and closure on outside clicks.

---

### TASK-07-02: Implement Tower Upgrade Logic & Stat Progression
**Status**: Complete  
**Description**: Define Tier 1 $\rightarrow$ Tier 2 $\rightarrow$ Tier 3 stat formulas and upgrade costs. Implement upgrade action: check gold, deduct upgrade cost, increment tier component, update combat stats (damage/range/fire rate), and refresh visual sprite/range overlay.  
**Affected Surface**: `src/game/systems/TowerUpgradeSystem.ts`, `src/game/towers/TowerCatalog.ts`, `src/game/towers/TowerUpgradeDefinitions.ts`  
**Completion Check**: Unit tests verifying stat boosts and gold deductions for each tier upgrade, as well as rejection when gold is insufficient or maximum tier is reached.

---

### TASK-07-03: Implement Tower Sell Action, Refund Calculation & Tile Release
**Status**: Complete  
**Description**: Calculate sell refund value (70% of total cumulative gold spent on tower and its upgrades). On sell confirmation, credit refund to player gold, destroy the tower entity, free the underlying grid tile, and dismiss the selection panel.  
**Affected Surface**: `src/game/systems/TowerSellSystem.ts`, `src/game/map/TileGrid.ts`, `src/game/economy/EconomyState.ts`  
**Completion Check**: Integration tests verifying refund amount calculations, grid cell state change from occupied to buildable, and entity removal from ECS world.

---

## Acceptance Criteria Coverage

| Parent Acceptance Criterion | Implementing Task | Validation Check | Status |
|---|---|---|---|
| Placed tower selection shows stats & upgrade/sell menu | TASK-07-01 | Tower inspection UI test | Complete |
| Upgrade checks gold, increments tier & updates stats | TASK-07-02 | Upgrade logic & stat scaling test | Complete |
| Sell credits partial refund (70%), removes entity & frees tile | TASK-07-03 | Sell action & grid release test | Complete |
| Deselects and closes panel on empty ground click | TASK-07-01 | Selection dismissal test | Complete |
