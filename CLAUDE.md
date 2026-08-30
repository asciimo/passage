# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"Passage" visualizes the passing of time as a grid of squares that erode from a reservoir and fall into a pile. Framework-free vanilla JS modules + SVG + CSS, served as a static page with no build step.

Current state: only the skeleton (PSG-01) is implemented — a RAF loop that logs elapsed seconds. `passage.js` rendering is a stub.

## Commands

The Node version is pinned in `.nvmrc` (22); both workflows read it via
`node-version-file`, so CI and local stay in step. Run `nvm use` once per shell.

Node is installed via nvm and is **not** on the default non-interactive PATH, so
for a one-off non-interactive command prefix it with:
`export PATH="$HOME/.nvm/versions/node/v22.19.0/bin:$PATH"`

```bash
npm ci                   # lockfile is committed
npm run dev              # static server on :3000 (scripts/serve.js, node builtins only)
npm run lint             # eslint . --max-warnings=0 (eslint 8, legacy .eslintrc.json)
npm test                 # node --test test/*.test.js
node --test test/time.test.js                        # single file
node --test --test-name-pattern="reset" test/*.test.js  # single test
npm run test:e2e         # playwright, chromium; first run: npx playwright install chromium
```

Running the app: it **must be served over HTTP** — `npm run dev`, then
http://localhost:3000. Opening `index.html` from disk does not work: the three
`<script type="module">` tags are CORS-checked and a `file://` page is an opaque
origin, so Chrome blocks all three modules and neither singleton is ever defined.

`docker compose up passage` serves the production nginx image on :8080 (health at
`/health`); `docker compose run --rm passage-test` runs the suite and exits.

## Architecture

Three ES modules loaded in fixed order by `index.html`: `time.js`, `passage.js`, `app.js`.

The modules use a **dual global/export pattern** that is easy to break:

- `time.js` and `passage.js` each construct a singleton (`timeManager`, `passageRenderer`), assign it to `globalThis`, and `export` only the *class* for testing.
- `app.js` reads those singletons as bare globals — it does **not** import them. The `<script>` order in `index.html` is therefore load-bearing, and the singleton names are declared in `.eslintrc.json`'s `globals` block.
- `app.js` self-starts on `DOMContentLoaded`, guarded by `typeof document !== 'undefined'` so importing it under Node doesn't launch the app.

**New modules should not extend that pattern.** `layout.js` (PSG-04) exports plain
functions and is imported normally by `passage.js` — no singleton, no `globalThis`,
no `<script>` tag in `index.html` (the browser resolves the import). The singleton
pattern exists only because `app.js` reads globals instead of importing; anything
with no shared instance state should just be an ordinary module.

Consequence for tests: `test/app.test.js` must install `global.document`, `global.window.matchMedia`, `global.requestAnimationFrame`, `global.performance`, and stub `global.timeManager` / `global.passageRenderer` **before** the `import` of `app.js`. Node hoists imports, so the mocks live at module top level in statement order, not inside a `beforeEach`. Those mocks are singletons: anything a test overrides must be reinstalled in `resetTestState()`, or it leaks into every later test. `test/e2e/load.spec.js` guards the same pattern from the browser side.

`TimeManager` is `performance.now()`-based: `getElapsedSeconds()` / `getDeltaSeconds()` / `reset()`. Tests replace `global.performance` with a controllable fake clock — never use real timers.

`layout.js` holds the sizing math (PSG-04): `computeCadence()` picks seconds-per-square from the duration tiers, and `computeLayout()` returns `{squareCount, cadenceSec, unitPx, columns, rows}` for a session and viewport. It is pure and deterministic — PSG-03's erosion order depends on identical inputs always yielding the same grid. When a grid overflows, it shrinks `unitPx` toward the 12px floor first and only then slows the cadence.

## Constraints (from `.github/copilot-instructions.md` and the spec)

- No frameworks, no runtime dependencies, no network calls. Persistence is `localStorage` only.
- A single `requestAnimationFrame` loop drives all updates; never `setInterval` for logic.
- Animate with transforms only; minimal DOM churn, no layout thrash. Reuse a pool of SVG `<rect>` nodes for falling squares (target ≤ ~8 active nodes, ≤3 concurrent physics bodies). Target CPU ≤3–5% fullscreen.
- Respect `prefers-reduced-motion` in both CSS (media query gate) and JS.
- SVG: `viewBox`-based sizing, no hard-coded pixel dimensions; group layers as reservoir / active / pile.
- CSS: drive unit size and colors from CSS variables (`--unit-px`); graph-paper background via pixel-aligned `repeating-linear-gradient`.
- Keyboard access for every control; dark theme with a high-contrast variant.

## Roadmap

The **GitHub issues are the backlog of record** — PSG-02…PSG-15 are open as issues #2–#15, grouped into M1 (MVP), M2 (ribbons & scheduling), M3 (enhanced feel). Read the issue before implementing it; commits and PRs are titled `PSG-NN: …`.

`scratch/passage_issues.tsv` is the local seed those issues were generated from, and carries the same numeric spec — cadence tiers (≥4h → 10s/square, 1–4h → 6s, <1h → 3s), 12px minimum unit size, deterministic erosion order. Note that `scratch/` is gitignored and untracked, so it exists only on the machine that created it; never assume a collaborator or CI can see it.

## Conventions

- Conventional commit messages (`feat:`, `fix:`, `docs:`, `refactor:`, `perf:`, `test:`, `chore:`).
- Prefer small PRs; add or adjust unit tests alongside new logic.
- `.github/workflows/ci.yml` runs lint + unit tests + e2e on every push to `main` and every PR. Run all three locally before pushing.
- Unit tests are `test/*.test.js` (what `npm test` globs); Playwright e2e specs are `test/e2e/*.spec.js`, deliberately outside that glob so the suites stay separate.
- `npm run lint` runs with `--max-warnings=0`, so a warning fails CI. `no-unused-vars` is set to `args: "none"` because stub signatures like `PassageRenderer.render(deltaTime, elapsedTime)` are expected while the renderer is unimplemented.
