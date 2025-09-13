---
applyTo: "**/*.{test,spec}.{js,ts}"
---

# Testing conventions (Passage)
- Prefer pure time-math tests (`time.js`) and spawn scheduling determinism.
- Keep tests fast and isolated; no real timers—use spies or injected clocks.
- For DOM: prefer jsdom + DOM APIs; avoid brittle selector assertions.
- Name: `*.spec.js`, table-driven where helpful.

