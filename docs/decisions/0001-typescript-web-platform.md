# ADR-0001: TypeScript Web Platform and Canvas Rendering

**Date**: 2026-09-03  
**Status**: Accepted  
**Deciders**: Project Architecture Team

## Context
We need to select the platform and technology stack for the initial v1 release of the 2D Tower Defence game. The requirements include rapid development cycles, zero-install accessibility across desktop and mobile browsers, strong typing for game logic, and performant 60 FPS 2D graphics rendering.

## Decision
We will build the application using **TypeScript (modern ESM)** targeted at modern Web platforms, using HTML5 Canvas / WebGL for rendering and standard browser Web APIs (Pointer Events, Web Audio, Web Storage).

## Considered Alternatives
| Option | Pros | Cons |
|--------|------|------|
| **TypeScript + Web Canvas (Chosen)** | Zero-install, cross-platform instant play, rich ecosystem, fast iteration, easy CI/CD hosting | Single-threaded without Workers; garbage collection vigilance required |
| **.NET MAUI (C#)** | Native cross-platform desktop/mobile packaging, single C# codebase | Heavier runtime footprint, install friction, platform-specific UI nuances |
| **Godot / Unity Engine** | Out-of-the-box physics, scene editor, particle engine | Larger export binaries, less transparent version-controlled code, heavier web export overhead |

## Consequences
- **Positive**: Direct web distribution without store approvals; fast debugging using browser devtools; seamless integration with web UI overlays.
- **Negative / Trade-offs**: Need custom implementations for sprite batching, grid management, and audio playback rather than relying on an all-in-one game engine.
- **Risks**: Memory churn from high entity counts if object pooling is not strictly maintained.

## References
- [docs/architecture.md](../architecture.md)
