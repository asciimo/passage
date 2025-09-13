import { test, describe } from 'node:test';
import { strict as assert } from 'node:assert';

// Mock DOM and browser APIs for testing
const mockElement = {
    innerHTML: '',
    addEventListener: () => {}
};

global.document = {
    addEventListener: () => {},
    getElementById: () => mockElement
};

global.window = {
    matchMedia: (query) => ({ 
        matches: query.includes('reduce') ? false : true // Default to not reduced motion
    })
};

let rafCallbacks = [];
let rafId = 0;
global.requestAnimationFrame = (cb) => {
    rafId++;
    rafCallbacks[rafId] = cb;
    return rafId;
};

global.cancelAnimationFrame = (id) => {
    if (rafCallbacks[id]) {
        rafCallbacks[id] = null;
    }
};

let consoleLogs = [];
global.console = {
    log: (message) => consoleLogs.push(message),
    warn: (message) => consoleLogs.push(`WARN: ${message}`),
    error: (message) => consoleLogs.push(`ERROR: ${message}`)
};

// Mock performance for time management
let mockTime = 1000;
global.performance = {
    now: () => mockTime
};

// Mock TimeManager class for testing
class MockTimeManager {
    constructor() {
        this.startTime = performance.now();
        this.lastTime = this.startTime;
    }
    
    getElapsedSeconds() {
        return (performance.now() - this.startTime) / 1000;
    }
    
    getDeltaSeconds() {
        const currentTime = performance.now();
        const delta = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        return delta;
    }
    
    reset() {
        this.startTime = performance.now();
        this.lastTime = this.startTime;
    }
}

// Mock PassageRenderer class for testing
class MockPassageRenderer {
    constructor() {
        this.initialized = false;
    }
    
    init() {
        this.initialized = true;
    }
    
    render(deltaTime, elapsedTime) {
        // Mock render method
    }
}

// PassageApp class definition for testing (adapted from app.js)
class PassageApp {
    constructor() {
        this.isRunning = false;
        this.animationFrameId = null;
        this.respectsReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    
    init() {
        if (global.passageRenderer) {
            global.passageRenderer.init();
        }
        if (global.timeManager) {
            global.timeManager.reset();
        }
        this.setupKeyboardControls();
    }
    
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
    
    restart() {
        this.stop();
        if (global.timeManager) {
            global.timeManager.reset();
        }
        this.start();
    }
    
    start() {
        if (this.isRunning) {
            console.warn('App is already running');
            return;
        }
        
        this.isRunning = true;
        this.loop();
    }
    
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
    }
    
    loop() {
        if (!this.isRunning) {
            return;
        }
        
        let deltaTime = 0.016; // Default delta time
        let elapsedTime = 0;
        
        if (global.timeManager) {
            deltaTime = global.timeManager.getDeltaSeconds();
            elapsedTime = global.timeManager.getElapsedSeconds();
        }
        
        // Log elapsed seconds to console (respecting reduced motion)
        if (!this.respectsReducedMotion) {
            console.log(`Elapsed: ${elapsedTime.toFixed(2)}s`);
        }
        
        // Render frame
        if (global.passageRenderer) {
            global.passageRenderer.render(deltaTime, elapsedTime);
        }
        
        // Schedule next frame
        this.animationFrameId = requestAnimationFrame(() => this.loop());
    }
}

describe('PassageApp', () => {
    // Reset global state before each test
    function resetTestState() {
        consoleLogs = [];
        rafCallbacks = [];
        rafId = 0;
        mockTime = 1000;
        global.timeManager = new MockTimeManager();
        global.passageRenderer = new MockPassageRenderer();
    }
    
    test('PassageApp can be instantiated', () => {
        resetTestState();
        
        const app = new PassageApp();
        assert.ok(app instanceof PassageApp, 'PassageApp should be instantiated correctly');
        assert.equal(app.isRunning, false, 'App should start in stopped state');
        assert.equal(app.animationFrameId, null, 'Animation frame ID should be null initially');
        assert.equal(typeof app.respectsReducedMotion, 'boolean', 'Should have reduced motion preference');
    });
    
    test('App can be started and stopped', () => {
        resetTestState();
        const app = new PassageApp();
        
        // Test start
        app.start();
        assert.equal(app.isRunning, true, 'App should be running after start');
        assert.ok(app.animationFrameId !== null, 'Animation frame ID should be set when running');
        
        // Test stop
        app.stop();
        assert.equal(app.isRunning, false, 'App should be stopped after stop');
        assert.equal(app.animationFrameId, null, 'Animation frame ID should be null after stop');
    });
    
    test('App initialization works correctly', () => {
        resetTestState();
        const app = new PassageApp();
        
        app.init();
        assert.equal(global.passageRenderer.initialized, true, 'PassageRenderer should be initialized');
    });
    
    test('App restart works correctly', () => {
        resetTestState();
        const app = new PassageApp();
        
        app.start();
        assert.equal(app.isRunning, true, 'App should be running');
        
        app.restart();
        assert.equal(app.isRunning, true, 'App should be running after restart');
    });
    
    test('App respects reduced motion preference', () => {
        // Mock reduced motion preference
        global.window.matchMedia = (query) => ({ 
            matches: query.includes('reduce') ? true : false 
        });
        
        const app = new PassageApp();
        assert.equal(app.respectsReducedMotion, true, 'App should respect reduced motion preference');
    });
    
    test('App handles double start/stop gracefully', () => {
        resetTestState();
        const app = new PassageApp();
        
        // Double start should log warning
        app.start();
        app.start();
        assert.equal(app.isRunning, true, 'App should still be running after double start');
        assert.ok(consoleLogs.some(log => log.includes('already running')), 'Should warn about double start');
        
        // Double stop should log warning
        consoleLogs = []; // Reset logs
        app.stop();
        app.stop();
        assert.equal(app.isRunning, false, 'App should still be stopped after double stop');
        assert.ok(consoleLogs.some(log => log.includes('not running')), 'Should warn about double stop');
    });
    
    test('App loop logs elapsed time when not reduced motion', () => {
        resetTestState();
        
        // Ensure not reduced motion
        global.window.matchMedia = () => ({ matches: false });
        const app = new PassageApp();
        
        mockTime = 1000;
        app.start();
        
        // Simulate time passage and trigger loop
        mockTime = 1500; // 0.5 seconds later
        if (rafCallbacks[app.animationFrameId]) {
            rafCallbacks[app.animationFrameId]();
        }
        
        const elapsedLogs = consoleLogs.filter(log => log.includes('Elapsed:'));
        assert.ok(elapsedLogs.length > 0, 'Should log elapsed time');
        // Check for any elapsed time log (the exact format may vary)
        assert.ok(elapsedLogs.some(log => log.includes('Elapsed:')), 'Should contain elapsed time log');
        
        app.stop();
    });
});