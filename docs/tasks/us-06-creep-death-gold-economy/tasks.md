# Tasks: US-06 Creep Death, Gold Economy & Score System

**Parent Story**: [docs/user-stories.md#us-06-creep-death-gold-economy--score-system](../../user-stories.md#us-06-creep-death-gold-economy--score-system)  
**Overall Status**: Complete

---

## Task Breakdown

### TASK-06-01: Implement Creep Death Cleanup & Bounty Award System
**Status**: Complete  
**Description**: Monitor creep entities for health $\le 0$. Upon zero health, dispatch creep death events, trigger visual death feedback, award the creep's bounty gold to the player economy, and safely destroy/recycle the entity.  
**Affected Surface**: `src/game/systems/CreepDeathSystem.ts`, `src/game/economy/EconomyState.ts`  
**Completion Check**: Unit tests confirming that zero-health creeps award exact configured gold amounts, dispatch death events, and are removed from the active entity pool.

---

### TASK-06-02: Implement Score Tracking & Difficulty Multiplier
**Status**: Complete  
**Description**: Implement score accumulator system tracking points from defeated creeps, wave clear bonuses, and applying multipliers based on current game speed/difficulty settings.  
**Affected Surface**: `src/game/scoring/ScoreManager.ts`, `src/game/scoring/ScoreCalculator.ts`  
**Completion Check**: Unit tests checking score accrual across multiple kill events and multiplier calculations.

---

### TASK-06-03: Implement Economy & Score Event Dispatching to HUD
**Status**: Complete  
**Description**: Emit decoupled events (`GoldChanged`, `ScoreChanged`, `CreepKilled`) through the engine event bus to immediately update UI labels and visual popups.  
**Affected Surface**: `src/core/events/EngineEvents.ts`, `src/ui/HudPresenter.ts`  
**Completion Check**: Event listener tests asserting that UI view model states update synchronously when gold/score change events are dispatched.

---

## Acceptance Criteria Coverage

| Parent Acceptance Criterion | Implementing Task | Validation Check | Status |
|---|---|---|---|
| Zero-health creep recycling & bounty gold credited | TASK-06-01 | Creep death & gold award test | Complete |
| Score increases based on creep value and multiplier | TASK-06-02 | Score accumulation test | Complete |
| Real-time event propagation to player HUD | TASK-06-03 | HUD event listener test | Complete |

