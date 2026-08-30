/**
 * Passage - Main visuals and rendering module
 * Previously known as gridfall.js in the specification
 */

import { computeLayout } from './layout.js';

/**
 * Session length used until real session configuration exists. Six hours is the
 * worked example in the spec. PSG-07 (controls), PSG-11 (focus window) and
 * PSG-15 (URL params) each replace part of this.
 */
const DEFAULT_SESSION_SECONDS = 6 * 3600;

class PassageRenderer {
    constructor() {
        this.initialized = false;
        this.layout = null;
    }

    /**
     * Initialize the renderer
     */
    init() {
        this.layout = computeLayout({
            durationSec: DEFAULT_SESSION_SECONDS,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight
        });

        console.log(
            `Passage renderer initialized: ${this.layout.squareCount} squares, ` +
            `${this.layout.cadenceSec}s cadence, ${this.layout.unitPx}px units, ` +
            `${this.layout.columns}x${this.layout.rows} grid`
        );
        this.initialized = true;
    }
    
    /**
     * Render a frame
     * @param {number} deltaTime - Time since last frame in seconds
     * @param {number} elapsedTime - Total elapsed time in seconds
     */
    render(deltaTime, elapsedTime) {
        if (!this.initialized) {
            this.init();
        }
        
        // Placeholder for future rendering logic
        // This will be expanded as the app develops
    }
    
    /**
     * Clean up resources
     */
    destroy() {
        console.log('Passage renderer destroyed');
        this.initialized = false;
    }
}

// Global renderer instance
const passageRenderer = new PassageRenderer();

// Make passageRenderer available globally
globalThis.passageRenderer = passageRenderer;

// Export the class for testing
export { PassageRenderer };