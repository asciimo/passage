/**
 * Passage - Main application entry point
 */

class PassageApp {
    constructor() {
        this.isRunning = false;
        this.animationFrameId = null;
        this.respectsReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    
    /**
     * Initialize the application
     */
    init() {
        console.log('Passage app starting...');
        
        // Initialize renderer
        passageRenderer.init();
        
        // Reset time manager
        timeManager.reset();
        
        // Setup keyboard controls for accessibility
        this.setupKeyboardControls();
        
        console.log('Passage app initialized');
    }
    
    /**
     * Setup keyboard controls for accessibility
     */
    setupKeyboardControls() {
        document.addEventListener('keydown', (event) => {
            switch (event.code) {
                case 'Space':
                    event.preventDefault();
                    if (this.isRunning) {
                        this.stop();
                    } else {
                        this.start();
                    }
                    break;
                case 'KeyR':
                    event.preventDefault();
                    this.restart();
                    break;
                case 'Escape':
                    event.preventDefault();
                    this.stop();
                    break;
            }
        });
    }
    
    /**
     * Restart the application
     */
    restart() {
        this.stop();
        timeManager.reset();
        this.start();
        console.log('Passage app restarted');
    }
    
    /**
     * Start the main loop
     */
    start() {
        if (this.isRunning) {
            console.warn('App is already running');
            return;
        }
        
        this.isRunning = true;
        this.loop();
    }
    
    /**
     * Stop the main loop
     */
    stop() {
        if (!this.isRunning) {
            console.warn('App is not running');
            return;
        }
        
        this.isRunning = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        console.log('Passage app stopped');
    }
    
    /**
     * Main animation loop
     */
    loop() {
        if (!this.isRunning) {
            return;
        }
        
        // Get time information
        const deltaTime = timeManager.getDeltaSeconds();
        const elapsedTime = timeManager.getElapsedSeconds();
        
        // Log elapsed seconds to console as required (but respect reduced motion)
        if (!this.respectsReducedMotion) {
            console.log(`Elapsed: ${elapsedTime.toFixed(2)}s`);
        }
        
        // Render frame
        passageRenderer.render(deltaTime, elapsedTime);
        
        // Schedule next frame
        this.animationFrameId = requestAnimationFrame(() => this.loop());
    }
}

// Initialize and start the app when the page loads (only in browser, not during testing)
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        const app = new PassageApp();
        app.init();
        app.start();
    });
}

// Export the class for testing
export { PassageApp };