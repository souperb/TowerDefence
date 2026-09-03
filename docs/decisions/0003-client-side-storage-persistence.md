# ADR-0003: Client-Side Storage for Game Progress and Settings

**Date**: 2026-09-03  
**Status**: Accepted  
**Deciders**: Project Architecture Team

## Context
The v1 release requires persisting player preferences (audio volumes, display toggles, game speed), unlocked levels, high scores, and active session checkpoints without requiring a backend server infrastructure or user authentication.

## Decision
We will use a layered browser storage approach:
- **`localStorage`** for fast synchronous access to user settings and lightweight progression flags (completed levels, high scores).
- **`IndexedDB` / structured JSON snapshot** for larger game state saves (mid-wave checkpoint saves, tower placements).
- **Fallback In-Memory Storage** if browser storage APIs are blocked by privacy modes.

## Considered Alternatives
| Option | Pros | Cons |
|--------|------|------|
| **Layered Web Storage (LocalStorage + IndexedDB) (Chosen)** | Zero backend dependency; works completely offline; instant read/write; easily exportable to JSON | Data is tied to browser profile; vulnerable to user clearing browser data |
| **Backend REST API / Cloud Database** | Cross-device synchronization; persistent user accounts | Requires backend infrastructure, server hosting costs, auth flows, and online connectivity |
| **File System Access API (Direct Save Files)** | Explicit user control over save files (.json) | Requires manual file save/load dialogs on each session |

## Consequences
- **Positive**: Zero operational overhead; full offline support via PWA/static hosting.
- **Negative / Trade-offs**: Saves are local to the user's browser device and instance.
- **Risks**: Schema evolution must be versioned (`version: 1`) to ensure backwards compatibility when loading older local storage payloads.

## References
- [docs/architecture.md](../architecture.md)
