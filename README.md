# Passage

A single-file, framework-free web app that visualizes time using a grid of falling squares. Built with vanilla JavaScript modules, SVG, and CSS.

## Getting Started

### Quick Start (Local Development)
```bash
npm install
npm run dev        # serves on http://localhost:3000
```

Then open http://localhost:3000 and check the browser console for the elapsed-time
output.

The app **must be served over HTTP** — it loads its modules with
`<script type="module">`, and browsers block ES module loading from `file://`
because an opaque origin fails the CORS check. `npm run dev` starts a small
static server built on Node builtins (`scripts/serve.js`); no dependency needed.

### Docker Deployment

#### Production Deployment
```bash
# Build and run production container
docker build -t passage:prod .
docker run -d -p 8080:80 --name passage passage:prod

# Or use docker compose
docker compose up -d passage
```

The app will be available at http://localhost:8080

#### Development with Docker
```bash
# Build and run development container with tests
docker build --target development -t passage:dev .
docker run -p 3000:3000 passage:dev

# Or use docker compose for development
docker compose up passage-dev
```

#### Running Tests in Docker
```bash
# Run tests only
docker build --target test -t passage:test .

# Or use docker compose
docker compose run --rm passage-test
```

#### Docker Health Check
The production container includes a health check endpoint at `/health` that returns "healthy" when the service is running correctly.

## Development

### Dependencies
```bash
npm install
```

### Build / Run / Test
- Serve locally: `npm run dev` (http://localhost:3000)
- Lint: `npm run lint`
- Unit tests: `npm test`
- E2E tests: `npm run test:e2e` (first run needs `npx playwright install chromium`)

### Docker Services
- `passage`: Production nginx-based container (port 8080)
- `passage-dev`: Development container with live reload (port 3000)
- `passage-test`: Test-only container that runs tests and exits

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
- `Dockerfile` - Multi-stage Docker configuration
- `docker-compose.yml` - Docker Compose services
- `nginx.conf` - Production nginx configuration
- `scripts/serve.js` - Dependency-free static server for local development

## Features

- Single requestAnimationFrame loop that logs elapsed seconds
- Modular architecture with separated concerns
- No external dependencies for runtime
- Respects `prefers-reduced-motion` accessibility preference
- Keyboard controls for accessibility
- Dark theme with green accent colors
- Dockerized for easy deployment and testing
