# Tasks: US-10 Player HUD & Canvas Responsive Layout

**Parent Story**: [docs/user-stories.md#us-10-player-hud--canvas-responsive-layout](../../user-stories.md#us-10-player-hud--canvas-responsive-layout)  
**Overall Status**: Complete

---

## Task Breakdown

### TASK-10-01: Implement Player HUD Overlay Component
**Status**: Complete  
**Description**: Build the top/side HUD bar rendering real-time metrics: Gold balance, Remaining Lives, Current Score, Wave indicator (e.g., "Wave 3 / 10"), and Simulation Speed toggle button (1x / 2x / 4x / Pause).  
**Affected Surface**: `src/ui/HudView.ts`, `src/ui/HudPresenter.ts`, `src/style.css`  
**Completion Check**: Component UI test validating correct DOM element updates when state signals fire from the engine event bus.

---

### TASK-10-02: Implement Build Bar & Tower Selection Toolbar
**Status**: Complete  
**Description**: Implement the bottom build dock displaying available tower cards with icons, names, and gold costs. Add visual disabled styling when gold is insufficient to purchase a tower type.  
**Affected Surface**: `src/ui/BuildToolbar.ts`, `src/ui/TowerCardComponent.ts`  
**Completion Check**: UI test verifying tower card selection triggers placement mode and cards disable/enable reactively as gold balance changes.

---

### TASK-10-03: Implement Keyboard Shortcuts & Touch Control Accessibility
**Status**: Complete  
**Description**: Bind global keyboard shortcuts (`Space` = Pause/Resume, `1-3` = Select Tower, `[`/`]` or keys for speed adjustment). Ensure touch targets for mobile/tablet browsers meet accessibility minimums ($\ge 44 \times 44\text{ px}$) and prevent browser gesture conflicts.  
**Affected Surface**: `src/input/KeyboardShortcuts.ts`, `src/input/TouchManager.ts`, `src/style.css`  
**Completion Check**: Automated shortcut action tests and responsive layout checks across desktop and mobile viewport breakpoints.

---

## Acceptance Criteria Coverage

| Parent Acceptance Criterion | Implementing Task | Validation Check | Status |
|---|---|---|---|
| Real-time display of Gold, Lives, Score, Wave, Speed | TASK-10-01 | HUD state binding test | Complete |
| Tower build bar with affordability disabled states | TASK-10-02 | Build bar reactivity test | Complete |
| Keyboard hotkeys (Space, 1-3, Speed) | TASK-10-03 | Keyboard shortcut handler test | Complete |
| Touch targets $\ge 44 \times 44\text{ px}$ & responsive sizing | TASK-10-03 | Mobile viewport CSS check | Complete |
