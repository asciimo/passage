# Passage

A single-file, framework-free web app that visualizes time using a grid of falling squares. Built with vanilla JavaScript modules, SVG, and CSS.

## Getting Started

1. Open `index.html` in a web browser
2. The app will automatically start and log elapsed time to the console
3. Open browser developer tools to see the console output

## Development

### Dependencies
```bash
npm install
```

### Build / Run / Test
- Static site: open `index.html`
- Lint: `npm run lint`
- Unit tests: `npm test`
- E2E tests (future): `npm run test:e2e`

## Controls

- **Space**: Start/Pause the animation loop
- **R**: Restart the application
- **Esc**: Stop the application

## Files

- `index.html` - Main HTML entry point
- `app.js` - Main application logic and RAF loop
- `time.js` - Time management utilities
- `passage.js` - Visuals and rendering module (ready for future implementation)
- `styles.css` - Application styles with dark theme

## Features

- Single requestAnimationFrame loop that logs elapsed seconds
- Modular architecture with separated concerns
- No external dependencies for runtime
- Respects `prefers-reduced-motion` accessibility preference
- Keyboard controls for accessibility
- Dark theme with green accent colors
