/**
 * Time utilities for Passage
 */

class TimeManager {
    constructor() {
        this.startTime = performance.now();
        this.lastTime = this.startTime;
    }
    
    /**
     * Get elapsed time since start in seconds
     */
    getElapsedSeconds() {
        return (performance.now() - this.startTime) / 1000;
    }
    
    /**
     * Get delta time since last frame in seconds
     */
    getDeltaSeconds() {
        const currentTime = performance.now();
        const delta = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        return delta;
    }
    
    /**
     * Reset the timer
     */
    reset() {
        this.startTime = performance.now();
        this.lastTime = this.startTime;
    }
}

// Global time manager instance
const timeManager = new TimeManager();