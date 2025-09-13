# Copilot Instructions – Passage

## Project purpose
“Passage” is a single-file, framework-free web app that visualizes time using a grid of falling squares. Keep the app minimal, efficient, and readable.

## Tech constraints
- No frameworks. Vanilla JS modules + SVG + CSS.
- One `requestAnimationFrame` loop drives updates; no `setInterval` for logic.
- Respect `prefers-reduced-motion`. Keep CPU ≤ ~3–5% fullscreen.
- No network calls. Persist only to `localStorage`.

## Build / run / test
- Static site: open `index.html`.
- Lint: `npm run lint`
- Unit tests (logic): `npm test`
- Playwright E2E (later): `npm run test:e2e`

## Repo conventions
- Files: `index.html`, `app.js`, `time.js`, `passage.js`, `styles.css`.
- Functions: small, pure, and named. Avoid hidden globals.
- Commit messages: Conventional style (feat/fix/docs/refactor/perf/test/chore).
- Accessibility: keyboard for Start/Pause/Reset/Fullscreen; high-contrast theme.

## Definition of done (PRs created by Copilot)
- ✅ Acceptance criteria in linked issue are met.
- ✅ Lints & tests pass locally and in CI.
- ✅ Code is documented where non-obvious; update README if needed.
- ✅ Minimal DOM churn; transforms for animation; no layout thrash.
- ✅ Add/adjust unit tests for new logic.

## Out of scope for Copilot
- Security-sensitive changes, auth, or PII handling.
- Broad, architecture-level refactors without an approved plan.

## Review hints
- Prefer small PRs.
- If a reviewer comments with `@copilot`, address all comments in one pass.

