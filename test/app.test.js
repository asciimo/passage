import { test, describe } from 'node:test';
import { strict as assert } from 'node:assert';

// Mock browser APIs before importing the classes
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

// Mock the global instances that the app depends on
global.timeManager = {
    getElapsedSeconds: () => (mockTime - 1000) / 1000,
    getDeltaSeconds: () => 0.016,
    reset: () => {}
};

global.passageRenderer = {
    init: () => {},
    render: () => {}
};

// Import the actual classes after setting up mocks
import { PassageApp } from '../app.js';

describe('PassageApp', () => {
    // Reset global state before each test
    function resetTestState() {
        consoleLogs = [];
        rafCallbacks = [];
        rafId = 0;
        mockTime = 1000;
        
        // Reset mock timeManager
        global.timeManager = {
            getElapsedSeconds: () => (mockTime - 1000) / 1000,
            getDeltaSeconds: () => 0.016,
            reset: () => {}
        };
        
        // Reset mock passageRenderer
        global.passageRenderer = {
            initialized: false,
            init: function() { this.initialized = true; },
            render: () => {}
        };
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
        global.timeManager.getElapsedSeconds = () => (mockTime - 1000) / 1000;
        
        if (rafCallbacks[app.animationFrameId]) {
            rafCallbacks[app.animationFrameId]();
        }
        
        const elapsedLogs = consoleLogs.filter(log => log.includes('Elapsed:'));
        assert.ok(elapsedLogs.length > 0, 'Should log elapsed time');
        assert.ok(elapsedLogs.some(log => log.includes('Elapsed:')), 'Should contain elapsed time log');
        
        app.stop();
    });
});