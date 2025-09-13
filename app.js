/**
 * Passage - Main application entry point
 */

class PassageApp {
    constructor() {
        this.isRunning = false;
        this.animationFrameId = null;
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
        
        console.log('Passage app initialized');
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
        
        // Log elapsed seconds to console as required
        console.log(`Elapsed: ${elapsedTime.toFixed(2)}s`);
        
        // Render frame
        passageRenderer.render(deltaTime, elapsedTime);
        
        // Schedule next frame
        this.animationFrameId = requestAnimationFrame(() => this.loop());
    }
}

// Initialize and start the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const app = new PassageApp();
    app.init();
    app.start();
});