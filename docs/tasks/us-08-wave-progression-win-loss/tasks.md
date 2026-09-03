# Tasks: US-08 Wave Progression & Win/Loss Game State

**Parent Story**: [docs/user-stories.md#us-08-wave-progression--win-loss-game-state](../../user-stories.md#us-08-wave-progression--win-loss-game-state)  
**Overall Status**: Complete

---

## Task Breakdown

### TASK-08-01: Implement Wave Controller & Inter-Wave Countdown State
**Status**: Complete  
**Description**: Manage wave progression states (Preparation, Spawning, InProgress, WaveCompleted). Handle auto-start countdown timer, manual "Start Wave Now" trigger button, and wave index tracking.  
**Affected Surface**: `src/game/state/WaveManager.ts`, `src/game/waves/WaveSequence.ts`  
**Completion Check**: Unit tests checking state transitions across waves, timer countdowns, and immediate wave start trigger.

---

### TASK-08-02: Implement Victory & Game Over State Machine
**Status**: Complete  
**Description**: Implement condition evaluation in `GameStateSystem`: trigger Victory when all configured waves are cleared and lives $> 0$; trigger Game Over immediately when lives $\le 0$. Halt game simulation on either terminal state.  
**Affected Surface**: `src/game/systems/GameStateSystem.ts`, `src/game/state/GameStateMachine.ts`  
**Completion Check**: Unit tests asserting transition to Victory when last creep is defeated on final wave, and transition to Game Over when lives hit zero.

---

### TASK-08-03: Implement Victory/Defeat Overlays & Level Reset Flow
**Status**: Complete  
**Description**: Create UI modal views for Victory (displaying final score, stars, replay button, next level) and Game Over (displaying wave reached, score, retry button). Implement level reset handler restoring clean initial map/economy state.  
**Affected Surface**: `src/ui/GameOverModal.ts`, `src/ui/VictoryModal.ts`, `src/game/state/LevelResetHandler.ts`  
**Completion Check**: Component UI tests verifying button callbacks and integration tests validating that state reset returns lives, gold, and grid to exact level starting values.

---

## Acceptance Criteria Coverage

| Parent Acceptance Criterion | Implementing Task | Validation Check | Status |
|---|---|---|---|
| Wave start on button click or timer expiry | TASK-08-01 | Wave start trigger test | Complete |
| Victory modal on final wave clear with lives $> 0$ | TASK-08-02, TASK-08-03 | Victory state trigger test | Complete |
| Game Over modal & simulation halt when lives $\le 0$ | TASK-08-02, TASK-08-03 | Defeat state trigger test | Complete |
| Level restart cleanly resets gold, lives, grid, and waves | TASK-08-03 | Level reset integration test | Complete |
