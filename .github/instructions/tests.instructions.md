---
applyTo: "**/*.{test,spec}.{js,ts}"
---

# Testing conventions (Passage)
- Prefer pure time-math tests (`time.js`) and spawn scheduling determinism.
- Keep tests fast and isolated; no real timers—use spies or injected clocks.
- For DOM: prefer jsdom + DOM APIs; avoid brittle selector assertions.
- Name: unit tests `test/*.test.js` (the glob `npm test` runs); Playwright e2e
  `test/e2e/*.spec.js`. Table-driven where helpful.
- Reset shared globals in a per-test helper. The unit tests stub browser APIs on
  `global`, which is a module-level singleton, so anything a test overrides leaks
  into later tests unless it is reinstalled.

